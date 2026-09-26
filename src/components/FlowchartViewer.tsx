import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Code, 
  Eye, 
  Layers, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { FlowchartNode } from '../types/paper';

interface FlowchartViewerProps {
  chartCode: string;
  nodes?: FlowchartNode[];
  paperTitle: string;
}

export const FlowchartViewer: React.FC<FlowchartViewerProps> = ({ chartCode, nodes = [], paperTitle }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'diagram' | 'code' | 'nodes'>('diagram');
  const [selectedNode, setSelectedNode] = useState<FlowchartNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid configuration once
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        primaryColor: '#3b82f6',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#60a5fa',
        lineColor: '#64748b',
        secondaryColor: '#059669',
        tertiaryColor: '#1e293b',
        mainBkg: '#0f172a',
        nodeBorder: '#3b82f6',
        clusterBkg: '#1e293b',
        clusterBorder: '#475569',
        titleColor: '#e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      flowchart: {
        curve: 'basis',
        htmlLabels: true,
        useMaxWidth: false,
      },
      securityLevel: 'loose',
    });
  }, []);

  // Clean and render flowchart
  useEffect(() => {
    let isMounted = true;
    async function renderChart() {
      if (!chartCode) {
        setSvgHtml('');
        return;
      }

      setRenderError(null);

      // Clean the mermaid chart string
      let cleaned = chartCode.trim();
      cleaned = cleaned.replace(/^```mermaid\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

      // Ensure graph TD or flowchart TD header exists
      if (!cleaned.startsWith('graph ') && !cleaned.startsWith('flowchart ')) {
        cleaned = `graph TD\n${cleaned}`;
      }

      try {
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, cleaned);
        if (isMounted) {
          setSvgHtml(svg);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setRenderError(err.message || 'Syntax error in Mermaid flowchart definition');
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chartCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chartCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paperTitle.slice(0, 30).toLowerCase().replace(/[^a-z0-9]/g, '-')}-architecture.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">Step 2: Architecture Flowchart</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">Mermaid.js (graph TD)</span>
            </div>
            <h3 className="text-sm font-medium text-slate-200">System Components, Layers & Data Flow</h3>
          </div>
        </div>

        {/* Tab buttons & Action buttons */}
        <div className="flex items-center gap-2">
          {/* View Toggles */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('diagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'diagram'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Diagram
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Raw Syntax
            </button>
            {nodes.length > 0 && (
              <button
                onClick={() => setActiveTab('nodes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'nodes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Layers ({nodes.length})
              </button>
            )}
          </div>

          {/* Zoom controls (only in diagram mode) */}
          {activeTab === 'diagram' && (
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
                title="Zoom Out"
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-400 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
                title="Zoom In"
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                title="Reset Zoom"
                className="p-1.5 text-slate-400 hover:text-white transition-colors border-l border-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Copy Mermaid */}
          <button
            onClick={handleCopyCode}
            title="Copy Mermaid Code"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download SVG */}
          {svgHtml && (
            <button
              onClick={handleDownloadSVG}
              title="Download Flowchart SVG"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">SVG</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas / Content */}
      <div className="relative min-h-[420px] max-h-[640px] overflow-auto flex-1 bg-gradient-to-b from-slate-950/80 to-slate-900/90 flex flex-col justify-center items-center p-6">
        {activeTab === 'diagram' && (
          <>
            {renderError ? (
              <div className="max-w-md p-6 bg-red-950/30 border border-red-800/40 rounded-xl text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-red-200 mb-1">Mermaid Syntax Warning</h4>
                <p className="text-xs text-red-400/90 mb-4">{renderError}</p>
                <div className="bg-slate-950 p-3 rounded-lg text-left text-xs font-mono text-slate-300 overflow-x-auto max-h-40 border border-slate-800">
                  <pre>{chartCode}</pre>
                </div>
                <button
                  onClick={() => setActiveTab('code')}
                  className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg transition-colors"
                >
                  View / Edit Code
                </button>
              </div>
            ) : svgHtml ? (
              <div 
                ref={containerRef}
                className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-out origin-center"
                style={{ transform: `scale(${zoom})` }}
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono">Synthesizing architecture diagram...</span>
              </div>
            )}
          </>
        )}

        {activeTab === 'code' && (
          <div className="w-full h-full p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400">[FLOWCHART] Specification Segment</span>
              <button
                onClick={handleCopyCode}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
              >
                {copied ? 'Copied to clipboard' : 'Copy code string'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800/90 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed selection:bg-indigo-900">
              {chartCode}
            </pre>
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="w-full h-full p-4 overflow-y-auto max-h-[580px]">
            <p className="text-xs text-slate-400 mb-3">
              Deep dive into individual architectural blocks, data transformations, and input/output contracts:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nodes.map((node, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    selectedNode?.id === node.id
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {node.id}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {node.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {node.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer helper note */}
      <div className="px-5 py-2.5 bg-slate-950/90 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Mermaid.js Flowchart syntax guaranteed without markdown blocks inside string.</span>
        </div>
        <span className="font-mono text-slate-500">graph TD</span>
      </div>
    </div>
  );
};
