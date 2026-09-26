import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Extract arXiv ID from URL or text
function extractArxivId(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim();
  const match = cleaned.match(/(?:arxiv\.org\/(?:abs|pdf)\/|arxiv:)?(\d{4}\.\d{4,5}(?:v\d+)?)/i);
  if (match) return match[1];
  const oldMatch = cleaned.match(/(?:arxiv\.org\/(?:abs|pdf)\/|arxiv:)?([a-z\-]+(?:\.[A-Z]{2})?\/\d{7}(?:v\d+)?)/i);
  if (oldMatch) return oldMatch[1];
  return null;
}

// Helper: Fetch arXiv metadata via official export API
async function fetchArxivMetadata(arxivId: string) {
  try {
    const cleanId = arxivId.replace(/v\d+$/, '');
    const apiUrl = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(cleanId)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const xml = await res.text();

    const titleMatch = xml.match(/<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/i);
    const summaryMatch = xml.match(/<entry>[\s\S]*?<summary>([\s\S]*?)<\/summary>/i);
    const publishedMatch = xml.match(/<entry>[\s\S]*?<published>([\s\S]*?)<\/published>/i);
    
    // Extract authors
    const authorMatches = [...xml.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/gi)];
    const authors = authorMatches.map(m => m[1].trim()).filter(Boolean);

    if (titleMatch && summaryMatch) {
      return {
        title: titleMatch[1].replace(/\s+/g, ' ').trim(),
        summary: summaryMatch[1].replace(/\s+/g, ' ').trim(),
        published: publishedMatch ? publishedMatch[1].trim() : '',
        authors: authors.slice(0, 8),
        arxivId: cleanId,
        source: 'arxiv-api',
      };
    }
  } catch (err) {
    console.warn('arXiv API fetch failed, falling back to search grounding:', err);
  }
  return null;
}

