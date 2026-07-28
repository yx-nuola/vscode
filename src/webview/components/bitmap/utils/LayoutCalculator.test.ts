import { describe, expect, test } from 'vitest';
import { LayoutCalculator } from './layout-calculator';
import { SCROLL, START_POSITION, PADDING } from '../constants';

const layoutConfig = {
  axisSize: START_POSITION,
  scrollbarSize: SCROLL,
  spacing: PADDING,
};

describe('LayoutCalculator', () => {
  test('uses content height for 64x64 data when the viewport is taller than 896px', () => {
    const calculator = new LayoutCalculator(layoutConfig);

    calculator.updateContentSize(64, 64);
    const layout = calculator.calculate(956, 1200);

    expect(layout.cellArea.width).toBe(896);
    expect(layout.cellArea.height).toBe(896);
    expect(layout.horizontalScrollbar.height).toBe(SCROLL);
    expect(layout.verticalScrollbar.width).toBe(SCROLL);
    expect(layout.horizontalScrollbar.y).toBe(944);
    expect(layout.verticalScrollbar.x).toBe(944);
  });

  test('uses the 64x64 default viewport for smaller data', () => {
    const calculator = new LayoutCalculator(layoutConfig);

    calculator.updateContentSize(5, 5);
    const layout = calculator.calculate(956, 1200);

    expect(layout.cellArea.width).toBe(896);
    expect(layout.cellArea.height).toBe(896);
    expect(layout.horizontalScrollbar.height).toBe(SCROLL);
    expect(layout.verticalScrollbar.width).toBe(SCROLL);
    expect(layout.verticalScrollbar.x).toBe(944);
  });

  test('uses all available viewport space for data larger than 64x64', () => {
    const calculator = new LayoutCalculator(layoutConfig);

    calculator.updateContentSize(1024, 128);
    const layout = calculator.calculate(1200, 1000);

    expect(layout.cellArea.width).toBe(1140);
    expect(layout.cellArea.height).toBe(940);
    expect(layout.horizontalScrollbar.height).toBe(SCROLL);
    expect(layout.verticalScrollbar.width).toBe(SCROLL);
  });

  test('shrinks a 64x64 viewport when the container is smaller than the ideal size', () => {
    const calculator = new LayoutCalculator(layoutConfig);

    calculator.updateContentSize(64, 64);
    const layout = calculator.calculate(700, 500);

    expect(layout.cellArea.width).toBe(640);
    expect(layout.cellArea.height).toBe(440);
    expect(layout.horizontalScrollbar.y).toBe(488);
    expect(layout.verticalScrollbar.x).toBe(688);
  });

  test('snaps subpixel ideal space to the full 896px viewport', () => {
    const calculator = new LayoutCalculator(layoutConfig);

    calculator.updateContentSize(64, 64);
    const layout = calculator.calculate(955.75, 955.75);

    expect(layout.cellArea.width).toBe(896);
    expect(layout.cellArea.height).toBe(896);
  });
});
