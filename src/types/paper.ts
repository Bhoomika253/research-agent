export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  budgetLimit: number;
  efficiencySavedPercent: number;
}

export interface CoreConcepts {
  problemStatement: string;
  primaryMethodology: string;
  mathematicalBreakthroughs: string;
  totalWordCount?: number;
}

export interface FlowchartNode {
  id: string;
  role: string;
  desc: string;
}

export interface StudentOpportunity {
  id: number;
  title: string;
  extension: string;
  targetedMetric: string;
  techStack: string;
  difficulty: 'Beginner-Friendly' | 'Intermediate' | 'Advanced';
  timeline: string;
  resumeBullet: string;
  starterRepo?: string;
  suggestedDataset?: string;
}

export interface PaperAnalysis {
  id: string;
  title: string;
  authors: string[];
  venue?: string;
  url?: string;
  domain?: string;
  tokenUsage: TokenUsage;
  coreConcepts: CoreConcepts;
  mermaidFlowchart: string;
  flowchartNodes?: FlowchartNode[];
  studentOpportunities: StudentOpportunity[];
  rawOutputWithLabels?: string;
}

export interface CuratedPaperSummary {
  id: string;
  title: string;
  venue: string;
  authors: string[];
  url: string;
  domain: string;
  tokenUsage: TokenUsage;
}
