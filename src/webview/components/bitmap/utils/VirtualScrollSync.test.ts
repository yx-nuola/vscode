import { describe, expect, test } from 'vitest';
import { VirtualScrollSync } from './virtual-scrollSync';

describe('VirtualScrollSync scrollbar conversion', () => {
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
    const nextScrollX = sync.getScrollXFromSlider(
      currentScrollbar.sliderX + 100,
      640
    );

    expect(nextScrollX).toBeGreaterThan(120);
  });

  test('converts the changed vertical slider position with vertical track geometry', () => {
    const sync = new VirtualScrollSync(1024, 128, 10);
    sync.updateViewport(640, 480);

    const currentScrollbar = sync.getScrollbarState(120, 3200, 12, 480);
    const nextScrollY = sync.getScrollYFromSlider(
      currentScrollbar.sliderY + 100,
      480
    );

    expect(nextScrollY).toBeGreaterThan(3200);
  });
});
