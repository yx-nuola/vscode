import type { BitmapGridEngine } from '../../core/BitmapGridEngine';
import { BaseAxisDraw, type AxisRenderState } from './BaseAxisDraw';

export class HorizontalAxisDraw extends BaseAxisDraw {
  constructor(engine: BitmapGridEngine) {
    super(engine, 'xAxis');
  }

  protected renderAxisLine(state: AxisRenderState): void {
    this.addLine([0, state.area.height - 1, state.area.width, state.area.height - 1]);
  }

  protected renderTicks(state: AxisRenderState): void {
    const step = this.calculateStep(state.totalCols);
    const firstTick = Math.ceil(state.visibleRange.startCol / step) * step;
    const lastTick = Math.min(state.visibleRange.endCol + step, state.totalCols);

    for (let col = firstTick; col <= lastTick; col ++) {
      if (col < 0 || col > state.totalCols) {
        continue;
      }

      const x = col * state.cellSize - state.scrollX;

      if(col % step === 0){
        this.addLine([x, state.area.height - 10, x, state.area.height - 1]);
        this.addLabel({
          x: x - 2,
          y: state.area.height - 20,
          text: col.toString(),
          align: 'center',
          verticalAlign: 'top',
        });
      }else{
        this.addLine([x, state.area.height - 6, x, state.area.height - 1]);
      }
      
    }
  }
}
