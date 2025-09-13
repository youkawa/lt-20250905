"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';
import { markdownToSafeHtml } from '@/lib/markdown';
import { sanitizeHtml } from '@/lib/html';
import { JupyterOutput } from '@/components/jupyter/JupyterOutput';
import type { ReportContentItem, CodeOutput } from '@/types/api';

export function ReportCanvas({
  items,
  onReorder,
  onRemove,
}: {
  items: ReportContentItem[];
  onReorder: (next: ReportContentItem[]) => void;
  onRemove: (index: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const ids = useMemo(() => items.map((_, i) => i.toString()), [items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);
    onReorder(next);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className="space-y-2">
          {items.map((it, i) => (
            <SortableRow key={ids[i]} id={ids[i]} index={i} item={it} onRemove={() => onRemove(i)} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  index,
  item,
  onRemove,
}: {
  id: string;
  index: number;
  item: ReportContentItem;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <li ref={setNodeRef} style={style} className={`border rounded p-3 bg-white ${isDragging ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xs text-slate-500 mb-1">#{index + 1} {item.type || 'item'}</div>
          {'origin' in item && item.origin && (
            <div className="text-xs text-slate-400 mb-1">出所: {item.origin.notebookName} / #{item.origin.cellIndex}</div>
          )}
          {item.type === 'notebook_markdown' && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(item.source || '') }}
            />
          )}
          {item.type === 'notebook_code' && (
            <div>
              <pre className="text-sm whitespace-pre-wrap bg-slate-50 p-2 rounded border">{item.source}</pre>
              {Array.isArray(item.outputs) && item.outputs.length > 0 && (
                <div className="text-xs text-slate-700 mt-2 space-y-2">
                  {item.outputs.map((o: CodeOutput, i: number) => (
                    <div key={i} className="border rounded p-2">
                      <JupyterOutput output={o} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {item.type === 'text_box' && (
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content || '') }} />
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            className="px-2 py-1 text-xs border rounded hover:bg-slate-50 cursor-grab"
            {...attributes}
            {...listeners}
            aria-label="ドラッグで並べ替え"
          >
            並替
          </button>
          <button className="text-xs text-red-700 hover:underline" onClick={onRemove}>
            削除
          </button>
        </div>
      </div>
    </li>
  );
}
