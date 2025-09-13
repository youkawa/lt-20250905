import { render } from '@testing-library/react';
import { vi } from 'vitest';

import { ReportCanvas } from './ReportCanvas';

// Mock dnd-kit modules to capture onDragEnd and bypass DOM APIs
let capturedOnDragEnd: any;
vi.mock('@dnd-kit/core', async () => {
  return {
    DndContext: ({ onDragEnd, children }: any) => {
      capturedOnDragEnd = onDragEnd;
      return children;
    },
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
    PointerSensor: function () {},
    KeyboardSensor: function () {},
  } as any;
});

vi.mock('@dnd-kit/sortable', async () => {
  return {
    SortableContext: ({ children }: any) => children,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: null,
      isDragging: false,
    }),
    rectSortingStrategy: vi.fn(),
    arrayMove: (arr: any[], from: number, to: number) => {
      const copy = arr.slice();
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    },
  } as any;
});

describe('ReportCanvas DnD', () => {
  it('calls onReorder with new order after drag end', () => {
    const items = [{ n: 1 }, { n: 2 }, { n: 3 }];
    const onReorder = vi.fn();
    const onRemove = vi.fn();
    render(<ReportCanvas items={items} onReorder={onReorder} onRemove={onRemove} />);
    // simulate dragging first item to the end
    capturedOnDragEnd({ active: { id: '0' }, over: { id: '2' } });
    expect(onReorder).toHaveBeenCalled();
    const newOrder = onReorder.mock.calls[0][0];
    expect(newOrder.map((x: any) => x.n)).toEqual([2, 3, 1]);
  });
});

