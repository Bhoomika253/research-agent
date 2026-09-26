import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Github, Terminal, Sparkles, Loader2 } from 'lucide-react';
import { StudentOpportunity } from '../types/paper';

interface ProjectKitModalProps {
  project: StudentOpportunity | null;
  paperTitle: string;
  onClose: () => void;
}

export const ProjectKitModal: React.FC<ProjectKitModalProps> = ({ project, paperTitle, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!project) return;
    setLoading(true);

    fetch('/api/generate-project-kit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperTitle, project }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.readmeContent) {
          setContent(data.readmeContent);
        } else {
          setContent(generateFallbackKit(project, paperTitle));
        }
      })
      .catch(() => {
        setContent(generateFallbackKit(project, paperTitle));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [project, paperTitle]);

  if (!project) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `README-${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
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
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-indigo-400 uppercase">Student Project Starter Kit</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">README.md Generator</span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 line-clamp-1">{project.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy README'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download .md</span>
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
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-slate-300">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span>Generating production-ready repository kit and sprint checklist...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap leading-relaxed selection:bg-indigo-900 selection:text-white">
              {content}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Include this project in your GitHub portfolio and link it on your resume.</span>
          <span className="font-mono text-indigo-400">Tech: {project.techStack}</span>
        </div>
      </div>
    </div>
  );
};

function generateFallbackKit(project: StudentOpportunity, paperTitle: string): string {
  return `# ${project.title}

> A high-performance student research implementation building upon **"${paperTitle}"**.

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📌 Project Overview
- **Extension**: ${project.extension}
- **Targeted Performance Metric**: ${project.targetedMetric}
- **Tech Stack**: ${project.techStack}
- **Target Difficulty**: ${project.difficulty}

## 🚀 Quickstart

\`\`\`bash
# 1. Clone repository
git clone https://github.com/your-username/${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.git
cd ${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}

# 2. Setup Virtual Environment
conda create -n paper-pulse python=3.10 -y
conda activate paper-pulse

# 3. Install Requirements
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers accelerate datasets onnxruntime wandb

# 4. Run Baseline Reproduction
python src/train_baseline.py --dataset ${project.suggestedDataset || 'benchmark'}

# 5. Run Extension Benchmark
python src/benchmark.py --eval-metric latency_throughput
\`\`\`

## 🗓️ 4-Week Milestone Roadmap
${project.timeline}

## 📄 Resume Bullet Point
> "${project.resumeBullet}"
`;
}
