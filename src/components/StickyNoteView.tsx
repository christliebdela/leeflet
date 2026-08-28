import React from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { Item, Project } from '../types';
import { X, MoreHorizontal } from 'lucide-react';

export const StickyNoteView: React.FC = () => {
  const { stickyNoteItemId, setStickyNoteItemId, items, projects, updateItem } = useLeafStore();

  const item = items.find((i: Item) => i.id === stickyNoteItemId);
  if (!item || !stickyNoteItemId) return null;

  const project = projects.find((p: Project) => p.id === item.projectId);

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-[#fef9c3] border border-[#fef08a] rounded-[6px] shadow-sticky p-3.5 text-[#713f12] z-40 animate-in slide-in-from-bottom-5 duration-150 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#fef08a]/80">
        <div className="text-xs font-semibold tracking-tight text-[#713f12]">
          {project?.name || 'Backlog'} — <span className="capitalize">{item.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-[#fef08a] rounded-[4px] text-[#854d0e] transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setStickyNoteItemId(null)}
            className="p-1 hover:bg-[#fef08a] rounded-[4px] text-[#854d0e] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="py-2.5">
        <div className="text-xs font-bold text-[#451a03] leading-snug mb-1">
          {item.title}
        </div>
        {item.content && (
          <p className="text-[11.5px] text-[#78350f] line-clamp-4 leading-relaxed whitespace-pre-wrap">
            {item.content}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="pt-1.5 border-t border-[#fef08a]/80 flex items-center justify-between text-[9.5px] uppercase font-bold tracking-wider text-[#a16207]">
        <span>{item.type} • {project?.name || 'Backlog'}</span>
        <button
          onClick={async () => {
            await updateItem({ ...item, status: item.status === 'done' ? 'in_progress' : 'done' });
          }}
          className="hover:underline font-semibold"
        >
          {item.status === 'done' ? 'Mark Incomplete' : 'Mark Done'}
        </button>
      </div>
    </div>
  );
};
