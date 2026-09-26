import React from 'react';
import { 
  Cpu, 
  Terminal, 
  FileText, 
  Share2, 
  History, 
  ShieldCheck, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { PaperAnalysis } from '../types/paper';

interface HeaderProps {
  currentPaper: PaperAnalysis | null;
  onOpenRawReport: () => void;
  onToggleHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPaper,
  onOpenRawReport,
  onToggleHistory,
  historyCount,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5 font-sans">
                PaperPulse
                <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  CS Research Agent
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Architecture Flowcharts (Mermaid.js) &amp; Student Project Incubator
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {currentPaper && (
            <button
              onClick={onOpenRawReport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors shadow-sm"
              title="View operational plain-text format with [FLOWCHART] label"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">[FLOWCHART] Labeled Report</span>
              <span className="sm:hidden">Report</span>
            </button>
          )}

          <button
            onClick={onToggleHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Recent Papers</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-indigo-300 font-mono border border-slate-700">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
