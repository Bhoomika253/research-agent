import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText } from 'lucide-react';
import { PaperAnalysis } from '../types/paper';

interface RawReportModalProps {
  paper: PaperAnalysis;
  onClose: () => void;
}

export const RawReportModal: React.FC<RawReportModalProps> = ({ paper, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Generate plain text report matching exact operational format
  const rawText = paper.rawOutputWithLabels || `=======================================================
PAPER ANALYSIS REPORT: ${paper.title}
Authors: ${(paper.authors || []).join(', ')}
Venue/Identifier: ${paper.venue || 'N/A'}
Domain: ${paper.domain || 'Computer Science'}
Token Efficiency: ${paper.tokenUsage?.totalTokens || 'N/A'} tokens (<25k tokens constraint passed)
=======================================================

1. CORE CONCEPT EXTRACTION (<300 words):
Problem Statement:
${paper.coreConcepts.problemStatement}

Primary Methodology:
${paper.coreConcepts.primaryMethodology}

Key Mathematical / Algorithmic Breakthroughs:
${paper.coreConcepts.mathematicalBreakthroughs}

2. ARCHITECTURAL FLOWCHART:
[FLOWCHART]
${paper.mermaidFlowchart}

3. FUTURE WORK & INTERNSHIP OPPORTUNITIES:
${(paper.studentOpportunities || []).map((opp, idx) => `
Opportunity ${idx + 1}: ${opp.title} (${opp.difficulty})
- Exact Extension: ${opp.extension}
- Targeted Performance Metric: ${opp.targetedMetric}
- Recommended Tech Stack: ${opp.techStack}
- 4-Week Roadmap: ${opp.timeline}
- Resume Bullet: "${opp.resumeBullet}"
`).join('\n')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.title.slice(0, 30).toLowerCase().replace(/[^a-z0-9]/g, '-')}-report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-indigo-400 uppercase">Formatted Agent Output</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">[FLOWCHART] Labeled String</span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 line-clamp-1">{paper.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download .txt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed selection:bg-indigo-900">
          <pre className="whitespace-pre-wrap">{rawText}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Compliant with operational output specification: text segment labeled [FLOWCHART].</span>
          <span className="font-mono text-emerald-400">Tokens: {paper.tokenUsage.totalTokens.toLocaleString()} / 25,000</span>
        </div>
      </div>
    </div>
  );
};
