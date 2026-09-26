import React, { useState } from 'react';
import { 
  Search, 
  Link as LinkIcon, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  BookMarked,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CuratedPaperSummary } from '../types/paper';

interface PaperInputBarProps {
  onAnalyze: (payload: { url?: string; title?: string; rawText?: string }) => void;
  isLoading: boolean;
  curatedPapers: CuratedPaperSummary[];
  onSelectCurated: (id: string) => void;
  selectedCuratedId?: string;
}

export const PaperInputBar: React.FC<PaperInputBarProps> = ({
  onAnalyze,
  isLoading,
  curatedPapers,
  onSelectCurated,
  selectedCuratedId,
}) => {
  const [inputUrl, setInputUrl] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (showTextInput && rawText.trim()) {
      onAnalyze({ rawText: rawText.trim() });
    } else if (inputUrl.trim()) {
      // Determine if it's a URL or Title
      const isUrl = inputUrl.trim().startsWith('http') || inputUrl.includes('arxiv.org');
      if (isUrl) {
        onAnalyze({ url: inputUrl.trim() });
      } else {
        onAnalyze({ title: inputUrl.trim() });
      }
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Top Banner / Operational Note */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-mono font-medium text-slate-300">
            CS Research Agent v2.5 Online
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-[11px] font-mono text-emerald-400 hidden sm:inline">
            Token-Efficient Search &amp; Synthesis (&lt;25,000 tokens)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowTextInput(!showTextInput)}
          className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{showTextInput ? 'Switch to URL/Title' : 'Paste Abstract / Paper Text'}</span>
          {showTextInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!showTextInput ? (
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-slate-500">
              <LinkIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="Paste research paper URL (e.g. arXiv https://arxiv.org/abs/2312.00752) or paper title..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl pl-11 pr-32 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={4}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste research paper abstract, methodology, or excerpts here (token optimizer will cap under budget)..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{rawText.length.toLocaleString()} characters entered</span>
              <button
                type="submit"
                disabled={isLoading || !rawText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
              >
                {isLoading ? 'Analyzing...' : 'Parse Excerpt'}
              </button>
            </div>
          </div>
        )}

        {/* 1-Click Trending Benchmark Papers */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1 mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Quick Demos:
          </span>
          {curatedPapers.map(paper => {
            const isSelected = selectedCuratedId === paper.id;
            return (
              <button
                key={paper.id}
                type="button"
                onClick={() => onSelectCurated(paper.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <BookMarked className="w-3 h-3 text-indigo-400" />
                <span>{paper.title.split(':')[0]}</span>
                <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                  ({paper.tokenUsage.totalTokens} tokens)
                </span>
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
};
