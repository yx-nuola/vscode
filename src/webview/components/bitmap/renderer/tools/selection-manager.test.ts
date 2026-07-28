import { describe, expect, test, vi } from 'vitest';
import type { BitmapGridEngine } from '../../utils/bitmap-gridEngine';
import type { CellData } from '../../types';
import { EMPTY_CELL_VAL } from '../../constants';
import { EventBus } from '../../utils/EventBus';
import { SelectionManager } from './selection-manager';

function createManager(cell: CellData | null = null) {
  const eventBus = new EventBus();
  const engine = {
    getDataManager: () => ({
      getCell: vi.fn(() => cell),
    }),
    getVirtualScrollSync: () => ({
      getTotalCols: () => 128,
      getTotalRows: () => 128,
    }),
    getEventBus: () => eventBus,
  } as unknown as BitmapGridEngine;

  return { manager: new SelectionManager(engine), eventBus };
}

describe('SelectionManager', () => {
  test('selects and emits an existing data cell', () => {
    const cell: CellData = { row: 2, col: 3, value: 7 };
    const { manager, eventBus } = createManager(cell);
    const onSelectionChange = vi.fn();
    eventBus.on('selection:change', onSelectionChange);

    manager.selectCell(3, 2);

    expect(manager.getSelectedCell()).toBe(cell);
    expect(manager.isSelected(3, 2)).toBe(true);
    expect(onSelectionChange).toHaveBeenCalledWith(cell);
  });

  test('creates a selectable placeholder for an empty cell', () => {
    const { manager, eventBus } = createManager();
    const onSelectionChange = vi.fn();
    eventBus.on('selection:change', onSelectionChange);

    manager.selectCell(5, 4);

    const expectedCell: CellData = { row: 4, col: 5, value: EMPTY_CELL_VAL };
    expect(manager.getSelectedCell()).toEqual(expectedCell);
    expect(manager.isSelected(5, 4)).toBe(true);
    expect(onSelectionChange).toHaveBeenCalledWith(expectedCell);
  });

  test('clears the selected cell and emits null', () => {
    const { manager, eventBus } = createManager();
    const onSelectionChange = vi.fn();
    eventBus.on('selection:change', onSelectionChange);
    manager.selectCell(1, 1);

    manager.clearSelection();

    expect(manager.getSelectedCell()).toBeNull();
    expect(manager.isSelected(1, 1)).toBe(false);
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
  });

  test('returns false for coordinates other than the selected cell', () => {
    const { manager } = createManager();
    manager.selectCell(1, 2);

    expect(manager.isSelected(2, 1)).toBe(false);
  });

  test('ignores invalid or out-of-range coordinates', () => {
    const { manager, eventBus } = createManager();
    const onSelectionChange = vi.fn();
    eventBus.on('selection:change', onSelectionChange);

    manager.selectCell(-1, 0);
    manager.selectCell(128, 0);
    manager.selectCell(1.5, 0);

    expect(manager.getSelectedCell()).toBeNull();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