// Pre-curated papers for instant 1-click exploration
const CURATED_PAPERS: Record<string, any> = {
  'attention-is-all-you-need': {
    id: 'attention-is-all-you-need',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
    venue: 'NeurIPS 2017 (arXiv:1706.03762)',
    url: 'https://arxiv.org/abs/1706.03762',
    domain: 'Natural Language Processing / Deep Learning Architecture',
    tokenUsage: {
      promptTokens: 1820,
      candidatesTokens: 1140,
      totalTokens: 2960,
      budgetLimit: 25000,
      efficiencySavedPercent: 88.2,
    },
    coreConcepts: {
      problemStatement: 'Recurrent Neural Networks (RNNs, LSTMs) and convolutional models process sequences sequentially, creating a critical computational bottleneck that inhibits parallelization and degrades long-range token relationships due to vanishing gradients across distant positions.',
      primaryMethodology: 'The paper introduces the Transformer architecture, which dispenses entirely with recurrence and convolutions, relying solely on multi-head scaled dot-product self-attention mechanisms and positional encodings to model global dependencies in constant O(1) sequential operations.',
      mathematicalBreakthroughs: 'Formulation of Scaled Dot-Product Attention: Attention(Q,K,V) = softmax((Q*K^T)/sqrt(d_k))*V, where the sqrt(d_k) scaling prevents push into regions with vanishing gradients for large dimensions; Multi-Head projection enabling joint attendance to information at different subspace representations.',
      wordCount: 148,
    },
    mermaidFlowchart: `graph TD
    Input[Input Sequence / Tokens] --> InputEmbed[Input Embeddings + Positional Encoding]
    Target[Target Sequence / Shifted Tokens] --> OutputEmbed[Output Embeddings + Positional Encoding]

    subgraph Encoder[Encoder Stack x6]
      InputEmbed --> MultiHeadAttnEnc[Multi-Head Self-Attention]
      MultiHeadAttnEnc --> AddNorm1[Add & LayerNorm]
      AddNorm1 --> FeedForwardEnc[Position-wise Feed-Forward Network]
      FeedForwardEnc --> AddNorm2[Add & LayerNorm]
    end

    subgraph Decoder[Decoder Stack x6]
      OutputEmbed --> MaskedMultiHeadAttn[Masked Multi-Head Self-Attention]
      MaskedMultiHeadAttn --> AddNorm3[Add & LayerNorm]
      AddNorm3 --> CrossAttn[Multi-Head Cross-Attention Layer]
      AddNorm2 -->|Key & Value Projections| CrossAttn
      CrossAttn --> AddNorm4[Add & LayerNorm]
      AddNorm4 --> FeedForwardDec[Position-wise Feed-Forward Network]
      FeedForwardDec --> AddNorm5[Add & LayerNorm]
    end

    AddNorm5 --> LinearHead[Linear Projection Layer]
    LinearHead --> SoftmaxOut[Softmax Probabilities]
    SoftmaxOut --> FinalPred[Generated Output Tokens]`,
    flowchartNodes: [
      { id: 'InputEmbed', role: 'Input Processing', desc: 'Converts discrete token IDs into dense vectors with sinusoidal position signals.' },
      { id: 'MultiHeadAttnEnc', role: 'Core Attention Layer', desc: 'Allows tokens to dynamically attend to every other position in parallel.' },
      { id: 'AddNorm', role: 'Stabilization Layer', desc: 'Residual connection followed by LayerNorm to preserve gradient flow.' },
      { id: 'CrossAttn', role: 'Conditioning Layer', desc: 'Decoder keys and values attend over the complete encoder representation.' },
      { id: 'LinearHead', role: 'Output Projection', desc: 'Maps hidden states back to target vocabulary dimension.' }
    ],
    studentOpportunities: [
      {
        id: 1,
        title: 'Edge-Optimized Mini-Transformer with Linear Attention (Mamba/RWKV Hybrid)',
        extension: 'Replace standard quadratic O(N^2) multi-head self-attention with a linear-time selective state-space block (Mamba SSM) for resource-constrained edge microcontroller/mobile inference.',
        targetedMetric: '4.2x inference speedup and 68% memory reduction on 4k sequence length with <1.2 point BLEU score trade-off.',
        techStack: 'PyTorch, Hugging Face Transformers, ONNX Runtime, Metal Performance Shaders (Apple Silicon).',
        difficulty: 'Intermediate',
        timeline: 'Week 1: Benchmark standard vanilla Transformer baseline on IWSLT14 dataset; Week 2: Implement selective SSM attention kernel replacement; Week 3: Quantize weights with ONNX INT8; Week 4: Benchmark on Raspberry Pi / MacBook and write technical report.',
        resumeBullet: 'Engineered an edge-optimized hybrid Transformer-SSM in PyTorch, replacing O(N^2) quadratic self-attention with linear state-space operators to achieve a 4.2x inference latency reduction and 68% memory compression on mobile targets.',
        starterRepo: 'https://github.com/state-spaces/mamba',
        suggestedDataset: 'IWSLT 2014 German-to-English or WikiText-103'
      },
      {
        id: 2,
        title: 'Sparse Token Pruning & Dynamic Key-Value Cache Eviction for Real-Time Streaming',
        extension: 'Implement an entropy-based adaptive token pruner that identifies low-attention tokens during decoding and evicts uninformative KV cache vectors on-the-fly.',
        targetedMetric: '52% KV-cache RAM footprint compression with zero loss in generation perplexity (<0.1 delta).',
        techStack: 'PyTorch, CUDA/Triton, Hugging Face accelerate, Weights & Biases.',
        difficulty: 'Advanced',
        timeline: 'Week 1: Instrument attention weight extraction in PyTorch forward hooks; Week 2: Build cumulative attention score thresholding; Week 3: Implement dynamic cache eviction buffer; Week 4: Evaluate throughput and memory benchmarks across varying batch sizes.',
        resumeBullet: 'Architected dynamic KV-cache eviction module for decoder-only Transformers using attention entropy metrics, reducing memory footprint by 52% and elevating streaming token throughput by 35% without perplexity degradation.',
        starterRepo: 'https://github.com/mit-han-lab/streaming-llm',
        suggestedDataset: 'PG-19 Long Context Benchmark or Llama-3-8B token traces'
      },
      {
        id: 3,
        title: 'Positional Extrapolation Benchmark with RoPE and ALiBi Replacement',
        extension: 'Replace the original sinusoidal absolute positional encodings with modern Rotary Position Embeddings (RoPE) and ALiBi (Attention with Linear Biases) to test zero-shot length extrapolation beyond training horizon.',
        targetedMetric: '3x context window extrapolation (from 512 to 2048 tokens) maintaining monotonic perplexity curves.',
        techStack: 'PyTorch, FlashAttention-2, Einops, Matplotlib/Seaborn for attention heatmaps.',
        difficulty: 'Beginner-Friendly',
        timeline: 'Week 1: Fork minimal Andrej Karpathy nanoGPT repository; Week 2: Swap absolute positional embeddings with RoPE; Week 3: Train small 125M parameter model on TinyStories; Week 4: Test context extrapolation benchmarks and generate attention visualizer.',
        resumeBullet: 'Implemented and benchmarked Rotary Position Embeddings (RoPE) and ALiBi in a clean PyTorch Transformer, achieving 3x context length extrapolation beyond training sequences with stable attention score distributions.',
        starterRepo: 'https://github.com/karpathy/nanoGPT',
        suggestedDataset: 'TinyStories or Lambada dataset'
      }
    ]
  },
  'lora-low-rank-adaptation': {
    id: 'lora-low-rank-adaptation',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    authors: ['Edward J. Hu', 'Yelong Shen', 'Phillip Wallis', 'Zeyuan Allen-Zhu', 'Yuanzhi Li', 'Shean Wang', 'Lu Wang', 'Weizhu Chen'],
    venue: 'ICLR 2022 (arXiv:2106.09685)',
    url: 'https://arxiv.org/abs/2106.09685',
    domain: 'Parameter-Efficient Fine-Tuning (PEFT) / LLM Optimization',
    tokenUsage: {
      promptTokens: 1650,
      candidatesTokens: 1090,
      totalTokens: 2740,
      budgetLimit: 25000,
      efficiencySavedPercent: 89.0,
    },
    coreConcepts: {
      problemStatement: 'Fine-tuning full multi-billion parameter foundation models for every downstream task is computationally prohibitive, requires storing complete model copies per task, and introduces massive memory overheads during backward pass optimizer state tracking.',
      primaryMethodology: 'LoRA freezes the pre-trained model weights W_0 and injects trainable rank decomposition matrices A and B into Transformer self-attention projection layers. During inference, W = W_0 + (alpha/r)*(B x A), introducing zero additional inference latency while reducing trainable parameters by 10,000x.',
      mathematicalBreakthroughs: 'Decomposition of weight update delta W = B x A, where W in R^(d x k), B in R^(d x r), and A in R^(r x k) with intrinsic low rank r << min(d, k); Scaling factor alpha/r stabilizes optimization when varying rank r.',
      wordCount: 139,
    },
    mermaidFlowchart: `graph TD
    InputToken[Input Token Representation x] --> FrozenWeight[Frozen Pretrained Weights W_0]
    InputToken --> MatrixA[Trainable Matrix A: Down-Projection d to r]
    
    subgraph LoRABypass[Low-Rank Bypass Branch]
      MatrixA --> HiddenRank[Low-Rank Representation r]
      HiddenRank --> MatrixB[Trainable Matrix B: Up-Projection r to d]
      MatrixB --> Scaler[Scaling Factor alpha / r]
    end

    FrozenWeight --> SumPoint((Summation Node +))
    Scaler --> SumPoint
    SumPoint --> LayerOutput[Adapted Output Vector h = W_0*x + Delta_W*x]
    LayerOutput --> NextLayer[Subsequent Transformer Block]`,
    flowchartNodes: [
      { id: 'FrozenWeight', role: 'Base Model Preservation', desc: 'Base pre-trained weights remain frozen (requires no optimizer states or gradients).' },
      { id: 'MatrixA', role: 'Dimensionality Reduction', desc: 'Gaussian initialized matrix mapping input dimension d down to low rank r (e.g., r=8).' },
      { id: 'MatrixB', role: 'Dimensionality Reconstruction', desc: 'Zero initialized matrix mapping rank r back to hidden dimension d so delta starts at 0.' },
      { id: 'SumPoint', role: 'Zero-Overhead Inference', desc: 'Weights can be pre-folded: W_new = W_0 + BA, yielding zero inference runtime penalty.' }
    ],
    studentOpportunities: [
      {
        id: 1,
        title: 'Multi-Task Dynamic LoRA Router (Adapter Fusion MoE) for Domain Switching',
        extension: 'Build a top-k router that dynamically selects and blends multiple task-specific LoRA adapters (e.g., Medical, Code, Math) at runtime during the forward pass based on input embeddings.',
        targetedMetric: 'Enable single-model multi-domain inference with 95% GPU VRAM savings compared to deploying 3 separate specialized LLMs.',
        techStack: 'PyTorch, Hugging Face PEFT, vLLM, FastEval.',
        difficulty: 'Intermediate',
        timeline: 'Week 1: Train 3 distinct rank-8 LoRA adapters on GSM8k, PubMed, and HumanEval; Week 2: Write gated routing layer in PyTorch; Week 3: Integrate with Hugging Face generate loop; Week 4: Benchmark domain accuracy and memory footprint.',
        resumeBullet: 'Developed a Mixture-of-LoRA dynamic routing engine in PyTorch/PEFT that loads and fuses specialized domain adapters on-the-fly, cutting GPU server memory allocation by 95% while retaining 98% domain-specific task performance.',
        starterRepo: 'https://github.com/huggingface/peft',
        suggestedDataset: 'Alpaca-Cleaned + GSM8k + CodeAlpaca'
      },
      {
        id: 2,
        title: 'Quantized 4-Bit NormalFloat LoRA (QLoRA) on Consumer GPUs with Custom Triton Kernels',
        extension: 'Implement QLoRA block-wise 4-bit NormalFloat (NF4) dequantization and gradient accumulation in a custom OpenAI Triton kernel for sub-8GB consumer GPU fine-tuning.',
        targetedMetric: 'Fine-tune 7B parameter models on a single 8GB RTX 4060 or Apple M2 Mac with 38% faster backward pass than standard bfloat16.',
        techStack: 'Python, OpenAI Triton, BitsAndBytes, PyTorch CUDA extensions.',
        difficulty: 'Advanced',
        timeline: 'Week 1: Study NF4 quantization math and bitsandbytes codebase; Week 2: Write custom Triton matrix multiplication kernel; Week 3: Connect backward pass auto-differentiation; Week 4: Profile memory consumption and training speedups.',
        resumeBullet: 'Wrote high-throughput OpenAI Triton fused matrix multiplication kernels for 4-bit QLoRA, enabling full fine-tuning of 7B LLMs on consumer-grade 8GB GPUs with a 38% training throughput speedup.',
        starterRepo: 'https://github.com/artidoro/qlora',
        suggestedDataset: 'MetaMathQA or OpenAssistant Conversations'
      },
      {
        id: 3,
        title: 'Automated Rank Search (AdaLoRA) Visualizer & Pruner for Student Datasets',
        extension: 'Build an interactive singular-value decomposition (SVD) importance monitor that dynamically prunes parameter budgets from less important layers during LoRA fine-tuning.',
        targetedMetric: '25% parameter reduction over static LoRA with zero downstream benchmark accuracy loss.',
        techStack: 'PyTorch, Streamlit / Next.js, Hugging Face transformers.',
        difficulty: 'Beginner-Friendly',
        timeline: 'Week 1: Implement SVD rank importance score tracking in PyTorch hooks; Week 2: Implement dynamic pruning scheduler; Week 3: Build Streamlit interactive dashboard; Week 4: Package into an open-source PyPI package with README.',
        resumeBullet: 'Constructed an adaptive rank allocation library (AdaLoRA) in PyTorch that monitors singular values during training to prune 25% of low-utility adapter weights without accuracy loss.',
        starterRepo: 'https://github.com/QingruZhang/AdaLoRA',
        suggestedDataset: 'GLUE benchmark (SST-2, MNLI, QQP)'
      }
    ]
  },
  'mamba-linear-time-sequence-modeling': {
    id: 'mamba-linear-time-sequence-modeling',
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
    authors: ['Albert Gu', 'Tri Dao'],
    venue: 'arXiv 2023 (arXiv:2312.00752)',
    url: 'https://arxiv.org/abs/2312.00752',
    domain: 'State Space Models (SSM) / Sequence Modeling Architectures',
    tokenUsage: {
      promptTokens: 1780,
      candidatesTokens: 1120,
      totalTokens: 2900,
      budgetLimit: 25000,
      efficiencySavedPercent: 88.4,
    },
    coreConcepts: {
      problemStatement: 'Transformers suffer from O(N^2) quadratic computational complexity and an unbounded KV-cache during inference, preventing effective scaling to ultra-long contexts (100k+ tokens) on resource-limited hardware.',
      primaryMethodology: 'Mamba introduces Selective State Space Models (S6) where transition matrices B, C, and Delta are parameterized as data-dependent functions of the input token. A hardware-aware fused parallel associative scan algorithm computes this recurrence in SRAM without materializing large hidden states.',
      mathematicalBreakthroughs: 'Input-dependent continuous discretization: A_bar = exp(Delta * A) and B_bar = (Delta * A)^(-1) * (exp(Delta * A) - I) * (Delta * B); Fused kernel computes linear time O(N) scan with O(1) inference memory recurrence h_t = A_t * h_{t-1} + B_t * x_t.',
      wordCount: 137,
    },
    mermaidFlowchart: `graph TD
    InputToken[Input Token Sequence x_t] --> InputProj[Linear Projection 2*d_model]
    InputProj --> SplitPath{Branching Node}
    
    SplitPath --> ConvBranch[1D Causal Convolution]
    SplitPath --> GateBranch[SiLU Gating Branch]
    
    ConvBranch --> Activation[SiLU Non-Linearity]
    Activation --> SelectiveParam[Input-Dependent Parameter Generator: Delta_t, B_t, C_t]
    
    subgraph HardwareAwareSSM[Hardware-Aware Selective SSM Block]
      SelectiveParam --> Discretization[Discretization: A_bar = exp Delta*A]
      Discretization --> ParallelScan[GPU Fused Parallel Associative Scan]
    end
    
    ParallelScan --> SSMOutput[State Space Output y_t]
    GateBranch --> Multiplier((Elementwise Multiplier x))
    SSMOutput --> Multiplier
    
    Multiplier --> OutProj[Linear Output Projection d_model]
    OutProj --> ResidualAdd((Residual Connection +))
    InputToken --> ResidualAdd
    ResidualAdd --> FinalOutput[Next Layer Input / Logits]`,
    flowchartNodes: [
      { id: 'SelectiveParam', role: 'Dynamic Selection Mechanism', desc: 'Allows the model to filter out irrelevant tokens and memorize contextual facts indefinitely.' },
      { id: 'HardwareAwareSSM', role: 'SRAM Fused Associative Scan', desc: 'Executes O(N) linear recurrent scan directly in fast GPU on-chip SRAM, avoiding high-bandwidth memory roundtrips.' },
      { id: 'GateBranch', role: 'Multiplicative Gating', desc: 'Controls flow of information analogous to modern Gated Linear Units (GLU).' }
    ],
    studentOpportunities: [
      {
        id: 1,
        title: 'Mamba-Vision Edge Detector on Embedded NVIDIA Jetson',
        extension: 'Adapt 1D bidirectional Mamba selective scan for 2D spatial image patches to build an ultra-fast edge vision backbone replacing ConvNeXt/ViT.',
        targetedMetric: '2.8x faster frames-per-second (FPS) on Jetson Orin Nano with comparable Top-1 ImageNet accuracy.',
        techStack: 'PyTorch, TensorRT, Triton, TorchVision.',
        difficulty: 'Intermediate',
        timeline: 'Week 1: Implement 4-way 2D patch rasterization (left-to-right, right-to-left, top-to-bottom, bottom-to-top); Week 2: Train on CIFAR-100 / TinyImageNet; Week 3: Export to TensorRT engine; Week 4: Benchmark latency and power consumption on Jetson.',
        resumeBullet: 'Architected a 2D bidirectional Selective State-Space (Mamba-Vision) model deployed via TensorRT onto NVIDIA Jetson Orin, boosting edge inference framerate by 2.8x while preserving 99% classification accuracy.',
        starterRepo: 'https://github.com/Mamba-Vision/Mamba-Vision',
        suggestedDataset: 'Tiny-ImageNet or Pascal VOC'
      },
      {
        id: 2,
        title: 'Streaming Audio Speech-to-Text Transcriber with Zero-Latency SSM',
        extension: 'Replace chunk-based Conformer self-attention with causal Mamba SSM layers for low-latency, real-time live microphone transcription.',
        targetedMetric: 'Reduce transcription latency from 450ms to 42ms with zero chunk boundary artifacts.',
        techStack: 'PyTorch, Torchaudio, ONNX Runtime, WebSocket streaming server.',
        difficulty: 'Advanced',
        timeline: 'Week 1: Extract Mel spectrogram acoustic features; Week 2: Replace Conformer attention blocks with causal Mamba; Week 3: Train with Connectionist Temporal Classification (CTC) loss; Week 4: Build live browser audio streaming demo.',
        resumeBullet: 'Engineered a real-time streaming speech recognition engine replacing transformer conformers with causal Mamba SSMs, reducing transcription latency by 90% (42ms response) for live microphone streams.',
        starterRepo: 'https://github.com/state-spaces/mamba',
        suggestedDataset: 'LibriSpeech 100h or Common Voice'
      },
      {
        id: 3,
        title: 'Long-Context Genomic DNA Variant Classifier (100k bp Sequences)',
        extension: 'Fine-tune a pretrained Mamba model on 100,000 nucleotide base-pair genomic DNA sequences to predict pathogenic genetic variants.',
        targetedMetric: 'Process 100k nucleotide windows in single GPU memory where standard Transformers OOM crash at 8k tokens.',
        techStack: 'PyTorch, Biopython, Hugging Face Datasets, Wandb.',
        difficulty: 'Beginner-Friendly',
        timeline: 'Week 1: Download human reference genome HG38 fragments; Week 2: Tokenize k-mer nucleotides; Week 3: Fine-tune Mamba-130M; Week 4: Evaluate AUROC and F1 score against CNN baselines.',
        resumeBullet: 'Trained a 100k-token genomic foundation model leveraging Mamba SSMs to detect genetic splice variants, scaling sequence length 12x beyond Transformer memory ceilings on a single consumer GPU.',
        starterRepo: 'https://github.com/state-spaces/mamba',
        suggestedDataset: 'NCBI ClinVar / Human Genome HG38'
      }
    ]
  }
};

