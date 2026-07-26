import Konva from 'konva';
import type { Context } from 'konva/lib/Context.js';
import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import type { CellData, ColorRule, VisibleRange } from '../../types';
import { EMPTY_CELL_VAL } from '../../constants';

const CELL_SHAPE_NAME = 'cell-shape';
const HIT_RECT_NAME = 'hit-area';
const MIN_CELL_SIZE_FOR_TEXT = 16;
const { Group, Shape, Rect } = Konva;
type GroupType = InstanceType<typeof Group>;
type RectType = InstanceType<typeof Rect>;

interface RenderState {
  visibleRange: VisibleRange
  cellSize: number
  scrollX: number
  scrollY: number
  theme: { borderColor: string; defaultCellColor: string; axisTextColor: string }
  colorRules: ColorRule[]
}

interface PreparedTextCell {
  x: number
  y: number
  value: number
}

interface RenderCache {
  key: string
  startX: number
  startY: number
  width: number
  height: number
  colorPaths: Array<[color: string, path: Path2D]>
  gridPath: Path2D | null
  textCells: PreparedTextCell[]
  fontSize: number
}

export class CellDraw {
  private engine: BitmapGridEngine;
  private group: GroupType;
  private shape: Konva.Shape;
  private lastState: RenderState | null;
  private renderCache: RenderCache | null;
  private cacheDirty: boolean;
  private lastHoveredCell: CellData | null;
  private hitRect: RectType | null;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.group = new Group({ name: 'cells' });
    this.shape = new Shape({
      name: CELL_SHAPE_NAME,
      listening: false,
      sceneFunc: (context) => {
        this.drawScene(context);
      },
    });
    this.group.add(this.shape);
    this.lastState = null;
    this.renderCache = null;
    this.cacheDirty = true;
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

  renderCells(visibleRange: VisibleRange, scrollX: number, scrollY: number): void {
    const config = this.engine.getConfig();
    const theme = config.theme;
    const colorRules = config.colorRules;
    const cellSize = this.engine.getZoomLevel();

    const state: RenderState = { visibleRange, cellSize, scrollX, scrollY, theme, colorRules };
    this.lastState = state;

    const cacheKey = this.getCacheKey(state);
    if (this.cacheDirty || this.renderCache?.key !== cacheKey) {
      this.renderCache = this.buildRenderCache(state, cacheKey);
      this.cacheDirty = false;
    }

    this.bindHitRectEvents();
    this.shape.getLayer()?.batchDraw();
  }

  /**
   * 数据、主题、缩放或颜色规则变化后，使预构建路径失效。
   */
  invalidateCache(): void {
    this.cacheDirty = true;
  }

  private getCacheKey(state: RenderState): string {
    const { visibleRange, cellSize, theme, colorRules } = state;
    const rangeKey = [
      visibleRange.startCol,
      visibleRange.endCol,
      visibleRange.startRow,
      visibleRange.endRow,
      cellSize,
    ].join(':');
    const themeKey = [
      theme.defaultCellColor,
      theme.borderColor,
      theme.axisTextColor,
    ].join(':');
    const rulesKey = colorRules
      .map((rule) => `${rule.min ?? ''}:${rule.max ?? ''}:${rule.color}:${rule.value ?? ''}`)
      .join('|');

    return `${rangeKey};${themeKey};${rulesKey}`;
  }

  private buildRenderCache(state: RenderState, key: string): RenderCache {
    const { visibleRange, cellSize, theme, colorRules } = state;
    const { startCol, endCol, startRow, endRow } = visibleRange;
    const dataManager = this.engine.getDataManager();
    const showText = cellSize >= MIN_CELL_SIZE_FOR_TEXT;
    const halfCellSize = cellSize / 2;
    const colorPaths = new Map<string, Path2D>();
    const textCells: PreparedTextCell[] = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = dataManager.getCell(row, col);
        if (!cell) {
          continue;
        }

        const colorRule = this.mapColor(cell.value, colorRules);
        if (showText) {
          textCells.push({
            x: col * cellSize + halfCellSize,
            y: row * cellSize + halfCellSize,
            value: colorRule?.value ?? 0,
          });
        }

        const fill = colorRule?.color ?? theme.defaultCellColor;
        if (fill === theme.defaultCellColor) {
          continue;
        }

        let colorPath = colorPaths.get(fill);
        if (!colorPath) {
          colorPath = new Path2D();
          colorPaths.set(fill, colorPath);
        }
        colorPath.rect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }

