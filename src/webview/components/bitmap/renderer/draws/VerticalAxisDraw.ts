import type { BitmapGridEngine } from '../../core/BitmapGridEngine';
import { BaseAxisDraw, type AxisRenderState } from './BaseAxisDraw';

export class VerticalAxisDraw extends BaseAxisDraw {
  constructor(engine: BitmapGridEngine) {
    super(engine, 'yAxis');
  }

  protected renderAxisLine(state: AxisRenderState): void {
    this.addLine([state.area.width - 1, 0, state.area.width - 1, state.area.height]);
  }

  protected renderTicks(state: AxisRenderState): void {
    const step = this.calculateStep(state.totalRows);
    const firstTick = Math.ceil(state.visibleRange.startRow / step) * step;
    const lastTick = Math.min(state.visibleRange.endRow + step, state.totalRows);

    for (let row = firstTick; row <= lastTick; row += step) {
      if (row < 0 || row > state.totalRows) {
        continue;
      }

      const y = row * state.cellSize - state.scrollY;

      this.addLine([state.area.width - 6, y, state.area.width - 1, y]);
      this.addLabel({
        x: state.area.width - 20,
        y,
        text: row.toString(),
        align: 'right',
        verticalAlign: 'middle',
      });
    }
  }
}