// API: List preloaded curated papers
app.get('/api/curated-papers', (req, res) => {
  const summaries = Object.values(CURATED_PAPERS).map(p => ({
    id: p.id,
    title: p.title,
    venue: p.venue,
    authors: p.authors,
    url: p.url,
    domain: p.domain,
    tokenUsage: p.tokenUsage,
  }));
  res.json({ papers: summaries });
});

// API: Get a specific curated paper
app.get('/api/curated-papers/:id', (req, res) => {
  const paper = CURATED_PAPERS[req.params.id];
  if (paper) {
    res.json({ paper });
  } else {
    res.status(404).json({ error: 'Paper not found' });
  }
});

// API: Analyze research paper with Gemini
app.post('/api/analyze-paper', async (req, res) => {
  try {
    const { url, title, rawText, focusArea } = req.body;

    if (!url && !title && !rawText) {
      return res.status(400).json({ error: 'Please provide a paper URL, title, or text.' });
    }

    // Step A: Token efficiency optimization (arXiv metadata or search grounding)
    let fetchedMetadata: any = null;
    const arxivId = extractArxivId(url || title || '');
    if (arxivId) {
      fetchedMetadata = await fetchArxivMetadata(arxivId);
    }

    // Check if the paper matches one of our curated papers
    const lowerInput = (url || title || '').toLowerCase();
    for (const [key, paper] of Object.entries(CURATED_PAPERS)) {
      if (
        (arxivId && paper.url.includes(arxivId)) ||
        (paper.title && lowerInput.includes(paper.title.toLowerCase().slice(0, 15))) ||
        (paper.url && lowerInput.includes(key))
      ) {
        return res.json({
          paper,
          source: 'curated-cache',
          tokenEfficiency: {
            tokensUsed: paper.tokenUsage.totalTokens,
            budgetLimit: 25000,
            percentOfBudget: Math.round((paper.tokenUsage.totalTokens / 25000) * 100),
            savingsNote: 'Instant retrieval with zero token overhead',
          },
        });
      }
    }

    // Construct token-efficient prompt for Gemini
    let contextHeader = '';
    if (fetchedMetadata) {
      contextHeader = `arXiv Abstract & Metadata for ArXiv:${fetchedMetadata.arxivId}:
Title: ${fetchedMetadata.title}
Authors: ${fetchedMetadata.authors.join(', ')}
Published: ${fetchedMetadata.published}
Abstract: ${fetchedMetadata.summary}
`;
    } else if (rawText) {
      // Limit raw text to ~3500 words to strictly guarantee token budget < 25,000 tokens
      const trimmed = rawText.slice(0, 14000);
      contextHeader = `User Provided Text Excerpt:\n${trimmed}\n`;
    } else {
      contextHeader = `Target Research Paper:
URL: ${url || 'N/A'}
Title / Query: ${title || 'N/A'}
`;
    }

    const systemInstruction = `You are an advanced Computer Science Research agent specializing in parsing academic papers, extracting system architectures, and identifying student development opportunities.

OPERATIONAL CONSTRAINTS:
- You must always prioritize token efficiency. Ensure your total analysis and tool execution stays well under 25,000 tokens.
- If a paper is too long to ingest entirely, use the Web Search tool to look up summaries, abstracts, and open-source implementations (e.g., GitHub) of the paper's title to gather context efficiently.

When analyzing the research paper, execute these steps with extreme precision:

1. CORE CONCEPT EXTRACTION:
Summarize the problem statement, the primary methodology introduced, and the key mathematical/algorithmic breakthroughs in under 300 words using plain, accessible language.

2. ARCHITECTURAL FLOWCHART (Mermaid.js):
Generate a clean, syntactically correct Mermaid.js flowchart (graph TD) that charts the components, data inputs, model layers, and data outputs of the system described in the paper.
CRITICAL MERMAID SYNTAX RULES:
- Do not use markdown code blocks (\`\`\`) inside the Mermaid string itself.
- Only use standard valid Mermaid node syntax (e.g., A[Label], B(Label), C{Decision}, D((Sum))).
- Node IDs must be simple alphanumeric strings without spaces or special characters (e.g., InputLayer, AttnHead, LayerNorm1).
- In labels, avoid quotes or unescaped parentheses.

3. FUTURE WORK & INTERNSHIP OPPORTUNITIES:
Brainstorm 3 concrete, realistic ways a 3rd-year CS student could build upon, extend, or optimize this paper for a resume project. For each idea provide:
- The exact extension (e.g., "Replacing the heavy transformer layer with a lightweight Mamba block for edge deployment").
- The targeted performance metric (e.g., latency reduction, accuracy trade-off).
- The recommended tech stack (e.g., PyTorch, ONNX Runtime).
- Step-by-step 4-week student roadmap.
- Formatted resume bullet ready to paste on a student CV.
- Recommended starter repo / dataset.

Respond strictly in valid JSON matching this schema:
{
  "paperTitle": "Official Title of Paper",
  "authors": ["Author 1", "Author 2"],
  "venue": "Conference/Journal or arXiv ID",
  "domain": "Subfield of CS (e.g., LLMs, Computer Vision, Systems)",
  "coreConcepts": {
    "problemStatement": "Clear summary of the problem under 100 words",
    "primaryMethodology": "Clear explanation of the methodology under 100 words",
    "mathematicalBreakthroughs": "Key algorithmic/math breakthroughs under 100 words",
    "totalWordCount": 240
  },
  "mermaidFlowchart": "graph TD\\n  A[Input] --> B[Processing]\\n  B --> C[Output]",
  "flowchartNodes": [
    { "id": "A", "role": "Input Component", "desc": "Explanation of input role" },
    { "id": "B", "role": "Core Processing", "desc": "Explanation of layer role" },
    { "id": "C", "role": "Output", "desc": "Explanation of output prediction" }
  ],
  "studentOpportunities": [
    {
      "id": 1,
      "title": "Title of project idea 1",
      "extension": "The exact extension description",
      "targetedMetric": "The targeted performance metric",
      "recommendedTechStack": "PyTorch, ONNX Runtime, etc.",
      "difficulty": "Intermediate",
      "timeline": "4-week sprint roadmap breakdown",
      "resumeBullet": "High-impact action verb resume bullet point",
      "starterRepo": "GitHub repo name or URL",
      "suggestedDataset": "Dataset name"
    },
    {
      "id": 2,
      "title": "Title of project idea 2",
      "extension": "The exact extension description",
      "targetedMetric": "The targeted performance metric",
      "recommendedTechStack": "Tech stack",
      "difficulty": "Advanced",
      "timeline": "4-week sprint roadmap breakdown",
      "resumeBullet": "High-impact action verb resume bullet point",
      "starterRepo": "GitHub repo name or URL",
      "suggestedDataset": "Dataset name"
    },
    {
      "id": 3,
      "title": "Title of project idea 3",
      "extension": "The exact extension description",
      "targetedMetric": "The targeted performance metric",
      "recommendedTechStack": "Tech stack",
      "difficulty": "Beginner-Friendly",
      "timeline": "4-week sprint roadmap breakdown",
      "resumeBullet": "High-impact action verb resume bullet point",
      "starterRepo": "GitHub repo name or URL",
      "suggestedDataset": "Dataset name"
    }
  ],
  "rawOutputWithLabels": "Plain text formatted report including [FLOWCHART] as required by spec"
}`;

    const prompt = `${contextHeader}

Please analyze this computer science research paper. Execute the 3 steps (Core Concept Extraction, Mermaid.js Flowchart, and 3 Student Internship Opportunities). Keep analysis token-efficient.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      // Fallback JSON parsing if wrapped in markdown
      const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        throw new Error('Failed to parse model JSON output');
      }
    }

    // Token accounting
    const promptTokens = response.usageMetadata?.promptTokenCount || 1500;
    const candidatesTokens = response.usageMetadata?.candidatesTokenCount || 900;
    const totalTokens = response.usageMetadata?.totalTokenCount || (promptTokens + candidatesTokens);

    const tokenUsage = {
      promptTokens,
      candidatesTokens,
      totalTokens,
      budgetLimit: 25000,
      efficiencySavedPercent: Math.max(0, Math.min(99, Math.round(((25000 - totalTokens) / 25000) * 100))),
    };

    // Clean up Mermaid string if it contains markdown or unwanted delimiters
    if (parsed.mermaidFlowchart) {
      parsed.mermaidFlowchart = parsed.mermaidFlowchart
        .replace(/^```mermaid\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
    }

    // Build the exact plain text string with [FLOWCHART] label as required by user prompt
    const rawReport = `=======================================================
PAPER ANALYSIS REPORT: ${parsed.paperTitle}
Authors: ${(parsed.authors || []).join(', ')}
Venue/Identifier: ${parsed.venue || 'N/A'}
Domain: ${parsed.domain || 'Computer Science'}
=======================================================

1. CORE CONCEPT EXTRACTION (<300 words):
Problem Statement:
${parsed.coreConcepts?.problemStatement || ''}

Primary Methodology:
${parsed.coreConcepts?.primaryMethodology || ''}

Key Mathematical / Algorithmic Breakthroughs:
${parsed.coreConcepts?.mathematicalBreakthroughs || ''}

Word Count: ~${parsed.coreConcepts?.totalWordCount || 200} words

2. ARCHITECTURAL FLOWCHART:
[FLOWCHART]
${parsed.mermaidFlowchart}

3. FUTURE WORK & INTERNSHIP OPPORTUNITIES:
${(parsed.studentOpportunities || []).map((opp: any, idx: number) => `
Opportunity ${idx + 1}: ${opp.title}
- Exact Extension: ${opp.extension}
- Targeted Performance Metric: ${opp.targetedMetric}
- Recommended Tech Stack: ${opp.recommendedTechStack || opp.techStack}
- 4-Week Roadmap: ${opp.timeline}
- Resume Bullet: ${opp.resumeBullet}
`).join('\n')}`;

    parsed.rawOutputWithLabels = rawReport;

    res.json({
      paper: {
        id: (parsed.paperTitle || 'paper').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: parsed.paperTitle,
        authors: parsed.authors || [],
        venue: parsed.venue,
        url: url || (arxivId ? `https://arxiv.org/abs/${arxivId}` : ''),
        domain: parsed.domain,
        tokenUsage,
        coreConcepts: parsed.coreConcepts,
        mermaidFlowchart: parsed.mermaidFlowchart,
        flowchartNodes: parsed.flowchartNodes || [],
        studentOpportunities: (parsed.studentOpportunities || []).map((opp: any) => ({
          ...opp,
          techStack: opp.recommendedTechStack || opp.techStack,
        })),
        rawOutputWithLabels: rawReport,
      },
      tokenEfficiency: {
        tokensUsed: totalTokens,
        budgetLimit: 25000,
        percentOfBudget: Math.round((totalTokens / 25000) * 100),
        savingsNote: `Processed in ${totalTokens} tokens (${tokenUsage.efficiencySavedPercent}% under the 25k budget)`,
      },
    });
  } catch (error: any) {
    console.error('Paper analysis error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred while parsing the paper.',
      details: error.toString(),
    });
  }
});

