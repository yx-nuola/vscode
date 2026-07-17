import Konva from 'konva';
import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import type { CellData, ColorRule } from '../../types';
import { EMPTY_CELL_VAL } from '../../constants';

const CELL_SHAPE_NAME = 'cell-shape';
const HIT_RECT_NAME = 'hit-area';
const MIN_CELL_SIZE_FOR_TEXT = 16;
const { Group, Shape, Rect } = Konva;
type GroupType = InstanceType<typeof Group>;
type RectType = InstanceType<typeof Rect>;

interface RenderState {
  cells: CellData[]
  cellSize: number
  scrollX: number
  scrollY: number
  theme: { borderColor: string; defaultCellColor: string; axisTextColor: string }
  colorRules: ColorRule[]
}

export class CellDraw {
  private engine: BitmapGridEngine;
  private group: GroupType;
  private lastState: RenderState | null;
  private lastHoveredCell: CellData | null;
  private hitRect: RectType | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'cells' });
    this.lastState = null;
    this.lastHoveredCell = null;
    this.hitRect = null;
  }

  getGroup(): GroupType {
    return this.group;
  }

  setPosition(x: number, y: number): void {
    this.group.x(x);
    this.group.y(y);
  }

  setClip(width: number, height: number): void {
    this.group.clipX(0);
    this.group.clipY(0);
    this.group.clipWidth(width);
    this.group.clipHeight(height);
    if (this.hitRect) {
      this.hitRect.width(width);
      this.hitRect.height(height);
    }
  }

  renderCells(cells: CellData[], scrollX: number, scrollY: number): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const colorRules = config.colorRules;
    const cellSize = this.engine.getZoomLevel();

    const state: RenderState = { cells, cellSize, scrollX, scrollY, theme, colorRules };
    console.log('[CellDraw] renderCells', state);
    this.lastState = state;
    const shape = this.getOrCreateShape();

    shape.sceneFunc((context) => {
      const { cells, cellSize, scrollX, scrollY, theme, colorRules } = state;
      const showText = cellSize >= MIN_CELL_SIZE_FOR_TEXT;
      const fontSize = Math.max(8, Math.min(cellSize * 0.45, 12));

      for (const cell of cells) {
        const x = cell.col * cellSize - scrollX;
        const y = cell.row * cellSize - scrollY;
        const w = cellSize;
        const h = cellSize;

        let fill: string;
        let cellValue;
        if (cell.value === EMPTY_CELL_VAL) {
          fill = theme.defaultCellColor;
        } else {
          const { color= theme.defaultCellColor, value=0 } = this.mapColor(cell.value, colorRules) || {};
          fill = color;
          cellValue = value
        }

        context.beginPath();
        context.rect(x, y, w, h);
        context.closePath();

        context.fillStyle = fill;
        context.fill();

        if (theme.borderColor) {
          context.strokeStyle = theme.borderColor;
          context.lineWidth = 1;
          context.stroke();
        }

        if (showText && cell.value !== EMPTY_CELL_VAL) {
          context.font = `bold ${fontSize}px monospace`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillStyle = theme.axisTextColor;
          context.fillText(String(cellValue), x + w / 2, y + h / 2);
        }
      }
    });

    this.bindHitRectEvents();
    shape.getLayer()?.batchDraw();
  }

  private bindHitRectEvents(): void {
    if (this.hitRect) return;

    const clipWidth = this.group.clipWidth() || 0;
    const clipHeight = this.group.clipHeight() || 0;

    this.hitRect = new Rect({
      x: 0,
      y: 0,
      width: clipWidth,
      height: clipHeight,
      fill: 'transparent',
      name: HIT_RECT_NAME,
      listening: true,
    });

    this.hitRect.on('pointermove', () => {
      const cell = this.getCellFromPointer();
      if (cell !== this.lastHoveredCell) {
        this.lastHoveredCell = cell;
        this.engine.getEventBus().emit('cell:hover', cell);
      }
    });

    this.hitRect.on('click', () => {
      const cell = this.getCellFromPointer();
      if (cell) {
        this.engine.getEventBus().emit('cell:click', cell);
      }
    });

    this.hitRect.on('pointerleave', () => {
      if (this.lastHoveredCell) {
        this.lastHoveredCell = null;
        this.engine.getEventBus().emit('cell:hover', null);
      }
    });

    this.group.add(this.hitRect);
  }

    private getOrCreateShape(): Konva.Shape {
    let shape = this.group.findOne('.' + CELL_SHAPE_NAME) as Konva.Shape | undefined;
    if (!shape) {
      shape = new Shape({
        name: CELL_SHAPE_NAME,
        listening: false,
        sceneFunc: () => {},
      });
      this.group.add(shape);
    }
    return shape;
  }

  private getCellFromPointer(): CellData | null {
    const state = this.lastState;
    if (!state) return null;

    const stage = this.group.getStage();
    if (!stage) return null;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return null;

    const groupPos = this.group.getPosition();
    const localX = pointerPos.x - groupPos.x;
    const localY = pointerPos.y - groupPos.y;

    const { cells, cellSize, scrollX, scrollY } = state;
    const col = Math.floor((localX + scrollX) / cellSize);
    const row = Math.floor((localY + scrollY) / cellSize);

    for (const cell of cells) {
      if (cell.col === col && cell.row === row) {
        return cell;
      }
    }
    return null;
  }

  private mapColor(value: number, rules: ColorRule[]): ColorRule | undefined {
    if(!rules || !rules.length) return undefined;
    for (const rule of rules) {
      const { max, min} = rule || {};
      if (max && min && value >= min && value < max) {
        return rule;
      }

      if (min === undefined && max !== undefined &&  value < max) {
        return rule;
      }

      if (max === undefined && min !== undefined &&  min < value) {
        return rule;
      }
    }
    return undefined;
  }

  destroy(): void {
    this.group.destroy();
    this.lastState = null;
    this.hitRect = null;
  }
}

