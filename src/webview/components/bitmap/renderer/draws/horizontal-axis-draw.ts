import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import { BaseAxisDraw, type AxisRenderState } from './base-axis-draw';

export class HorizontalAxisDraw extends BaseAxisDraw {
  constructor(engine: BitmapGridEngine) {
    super(engine, 'xAxis');
  }

  protected renderAxisLine(state: AxisRenderState): void {
    this.renderTitle({ x: -23, y: state.area.height -25, text: 'WL', align: 'center', verticalAlign: 'middle' });
    this.addLine([-30, state.area.height - 22, -4, state.area.height - 1], 2);
    this.addLine([0, state.area.height - 1, state.area.width, state.area.height - 1]);
  }

  protected renderTicks(state: AxisRenderState): void {
    const step = this.calculateStep(state.totalCols);
    const firstTick = Math.max(0, state.visibleRange.startCol);
    const lastTick = Math.min(state.visibleRange.endCol + 1, state.totalCols);

    for (let col = firstTick; col <= lastTick; col ++) {
      if (col < 0 || col > state.totalCols) {
        continue;
      }

      const x = col * state.cellSize - state.scrollX;
      if (x < 0 || x > state.area.width) {
        continue;
      }

      if(col % step === 0){
        this.addLine([x, state.area.height - 10, x, state.area.height - 1]);
        this.addLabel({
          x: x - 2,
          y: state.area.height - 28,
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
