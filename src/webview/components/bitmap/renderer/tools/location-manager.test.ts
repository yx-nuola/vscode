import { describe, expect, test, vi } from 'vitest';
import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import { VirtualScrollSync } from '../../utils/virtual-scrollSync';
import { LocationManager } from './location-manager';

function createManager(scrollX: number, scrollY: number) {
  const virtualScrollSync = new VirtualScrollSync(100, 100, 20);
  virtualScrollSync.updateViewport(100, 100);
  const scrollTo = vi.fn();
  const engine = {
    getVirtualScrollSync: () => virtualScrollSync,
    getScrollState: () => ({ scrollX, scrollY }),
    getLayout: () => ({ cellArea: { x: 0, y: 0, width: 100, height: 100 } }),
    scrollTo,
  } as unknown as BitmapGridEngine;

  return { manager: new LocationManager(engine), scrollTo };
}

describe('LocationManager.ensureCellVisible', () => {
  test('does not scroll when the selected cell is already fully visible', () => {
    const { manager, scrollTo } = createManager(100, 100);

    manager.ensureCellVisible(7, 7);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  test('scrolls only the minimum distance needed to reveal the cell', () => {
    const { manager, scrollTo } = createManager(100, 100);

    manager.ensureCellVisible(10, 11);

    expect(scrollTo).toHaveBeenCalledWith(120, 140);
  });

  test('moves back toward the origin when the cell is above and left of the viewport', () => {
    const { manager, scrollTo } = createManager(100, 100);

    manager.ensureCellVisible(3, 4);

    expect(scrollTo).toHaveBeenCalledWith(60, 80);
  });

  test('ignores cells outside the virtual grid', () => {
    const { manager, scrollTo } = createManager(100, 100);

    manager.ensureCellVisible(100, 100);

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