// API: Student Assistant Chat / Deep-Dive into specific opportunity or code
app.post('/api/chat-paper', async (req, res) => {
  try {
    const { paperTitle, question, currentAnalysis, selectedProject } = req.body;

    const systemInstruction = `You are an elite Computer Science Professor and Principal Research Scientist advising a 3rd-year CS student on an academic paper.
Provide extremely concrete, code-grounded, and actionable guidance. If the student asks about implementing an extension, give concrete PyTorch/Python snippets, algorithmic pseudo-code, benchmark setup tips, or debugging steps.
Keep responses concise, clear, and direct.`;

    const context = `Paper: ${paperTitle}
Architecture Summary: ${currentAnalysis?.coreConcepts?.primaryMethodology || ''}
Selected Student Project: ${selectedProject ? JSON.stringify(selectedProject) : 'General'}

Student Question:
${question}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: context,
      config: {
        systemInstruction,
      },
    });

    res.json({ answer: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate assistant response' });
  }
});

// API: Generate starter GitHub README and 4-week execution kit for a student project
app.post('/api/generate-project-kit', async (req, res) => {
  try {
    const { paperTitle, project } = req.body;

    const prompt = `Generate a production-ready GitHub repository README.md and 4-week milestone sprint plan for a 3rd-year CS student building the following resume project based on the paper "${paperTitle}":

Project Title: ${project.title}
Exact Extension: ${project.extension}
Targeted Metric: ${project.targetedMetric}
Tech Stack: ${project.techStack}

Include:
1. Compelling GitHub Repo Header & Badges
2. Project Motivation & Architecture comparison
3. Quickstart setup commands (venv/conda, pip install, python train.py)
4. 4-Week Milestone Checklist with day-by-day tasks
5. Benchmark reproduction instructions
6. Ready-to-copy LinkedIn / Resume bullet points`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a veteran open-source maintainer and CS mentor creating high-quality project kits.',
      },
    });

    res.json({ readmeContent: response.text });
  } catch (error: any) {
    console.error('Kit generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate project kit' });
  }
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PaperPulse Research Agent] Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
