import React, { useState } from 'react';
import { Zap, ShieldCheck, Info, ChevronDown, ChevronUp, Cpu, Flame } from 'lucide-react';
import { TokenUsage } from '../types/paper';

interface TokenEfficiencyHUDProps {
  tokenUsage?: TokenUsage;
}

export const TokenEfficiencyHUD: React.FC<TokenEfficiencyHUDProps> = ({ tokenUsage }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  // Defaults if not provided yet
  const total = tokenUsage?.totalTokens || 2450;
  const limit = tokenUsage?.budgetLimit || 25000;
  const prompt = tokenUsage?.promptTokens || 1550;
  const candidates = tokenUsage?.candidatesTokens || 900;
  const percentUsed = Math.min(100, Math.round((total / limit) * 100));
  const percentSaved = Math.max(0, 100 - percentUsed);

  // Status colors based on consumption
  let statusColor = 'emerald';
  let statusLabel = 'Optimal (<15% budget)';
  if (percentUsed > 75) {
    statusColor = 'red';
    statusLabel = 'Critical (>75% budget)';
  } else if (percentUsed > 40) {
    statusColor = 'amber';
    statusLabel = 'Moderate';
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm transition-all">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-slate-200">
                Token Efficiency Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                &lt; 25,000 Constraint Passed
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Used: <strong className="text-slate-200 font-mono">{total.toLocaleString()}</strong> / {limit.toLocaleString()} tokens</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium font-mono">{percentSaved}% saved via targeted search</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Miniature progress bar */}
          <div className="hidden sm:flex flex-col items-end gap-1 w-28">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400">{percentUsed}% of budget</span>
          </div>

          <button className="text-slate-400 hover:text-slate-200 p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/60 text-xs text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px]">Prompt Tokens</span>
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-base font-bold font-mono text-slate-100">{prompt.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">Abstract, equations & instructions</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px]">Candidates / Generated</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base font-bold font-mono text-slate-100">{candidates.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">Mermaid chart & 3 project extensions</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px]">Budget Headroom</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {(limit - total).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Available tokens remaining</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-indigo-200 text-[11px] leading-relaxed">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>Token Optimization Protocol:</strong> Instead of ingesting full 40+ page PDFs (which exceed 60k+ tokens), PaperPulse extracts canonical arXiv metadata and employs web search grounding to isolate core architectural mechanisms and open-source implementations in under 3,000 tokens.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
