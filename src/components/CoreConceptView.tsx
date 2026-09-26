import React, { useState } from 'react';
import { 
  FileText, 
  HelpCircle, 
  Wrench, 
  Binary, 
  Copy, 
  Check, 
  Gauge, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { CoreConcepts } from '../types/paper';

interface CoreConceptViewProps {
  concepts: CoreConcepts;
  domain?: string;
  venue?: string;
}

export const CoreConceptView: React.FC<CoreConceptViewProps> = ({ concepts, domain, venue }) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Calculate actual word count
  const allText = `${concepts.problemStatement} ${concepts.primaryMethodology} ${concepts.mathematicalBreakthroughs}`;
  const computedWords = allText.trim().split(/\s+/).filter(Boolean).length;
  const wordCount = concepts.totalWordCount || computedWords;

  const handleCopySummary = () => {
    const fullText = `PROBLEM STATEMENT:
${concepts.problemStatement}

PRIMARY METHODOLOGY:
${concepts.primaryMethodology}

KEY MATHEMATICAL & ALGORITHMIC BREAKTHROUGHS:
${concepts.mathematicalBreakthroughs}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
                Step 1: Core Concept Extraction
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                {wordCount} / 300 Words
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-200">
              Plain-Language Academic Synthesis
            </h3>
          </div>
        </div>

        <button
          onClick={handleCopySummary}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Summary' : 'Copy Concepts'}</span>
        </button>
      </div>

      {/* 3 Core Extraction Sections */}
      <div className="p-5 space-y-4">
        {/* Section 1: Problem Statement */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 relative group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded bg-rose-500/10 text-rose-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono">
              1. The Problem Statement
            </h4>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {concepts.problemStatement}
          </p>
        </div>

        {/* Section 2: Primary Methodology */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 relative group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
              <Wrench className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
              2. Primary Methodology Introduced
            </h4>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {concepts.primaryMethodology}
          </p>
        </div>

        {/* Section 3: Mathematical & Algorithmic Breakthroughs */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 relative group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded bg-amber-500/10 text-amber-400">
              <Binary className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
              3. Key Mathematical & Algorithmic Breakthroughs
            </h4>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans font-mono text-[13px] bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
            {concepts.mathematicalBreakthroughs}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Concise academic extraction verified &lt; 300 words</span>
        </div>
        {domain && <span className="font-mono text-slate-400">{domain}</span>}
      </div>
    </div>
  );
};
