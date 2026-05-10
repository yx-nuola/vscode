import Konva from 'konva';
import type { BitmapGridEngine } from '../core/BitmapGridEngine';
import { HighlightDraw } from '../draws/HighlightDraw';

const { Layer } = Konva;
type LayerType = InstanceType<typeof Layer>;

export class HighlightLayer {
  private layer: LayerType;
  private engine: BitmapGridEngine;
  private highlightDraw: HighlightDraw;

  constructor(engine: BitmapGridEngine) {
    this.engine = engine;
    this.layer = new Layer({ name: 'highlight' });
    this.highlightDraw = new HighlightDraw(engine);
    this.layer.add(this.highlightDraw.getGroup());
  }

  getLayer(): LayerType {
    return this.layer;
  }

  initialize(): void {
    const eventBus = this.engine.getEventBus();

    this.updateLayout();

    eventBus.on('highlight', (data) => {
      if (data) {
        this.highlightDraw.draw(data.col, data.row);
      } else {
        this.highlightDraw.clear();
      }
    });

    eventBus.on('clear-highlight', () => {
      this.highlightDraw.clear();
    });

    eventBus.on('selection:change', (cell) => {
      if (cell) {
        this.highlightDraw.draw(cell.col, cell.row);
      } else {
        this.highlightDraw.clear();
      }
    });

    eventBus.on('scroll:change', () => {
      this.redrawSelectedCell();
    });

    eventBus.on('zoom:change', () => {
      this.redrawSelectedCell();
    });

    eventBus.on('data:change', () => {
      this.redrawSelectedCell();
    });
  }

  updateLayout(): void {
    const layout = this.engine.getLayoutCalculator().calculate(
      this.engine.getStage()?.width() || 0,
      this.engine.getStage()?.height() || 0
    );

    this.highlightDraw.setPosition(layout.cellArea.x, layout.cellArea.y);
    this.highlightDraw.setClip(layout.cellArea.width, layout.cellArea.height);
  }

  render(): void {
    this.updateLayout();
    this.redrawSelectedCell();
  }

  private redrawSelectedCell(): void {
    const selectedCell = this.engine.getSelectedCell();

    if (selectedCell) {
      this.highlightDraw.draw(selectedCell.col, selectedCell.row);
    } else {
      this.highlightDraw.clear();
    }
  }

  destroy(): void {
    this.highlightDraw.destroy();
    this.layer.destroy();
  }
}
