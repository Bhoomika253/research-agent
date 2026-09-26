import React from 'react';
import { X, Trash2, Clock, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { PaperAnalysis } from '../types/paper';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: PaperAnalysis[];
  onSelectPaper: (paper: PaperAnalysis) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectPaper,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Analysis History</h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <BookOpen className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-400">No analyzed papers yet</p>
              <p className="text-xs mt-1">Paste a paper URL or click a Quick Demo to begin analysis.</p>
            </div>
          ) : (
            history.map((paper, idx) => (
              <div
                key={paper.id || idx}
                onClick={() => {
                  onSelectPaper(paper);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 line-clamp-2">
                    {paper.title}
                  </h4>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{(paper.authors || []).slice(0, 2).join(', ')}</span>
                  <span className="text-emerald-400">{paper.tokenUsage?.totalTokens || '~2.8k'} tokens</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
