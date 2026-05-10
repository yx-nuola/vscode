import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import type { CellData } from '../types';
import { CellDraw } from '../draws/CellDraw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

export class CellLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private cellDraw: CellDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'cell' });
    this.cellDraw = new CellDraw(engine);
    this.layer.add(this.cellDraw.getGroup());
  }

  getLayer(): LayerType {
    return this.layer;
  }

  initialize(): void {
    const eventBus = this.engine.getEventBus();

    this.updateLayout();

    eventBus.on('scroll:change', () => {
      this.renderVisibleCells();
    });

    eventBus.on('zoom:change', () => {
      this.renderVisibleCells();
    });

    eventBus.on('locate', () => {
      this.renderVisibleCells();
    });

    eventBus.on('data:change', () => {
      this.renderVisibleCells();
    });

    this.renderVisibleCells();
  }

  updateLayout(): void {
    const layout = this.engine.getLayoutCalculator().calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    this.cellDraw.setPosition(layout.cellArea.x, layout.cellArea.y);
    this.cellDraw.setClip(layout.cellArea.width, layout.cellArea.height);
  }

  render(): void {
    this.updateLayout();
    this.renderVisibleCells();
  }

  private renderVisibleCells(): void {
    const virtualScrollSync = this.engine.getVirtualScrollSync();
    const dataManager = this.engine.getDataManager();
    const scrollState = this.engine.getScrollState();
    const visibleRange = virtualScrollSync.getVisibleRange(scrollState.scrollX, scrollState.scrollY);

    this.engine.getConfig().callbacks?.onViewportChange?.(visibleRange);

    const visibleCells: CellData[] = [];

    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
        const cell = dataManager.getCell(row, col);
        visibleCells.push(cell ?? { row, col, value: -1 });
      }
    }

    this.cellDraw.renderCells(visibleCells, scrollState.scrollX, scrollState.scrollY);
  }

  destroy(): void {
    this.cellDraw.destroy();
    this.layer.destroy();
  }
}
