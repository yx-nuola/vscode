import { describe, expect, test } from 'vitest';
import { LayoutCalculator } from './layout-calculator';
import { DEFAULT_CELL_SIZE, SCROLL, START_POSITION, PADDING } from '../constants';

const layoutConfig = {
  axisSize: START_POSITION,
  scrollbarSize: SCROLL,
  spacing: PADDING,
};

describe('LayoutCalculator', () => {
  test('uses content height for 64x64 data when the viewport is taller than 896px', () => {
    const calculator = new LayoutCalculator(layoutConfig);

    calculator.updateContentSize(64, 64, DEFAULT_CELL_SIZE);
    const layout = calculator.calculate(956, 1200);

    expect(layout.cellArea.width).toBe(896);
    expect(layout.cellArea.height).toBe(896);
    expect(layout.horizontalScrollbar.height).toBe(0);
    expect(layout.verticalScrollbar.width).toBe(0);
    expect(layout.horizontalScrollbar.y).toBe(940);
  });

  test('uses available viewport height for tall data', () => {
    const calculator = new LayoutCalculator(layoutConfig);

    calculator.updateContentSize(1024, 128, DEFAULT_CELL_SIZE);
    const layout = calculator.calculate(956, 1200);

    expect(layout.cellArea.width).toBe(896);
    expect(layout.cellArea.height).toBe(1140);
    expect(layout.horizontalScrollbar.height).toBe(SCROLL);
    expect(layout.verticalScrollbar.width).toBe(SCROLL);
  });
});