    const startX = startCol * cellSize;
    const startY = startRow * cellSize;
    const endX = (endCol + 1) * cellSize;
    const endY = (endRow + 1) * cellSize;
    const gridPath = theme.borderColor
      ? this.buildGridPath(startCol, endCol, startRow, endRow, cellSize)
      : null;

    return {
      key,
      startX,
      startY,
      width: endX - startX,
      height: endY - startY,
      colorPaths: Array.from(colorPaths),
      gridPath,
      textCells,
      fontSize: Math.max(8, Math.min(cellSize * 0.45, 12)),
    };
  }

  private buildGridPath(
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number,
    cellSize: number
  ): Path2D {
    const startX = startCol * cellSize;
    const startY = startRow * cellSize;
    const endX = (endCol + 1) * cellSize;
    const endY = (endRow + 1) * cellSize;
    const gridPath = new Path2D();

    for (let col = startCol; col <= endCol + 1; col++) {
      const x = col * cellSize;
      gridPath.moveTo(x, startY);
      gridPath.lineTo(x, endY);
    }
    for (let row = startRow; row <= endRow + 1; row++) {
      const y = row * cellSize;
      gridPath.moveTo(startX, y);
      gridPath.lineTo(endX, y);
    }

    return gridPath;
  }

  private drawScene(context: Context): void {
    const state = this.lastState;
    const cache = this.renderCache;
    if (!state || !cache) {
      return;
    }

    const { scrollX, scrollY, cellSize, theme } = state;
    context.save();
    context.translate(-scrollX, -scrollY);

    context.fillStyle = theme.defaultCellColor;
    context.fillRect(cache.startX, cache.startY, cache.width, cache.height);

    for (const [fill, path] of cache.colorPaths) {
      context.fillStyle = fill;
      context.fill(path);
    }

    if (cache.gridPath) {
      context.strokeStyle = theme.borderColor;
      context.lineWidth = 1;
      context.stroke(cache.gridPath);
    }

    if (cellSize >= MIN_CELL_SIZE_FOR_TEXT) {
      context.font = `bold ${cache.fontSize}px monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = theme.axisTextColor;
      for (const cell of cache.textCells) {
        context.fillText(String(cell.value), cell.x, cell.y);
      }
    }

    context.restore();
  }

  private bindHitRectEvents(): void {
    if (this.hitRect) { return; }

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
      if (!this.isSameCell(cell, this.lastHoveredCell)) {
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

  private getCellFromPointer(): CellData | null {
    const state = this.lastState;
    if (!state) { return null; }

    const stage = this.group.getStage();
    if (!stage) { return null; }

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) { return null; }

    const groupPos = this.group.getPosition();
    const localX = pointerPos.x - groupPos.x;
    const localY = pointerPos.y - groupPos.y;

    const { cellSize, scrollX, scrollY } = state;
    const col = Math.floor((localX + scrollX) / cellSize);
    const row = Math.floor((localY + scrollY) / cellSize);

    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const isInsideGrid =
      row >= 0 &&
      row < virtualScrollSync.getTotalRows() &&
      col >= 0 &&
      col < virtualScrollSync.getTotalCols();
    if (!isInsideGrid) {
      return null;
    }

    return this.engine.getDataManager().getCell(row, col) ?? {
      row,
      col,
      value: EMPTY_CELL_VAL,
    };
  }

  private isSameCell(first: CellData | null, second: CellData | null): boolean {
    if (!first || !second) {
      return first === second;
    }

    return first.row === second.row && first.col === second.col;
  }

  private mapColor(value: number, rules: ColorRule[]): ColorRule | undefined {
    if (!rules || !rules.length) { return undefined; }
    for (const rule of rules) {
      const { max, min } = rule || {};
      if (max !== undefined && min !== undefined && value >= min && value < max) {
        return rule;
      }

      if (min === undefined && max !== undefined && value < max) {
        return rule;
      }

      if (max === undefined && min !== undefined && min < value) {
        return rule;
      }
    }
    return undefined;
  }

  destroy(): void {
    this.group.destroy();
    this.lastState = null;
    this.renderCache = null;
    this.hitRect = null;
  }
}
