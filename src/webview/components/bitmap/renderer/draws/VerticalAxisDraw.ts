import type { BitmapGridEngine } from '../../core/BitmapGridEngine';
import { BaseAxisDraw, type AxisRenderState } from './BaseAxisDraw';

export class VerticalAxisDraw extends BaseAxisDraw {
  constructor(engine: BitmapGridEngine) {
    super(engine, 'yAxis');
  }

  protected renderAxisLine(state: AxisRenderState): void {
    this.renderTitle({ x: state.area.width - 25, y: -18, text: 'BL', align: 'center', verticalAlign: 'middle' });
    this.addLine([state.area.width - 1, 0, state.area.width - 1, state.area.height]);
  }

  protected renderTicks(state: AxisRenderState): void {
    const step = this.calculateStep(state.totalRows);
    const firstTick = Math.max(0, state.visibleRange.startRow);
    const lastTick = Math.min(state.visibleRange.endRow + 1, state.totalRows);

    for (let row = firstTick; row <= lastTick; row ++) {
      if (row < 0 || row > state.totalRows) {
        continue;
      }
      const y = row * state.cellSize - state.scrollY;
      if (y < 0 || y > state.area.height) {
        continue;
      }
      if(row % step === 0){
        this.addLabel({
          x: state.area.width - 30,
          y: y - 6,
          text: row.toString(),
          align: 'right',
          verticalAlign: 'middle',
        });
        this.addLine([state.area.width - 10, y, state.area.width - 1, y]);
      }else{
        this.addLine([state.area.width - 6, y, state.area.width - 1, y]);
      }
    }
  }
}
