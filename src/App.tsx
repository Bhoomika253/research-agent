import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  PaperInputBar 
} from './components/PaperInputBar';
import { 
  TokenEfficiencyHUD 
} from './components/TokenEfficiencyHUD';
import { 
  CoreConceptView 
} from './components/CoreConceptView';
import { 
  FlowchartViewer 
} from './components/FlowchartViewer';
import { 
  StudentOpportunitiesView 
} from './components/StudentOpportunitiesView';
import { 
  ResearchAgentChat 
} from './components/ResearchAgentChat';
import { 
  ProjectKitModal 
} from './components/ProjectKitModal';
import { 
  RawReportModal 
} from './components/RawReportModal';
import { 
  HistoryDrawer 
} from './components/HistoryDrawer';
import { 
  PaperAnalysis, 
  CuratedPaperSummary, 
  StudentOpportunity 
} from './types/paper';
import { 
  Layers, 
  FileText, 
  Briefcase, 
  MessageSquare, 
  ExternalLink, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';

export default function App() {
  const [currentPaper, setCurrentPaper] = useState<PaperAnalysis | null>(null);
  const [curatedPapers, setCuratedPapers] = useState<CuratedPaperSummary[]>([]);
  const [selectedCuratedId, setSelectedCuratedId] = useState<string>('attention-is-all-you-need');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'concepts' | 'flowchart' | 'opportunities' | 'chat'>('all');
  
  // Modals & Drawers
  const [projectForKit, setProjectForKit] = useState<StudentOpportunity | null>(null);
  const [projectForChat, setProjectForChat] = useState<StudentOpportunity | null>(null);
  const [isRawReportOpen, setIsRawReportOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<PaperAnalysis[]>(() => {
    try {
      const saved = localStorage.getItem('paperpulse_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('paperpulse_history', JSON.stringify(history.slice(0, 20)));
    } catch (e) {
      console.warn('Failed to save history to local storage', e);
    }
  }, [history]);

  // Load curated papers list & default paper on mount
  useEffect(() => {
    fetch('/api/curated-papers')
      .then(res => res.json())
      .then(data => {
        if (data.papers) {
          setCuratedPapers(data.papers);
        }
      })
      .catch(err => console.error('Failed to load curated papers list:', err));

    // Fetch default benchmark paper
    fetch('/api/curated-papers/attention-is-all-you-need')
      .then(res => res.json())
      .then(data => {
        if (data.paper) {
          setCurrentPaper(data.paper);
          // Add to history if not present
          setHistory(prev => {
            if (prev.some(p => p.id === data.paper.id)) return prev;
            return [data.paper, ...prev];
          });
        }
      })
      .catch(err => console.error('Failed to load default paper:', err));
  }, []);

  // Handle selecting a curated paper
  const handleSelectCurated = async (id: string) => {
    setSelectedCuratedId(id);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/curated-papers/${id}`);
      const data = await res.json();
      if (data.paper) {
        setCurrentPaper(data.paper);
        setHistory(prev => {
          const filtered = prev.filter(p => p.id !== data.paper.id);
          return [data.paper, ...filtered];
        });
      } else {
        throw new Error('Paper not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load curated paper');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze custom paper URL, title, or raw text
  const handleAnalyze = async (payload: { url?: string; title?: string; rawText?: string }) => {
    setIsLoading(true);
    setError(null);
    setSelectedCuratedId('');

    try {
      const res = await fetch('/api/analyze-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze paper');
      }

      if (data.paper) {
        setCurrentPaper(data.paper);
        setHistory(prev => {
          const filtered = prev.filter(p => p.id !== data.paper.id);
          return [data.paper, ...filtered];
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during paper analysis. Please check the URL or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('paperpulse_history');
    } catch {}
  };

  const handleAskMentorAboutProject = (project: StudentOpportunity) => {
    setProjectForChat(project);
    setActiveTab('chat');
    // Scroll down to chat
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Header
        currentPaper={currentPaper}
        onOpenRawReport={() => setIsRawReportOpen(true)}
        onToggleHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Input Section */}
        <section className="space-y-4">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight font-sans">
              Computer Science Research Synthesis
            </h2>
            <p className="mt-1.5 text-sm text-slate-400 font-sans leading-relaxed">
              Autonomous agent parsing academic papers, extracting hardware-aware system architectures into Mermaid.js flowcharts, and incubating resume-ready portfolio extensions for 3rd-year CS students.
            </p>
          </div>

          <PaperInputBar
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            curatedPapers={curatedPapers}
            onSelectCurated={handleSelectCurated}
            selectedCuratedId={selectedCuratedId}
          />
        </section>

        {/* Error notification if any */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Analysis Notice: </strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-base font-semibold text-slate-200">
              Parsing Paper &amp; Synthesizing Architecture...
            </h3>
            <p className="text-xs text-slate-400 font-mono max-w-md">
              Extracting mathematical breakthroughs, generating clean Mermaid flowchart, and calculating student extension metrics under the 25k token constraint.
            </p>
          </div>
        )}

        {/* Paper Results View */}
        {currentPaper && !isLoading && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* Paper Header & Operational Efficiency Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="space-y-1.5 max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {currentPaper.venue || 'Academic Research'}
                    </span>
                    {currentPaper.domain && (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {currentPaper.domain}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight font-sans">
                    {currentPaper.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Authors: {(currentPaper.authors || []).join(', ')}
                  </p>
                </div>

                {currentPaper.url && (
                  <a
                    href={currentPaper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                  >
                    <span>View arXiv / Source</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                  </a>
                )}
              </div>

              {/* Token Efficiency HUD */}
              <TokenEfficiencyHUD tokenUsage={currentPaper.tokenUsage} />
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>Full Synthesis (All Steps)</span>
              </button>
              <button
                onClick={() => setActiveTab('concepts')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'concepts'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Core Concepts</span>
              </button>
              <button
                onClick={() => setActiveTab('flowchart')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'flowchart'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Mermaid Flowchart</span>
              </button>
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'opportunities'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>3. Student Projects (3)</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Research Advisor Q&amp;A</span>
              </button>
            </div>

            {/* Step 1: Core Concept Extraction */}
            {(activeTab === 'all' || activeTab === 'concepts') && (
              <section className="space-y-3">
                <CoreConceptView
                  concepts={currentPaper.coreConcepts}
                  domain={currentPaper.domain}
                  venue={currentPaper.venue}
                />
              </section>
            )}

            {/* Step 2: Architecture Flowchart (Mermaid.js) */}
            {(activeTab === 'all' || activeTab === 'flowchart') && (
              <section className="space-y-3">
                <FlowchartViewer
                  chartCode={currentPaper.mermaidFlowchart}
                  nodes={currentPaper.flowchartNodes}
                  paperTitle={currentPaper.title}
                />
              </section>
            )}

            {/* Step 3: Future Work & Internship Projects */}
            {(activeTab === 'all' || activeTab === 'opportunities') && (
              <section className="space-y-3">
                <StudentOpportunitiesView
                  opportunities={currentPaper.studentOpportunities}
                  paperTitle={currentPaper.title}
                  onOpenProjectKit={project => setProjectForKit(project)}
                  onAskMentor={handleAskMentorAboutProject}
                />
              </section>
            )}

            {/* Step 4: Interactive Student Research Advisor Q&A */}
            {(activeTab === 'all' || activeTab === 'chat') && (
              <section className="space-y-3">
                <ResearchAgentChat
                  paper={currentPaper}
                  selectedProject={projectForChat}
                />
              </section>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>PaperPulse CS Research Agent</span>
          </div>
          <div>
            Built with Google AI Studio • Powered by Gemini 2.5 Flash &amp; Mermaid.js
          </div>
        </div>
      </footer>

      {/* GitHub Project Starter Kit Modal */}
      {projectForKit && currentPaper && (
        <ProjectKitModal
          project={projectForKit}
          paperTitle={currentPaper.title}
          onClose={() => setProjectForKit(null)}
        />
      )}

      {/* Raw Plain-Text Operational Report Modal ([FLOWCHART] labeled) */}
      {isRawReportOpen && currentPaper && (
        <RawReportModal
          paper={currentPaper}
          onClose={() => setIsRawReportOpen(false)}
        />
      )}

      {/* Recent History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectPaper={paper => {
          setCurrentPaper(paper);
          setSelectedCuratedId(paper.id);
        }}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
