import React, { useState } from 'react';
import { 
  Briefcase, 
  Target, 
  Code2, 
  Calendar, 
  FileCheck2, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  Github,
  Cpu,
  BookmarkPlus
} from 'lucide-react';
import { StudentOpportunity } from '../types/paper';

interface StudentOpportunitiesViewProps {
  opportunities: StudentOpportunity[];
  paperTitle: string;
  onOpenProjectKit: (project: StudentOpportunity) => void;
  onAskMentor: (project: StudentOpportunity) => void;
}

export const StudentOpportunitiesView: React.FC<StudentOpportunitiesViewProps> = ({
  opportunities,
  paperTitle,
  onOpenProjectKit,
  onAskMentor,
}) => {
  const [copiedBulletId, setCopiedBulletId] = useState<number | null>(null);

  const handleCopyBullet = (opp: StudentOpportunity) => {
    navigator.clipboard.writeText(opp.resumeBullet);
    setCopiedBulletId(opp.id);
    setTimeout(() => setCopiedBulletId(null), 2000);
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner-Friendly':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Intermediate':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Advanced':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                Step 3: Future Work & Internship Projects
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                3rd-Year CS Student Incubator
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-200">
              3 High-Impact Resume & Portfolio Extensions
            </h3>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          3 Concrete Implementations
        </span>
      </div>

      {/* 3 Project Opportunities */}
      <div className="p-5 space-y-5">
        {opportunities.map((opp, index) => (
          <div 
            key={opp.id || index}
            className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all shadow-md group"
          >
            {/* Project Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold font-mono flex items-center justify-center">
                  {index + 1}
                </span>
                <h4 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  {opp.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono border ${getDifficultyBadge(opp.difficulty)}`}>
                  {opp.difficulty}
                </span>
              </div>
            </div>

            {/* Core Extension */}
            <div className="mb-4">
              <div className="text-xs font-mono font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>EXACT EXTENSION:</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {opp.extension}
              </p>
            </div>

            {/* Metrics & Tech Stack Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* Targeted Performance Metric */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-400 mb-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>TARGETED PERFORMANCE METRIC:</span>
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  {opp.targetedMetric}
                </div>
              </div>

              {/* Recommended Tech Stack */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 mb-1">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>RECOMMENDED TECH STACK:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {opp.techStack.split(',').map((tech, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/40"
                    >
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 4-Week Sprint Plan */}
            {opp.timeline && (
              <div className="mb-4 p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>4-WEEK EXECUTION ROADMAP:</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed font-sans">
                  {opp.timeline}
                </div>
              </div>
            )}

            {/* Resume Bullet Box */}
            <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-900/30 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-300">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>READY-TO-USE RESUME IMPACT BULLET:</span>
                </div>
                <button
                  onClick={() => handleCopyBullet(opp)}
                  className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {copiedBulletId === opp.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Bullet</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-200 font-sans italic border-l-2 border-indigo-500 pl-2.5">
                "{opp.resumeBullet}"
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-2">
                {opp.starterRepo && (
                  <a
                    href={opp.starterRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span className="font-mono text-[11px]">Starter Repo</span>
                  </a>
                )}
                {opp.suggestedDataset && (
                  <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">
                    Dataset: {opp.suggestedDataset}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAskMentor(opp)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Ask Mentor</span>
                </button>
                <button
                  onClick={() => onOpenProjectKit(opp)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate GitHub Kit</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
