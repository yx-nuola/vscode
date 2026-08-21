import { describe, expect, test } from 'vitest';
import { VirtualScrollSync } from './virtual-scrollSync';

describe('VirtualScrollSync scrollbar conversion', () => {
  test('returns an inclusive visible range without an extra boundary cell', () => {
    const sync = new VirtualScrollSync(128, 128, 7);
    sync.updateViewport(896, 896);

    expect(sync.getVisibleRange(0, 0)).toEqual({
      startCol: 0,
      endCol: 127,
      startRow: 0,
      endRow: 127,
    });
  });

  test('returns an empty range for empty data', () => {
    const sync = new VirtualScrollSync(0, 0, 7);
    sync.updateViewport(896, 896);

    expect(sync.getVisibleRange(0, 0)).toEqual({
      startCol: 0,
      endCol: -1,
      startRow: 0,
      endRow: -1,
    });
  });

  test('horizontal scrollbar geometry cannot represent vertical scroll', () => {
    const sync = new VirtualScrollSync(1024, 128, 10);
    sync.updateViewport(640, 480);

    const currentScrollbar = sync.getScrollbarState(120, 3200, 640, 12);

    expect(currentScrollbar.sliderY).toBe(0);
  });

  test('vertical scrollbar geometry cannot represent horizontal scroll', () => {
    const sync = new VirtualScrollSync(1024, 128, 10);
    sync.updateViewport(640, 480);

    const currentScrollbar = sync.getScrollbarState(120, 3200, 12, 480);

    expect(currentScrollbar.sliderX).toBe(0);
  });

  test('converts the changed horizontal slider position with horizontal track geometry', () => {
    const sync = new VirtualScrollSync(1024, 128, 10);
    sync.updateViewport(640, 480);

    const currentScrollbar = sync.getScrollbarState(120, 3200, 640, 12);
    const nextScrollX = sync.getScrollXFromSlider(currentScrollbar.sliderX + 100, 640);

    expect(nextScrollX).toBeGreaterThan(120);
  });

  test('converts the changed vertical slider position with vertical track geometry', () => {
    const sync = new VirtualScrollSync(1024, 128, 10);
    sync.updateViewport(640, 480);

    const currentScrollbar = sync.getScrollbarState(120, 3200, 12, 480);
    const nextScrollY = sync.getScrollYFromSlider(currentScrollbar.sliderY + 100, 480);

    expect(nextScrollY).toBeGreaterThan(3200);
  });

  test('never creates a slider larger than a very small track', () => {
    const sync = new VirtualScrollSync(1024, 1024, 14);
    sync.updateViewport(10, 10);

    const scrollbar = sync.getScrollbarState(0, 0, 8, 6);

    expect(scrollbar.sliderWidth).toBe(8);
    expect(scrollbar.sliderHeight).toBe(6);
    expect(scrollbar.sliderX).toBe(0);
    expect(scrollbar.sliderY).toBe(0);
  });

  test('does not enable scrolling for subpixel viewport differences', () => {
    const sync = new VirtualScrollSync(64, 64, 14);
    sync.updateViewport(895.75, 895.75);

    const scrollbar = sync.getScrollbarState(0, 0, 895.75, 895.75);

    expect(sync.maxScrollX).toBe(0);
    expect(sync.maxScrollY).toBe(0);
    expect(scrollbar.sliderWidth).toBe(895.75);
    expect(scrollbar.sliderHeight).toBe(895.75);
  });
});
