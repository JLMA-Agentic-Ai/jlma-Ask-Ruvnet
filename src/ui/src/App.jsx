import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import packageJson from '../../../package.json';
import PDFPresentation from './PDFPresentation';
import './App.css';

// Error Boundary — must be a class component per React spec
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#e5e5e5', background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Something went wrong</h2>
          <p style={{ marginBottom: '1.5rem', color: '#888' }}>The application encountered an unexpected error.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #ec4899)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Initialize Mermaid -- startOnLoad must be false since we render manually
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
  fontFamily: 'Inter, system-ui, sans-serif',
});

// Helper: relative time string
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return 'today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
};

// CEO & CTO presentation decks
const DECK_DOCS = [
  { file: 'Ruflo-v35-CEO-Deck.pdf', title: 'CEO Deck: RuvNet — The Complete Agentic Stack', desc: 'Why RuvNet is 2 std devs beyond state of the art, free, and compounds at AI speed', icon: '👔', type: 'pdf' },
  { file: 'Ruflo-v35-CTO-Deck.pdf', title: 'CTO Deck: RuvNet Technical Architecture', desc: 'Architecture deep-dive — RuVector, Ruflo, AIMDS, RVF, SONA, benchmarks', icon: '🔧', type: 'pdf' },
];

// NotebookLM deep-dive interactive notebook
const NOTEBOOKLM_URL = 'https://notebooklm.google.com/notebook/50a4a2ef-a743-4fc7-81e3-774b95c667c3';

// Resource documents available at /assets/docs/ — Auto-synced 2026-03-09
const RESOURCE_DOCS = [
  { file: 'Whats_New_RuvNet_Stack_March2026.mp4', title: 'What\'s New (March 2026)', desc: 'Latest updates across Ruflo, RuVector, RuView, Dossier', icon: '🔊', type: 'video' },
  { file: 'Architecture_That_Changes_Everything.mp4', title: 'The Architecture That Changes Everything', desc: 'Why this is 2 std devs beyond state-of-art', icon: '🔊', type: 'video' },
  { file: 'How_Ruflo_Actually_Works.mp4', title: 'How Ruflo Actually Works', desc: 'Deep architecture explainer — agents, MCP, AgentDB', icon: '🎬', type: 'video' },
  { file: 'Impossible_Apps_RuvNet.mp4', title: 'Impossible Apps', desc: 'Applications only buildable with the RuvNet stack', icon: '🎬', type: 'video' },
  { file: 'From_Zero_to_Production_Getting_Started.mp4', title: 'From Zero to Production', desc: 'Hands-on getting started tutorial', icon: '🎬', type: 'video' },
  { file: 'RuView_WiFi_Sensing.mp4', title: 'RuView: WiFi Sensing', desc: 'WiFi pose estimation through walls — science fiction made real', icon: '🎬', type: 'video' },
  { file: 'Why_Dev_Teams_Should_Switch.mp4', title: 'Why Dev Teams Should Switch', desc: 'Generations beyond Cursor, Copilot, and Devin', icon: '🎬', type: 'video' },
  { file: 'Business_Case_Why_Your_Company_Needs_This.pdf', title: 'Business Case', desc: 'C-level deck: why your company needs this now', icon: '📊', type: 'pdf' },
  { file: 'RuvNet_Ecosystem_Map.png', title: 'RuvNet Ecosystem Map', desc: 'Complete visual map of the entire ecosystem', icon: '🗺️', type: 'image' },
];

// Extract LLM-generated follow-up questions from "## Explore Further" / "## Learn More" sections
const extractExploreFurther = (content) => {
  if (!content) return [];
  // Match headings like "## Explore Further", "## Learn More", "## Questions to Explore", etc.
  const headingPattern = /##\s*(?:Explore\s*Further|Learn\s*More|Questions?\s*(?:to\s*)?Explore|Further\s*Reading|Next\s*Steps|Dig\s*Deeper)\s*\n/i;
  const match = content.match(headingPattern);
  if (!match) return [];

  // Get everything after the heading until the next heading or end of content
  const startIdx = match.index + match[0].length;
  const rest = content.slice(startIdx);
  const nextHeading = rest.search(/\n##\s/);
  const section = nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;

  // Extract bullet points or numbered items
  const lines = section.split('\n')
    .map(line => line.trim())
    .filter(line => /^[-*\d.)\u2022]\s*/.test(line) || /^\*\*/.test(line))
    .map(line =>
      line
        .replace(/^[-*\u2022]\s*/, '')       // strip bullet markers
        .replace(/^\d+[.)]\s*/, '')          // strip numbered list markers
        .replace(/\*\*/g, '')                // strip bold markdown
        .replace(/^\*|\*$/g, '')             // strip italic markers
        .replace(/^\[|\]$/g, '')             // strip bracket wrappers
        .replace(/\?$/, '') + '?'            // ensure ends with ?
    )
    .map(line => line.replace(/\?\?$/, '?')) // fix double question marks
    .filter(line => line.length > 5 && line.length < 200);

  return lines.slice(0, 3);
};

// Follow-up suggestion generator based on response keywords (FALLBACK)
const getFollowUpSuggestions = (content) => {
  const lower = (content || '').toLowerCase();
  if (lower.includes('ruflo') || lower.includes('claude-flow') || lower.includes('claude flow') || lower.includes('agentic flow')) {
    return ['What agents does Ruflo v3.5 include?', 'How does the ReasoningBank self-learning work?', 'Show me the swarm architecture'];
  }
  if (lower.includes('ruvector') || lower.includes('hnsw') || lower.includes('vector')) {
    return ['How does HNSW compare to pgvector?', 'What is the RVF cognitive container format?', 'What apps can be built with RuVector?'];
  }
  if (lower.includes('reasoning') || lower.includes('learning') || lower.includes('neural')) {
    return ['How does SONA real-time learning work?', 'What is the Prime Radiant anti-hallucination engine?', 'Show me the intelligence pipeline'];
  }
  if (lower.includes('rust') || lower.includes('wasm') || lower.includes('crate')) {
    return ['What is Micro-HNSW and how small is it?', 'How does the WASM runtime work?', 'What are the core Rust crates in the ecosystem?'];
  }
  if (lower.includes('rvf') || lower.includes('cognitive container') || lower.includes('format')) {
    return ['What are the 24 segments of an RVF?', 'How does RVF enable offline AI?', 'Show me the RVF architecture'];
  }
  if (lower.includes('pi') || lower.includes('collective') || lower.includes('shared brain') || lower.includes('hive')) {
    return ['How does Pi cryptographic trust work?', 'What is Byzantine fault tolerance in Pi?', 'How do WASM edge nodes earn rewards?'];
  }
  if (lower.includes('ecosystem') || lower.includes('overview') || lower.includes('platform')) {
    return ['How do all the pieces connect?', 'What makes this different from LangChain?', 'What is Pi collective intelligence?'];
  }
  return ['Tell me more about this', 'What are the practical applications?', 'What is Pi collective intelligence (pi.ruv.io)?'];
};

// Rotating hero taglines for dual-audience messaging
const HERO_TAGLINES = [
  'For executives: See ROI in 5 days, not 5 months',
  'For engineers: npx ruflo@latest \u2192 60 coordinated agents',
  'For teams: One brain that learns across every department',
];

// Hero with capability tiles, prompt starters, resources, and latest updates
const HeroSection = ({ onAction, onCapability, ecosystemStats, knowledgeData, latestRepos }) => {
  const repoCount = ecosystemStats?.totalRepos || 170;
  const entryCount = ecosystemStats?.totalEntries || 54543;
  const videoCount = knowledgeData?.videoStats?.total || 28;
  const [taglineIdx, setTaglineIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTaglineIdx(i => (i + 1) % HERO_TAGLINES.length), 4000);
    return () => clearInterval(id);
  }, []);
  return (
  <div className="hero-compact">
    <img src="/assets/Ruv prompt.png" alt="RuvNet" className="hero-logo-sm" />
    <h1 className="hero-heading">What do you want to learn?</h1>
    <p className="hero-rotating-tagline" key={taglineIdx}>{HERO_TAGLINES[taglineIdx]}</p>
    <p className="hero-tagline">Explore the agentic AI ecosystem — 80+ Rust crates, {videoCount} deep-dive video sessions, and a growing collective intelligence network.</p>

    {/* Capability Tiles */}
    <div className="capability-tiles" role="navigation" aria-label="Explore capabilities">
      <button className="capability-tile" onClick={() => onCapability('pi')}>
        <span className="tile-icon-wrapper tile-pi"><span className="tile-icon">🧠</span></span>
        <span className="tile-label">Pi Collective Intelligence</span>
        <span className="tile-count">NEW — Shared AI Brain</span>
      </button>
      <button className="capability-tile" onClick={() => onCapability('videos')}>
        <span className="tile-icon-wrapper tile-videos"><span className="tile-icon">📹</span></span>
        <span className="tile-label">Videos</span>
        <span className="tile-count">{videoCount} Sessions</span>
      </button>
      <button className="capability-tile" onClick={() => onCapability('decks')}>
        <span className="tile-icon-wrapper tile-decks"><span className="tile-icon">📊</span></span>
        <span className="tile-label">CEO & CTO Decks</span>
        <span className="tile-count">Presentations</span>
      </button>
      <button className="capability-tile" onClick={() => onCapability('universe')}>
        <span className="tile-icon-wrapper tile-universe"><span className="tile-icon">🌌</span></span>
        <span className="tile-label">Knowledge Universe</span>
        <span className="tile-count">3D Explorer</span>
      </button>
      <button className="capability-tile" onClick={() => onCapability('kb')}>
        <span className="tile-icon-wrapper tile-kb"><span className="tile-icon">📚</span></span>
        <span className="tile-label">Knowledge Base</span>
        <span className="tile-count">{entryCount.toLocaleString()}+ Entries</span>
      </button>
      <button className="capability-tile" onClick={() => onCapability('rvf-engine')}>
        <span className="tile-icon-wrapper tile-rvf"><span className="tile-icon">&#9889;</span></span>
        <span className="tile-label">RVF Engine</span>
        <span className="tile-count">Live Demo</span>
      </button>
      <button className="capability-tile" onClick={() => onCapability('notebooklm')}>
        <span className="tile-icon-wrapper tile-nlm"><span className="tile-icon">📓</span></span>
        <span className="tile-label">NotebookLM</span>
        <span className="tile-count">Interactive AI</span>
      </button>
    </div>

    {/* Prompt Starters */}
    <div className="prompt-starters">
      <button onClick={() => onAction('What is Pi collective intelligence (pi.ruv.io) and how does it create a shared AI brain with cryptographic trust?')} className="prompt-pill prompt-pill-demo">
        <span className="pill-icon">🧠</span> Pi Brain — NEW
      </button>
      <button onClick={() => onAction('Give me a 60-second overview of what Ruflo can do, with a diagram')} className="prompt-pill">
        <span className="pill-icon">&#9889;</span> Try it live
      </button>
      <button onClick={() => onAction('What is Ruflo v3.5, its specialized agents, swarm topologies, and capabilities?')} className="prompt-pill">
        <span className="pill-icon">⚡</span> Ruflo v3.5
      </button>
      <button onClick={() => onAction('How does the ReasoningBank self-learning system work in Agentic Flow?')} className="prompt-pill">
        <span className="pill-icon">🧠</span> ReasoningBank
      </button>
      <button onClick={() => onAction('What is RuVector and how does it compare to pgvector for AI applications?')} className="prompt-pill">
        <span className="pill-icon">🔮</span> RuVector DB
      </button>
      <button onClick={() => onAction('What are the core Rust crates in the rUv ecosystem and how do they connect?')} className="prompt-pill">
        <span className="pill-icon">🦀</span> Rust Ecosystem
      </button>
      <button onClick={() => onAction('What impossible applications can be built with RuVector that traditional tools cannot?')} className="prompt-pill">
        <span className="pill-icon">🚀</span> Impossible Apps
      </button>
      <button onClick={() => onAction("What's new in the agentic AI ecosystem and latest RuVector developments?")} className="prompt-pill">
        <span className="pill-icon">🆕</span> What's New
      </button>
    </div>

    {/* Social proof is now in the animated stats bar at the top */}

    {/* Resource Documents */}
    <div className="resource-section">
      <h3 className="resource-heading">Resources & Documents</h3>
      <div className="resource-grid">
        {RESOURCE_DOCS.map((doc, i) => (
          <button key={i} className={`resource-card resource-${doc.type}`} onClick={() => doc.type === 'notebooklm' ? window.open(doc.url, '_blank', 'noopener,noreferrer') : onAction(doc.type === 'video' ? `VIEW_VIDEO:${doc.file}` : doc.type === 'image' ? `VIEW_IMAGE:${doc.file}` : `VIEW_PDF:${doc.file}`)}>
            <span className="resource-icon">{doc.icon}</span>
            <span className="resource-text">
              <span className="resource-title">{doc.title}</span>
              {doc.desc && <span className="resource-desc">{doc.desc}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>

    {/* Latest Updates — shows 10 most active repos from /api/latest-repos */}
    {latestRepos && latestRepos.length > 0 && (
      <div className="latest-updates">
        <h3 className="resource-heading">Latest Updates ({latestRepos.length} Active Repos)</h3>
        <div className="updates-scroll">
          {latestRepos.slice(0, 10).map((repo, i) => (
            <div key={i} className="update-card" onClick={() => onAction(`Tell me about ${repo.name} — what does it do, its architecture, and key features`)}>
              <span className="update-name">{repo.name}</span>
              <span className="update-meta">{repo.entryCount?.toLocaleString() || '—'} entries{repo.lastUpdated ? ` · ${timeAgo(repo.lastUpdated)}` : ''}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
  );
};

// Expandable Source Cards with Pagination
const SourceCards = ({ sources }) => {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 6;
  const defaultShow = 3;

  if (!sources || sources.length === 0) return null;

  const visibleSources = expanded ? sources.slice(page * perPage, (page + 1) * perPage) : sources.slice(0, defaultShow);
  const totalPages = Math.ceil(sources.length / perPage);

  return (
    <div className="sources">
      <div className="sources-header">
        <span className="sources-title">Sources ({sources.length})</span>
        {sources.length > defaultShow && (
          <button className="sources-toggle" onClick={() => { setExpanded(!expanded); setPage(0); }}>
            {expanded ? 'Show less' : `Show all ${sources.length}`}
          </button>
        )}
      </div>
      <div className={`sources-grid ${expanded ? 'expanded' : ''}`}>
        {visibleSources.map((src, si) => {
          const githubUrl = src.file_path
            ? (src.file_path.startsWith('github://')
                ? src.file_path.replace('github://', 'https://github.com/').replace(/^([^/]+)\/([^/]+)\/(.+)$/, '$1/$2/blob/main/$3')
                : src.file_path.startsWith('http') ? src.file_path
                : src.file_path.startsWith('/tmp/ruvnet-repos/')
                  ? (() => { const parts = src.file_path.replace('/tmp/ruvnet-repos/', '').split('/'); return parts.length >= 2 ? `https://github.com/ruvnet/${parts[0]}/blob/main/${parts.slice(1).join('/')}` : null; })()
                  : null)
            : null;
          const rawTitle = src.title || src.package_name || src.id || `Source ${si + 1}`;
          // Strip markdown formatting from source card titles
          const displayTitle = rawTitle.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim();
          const score = src.score ? Math.round(src.score * 100) : null;
          return (
            <div key={si} className={`source-card ${src.triage_tier === 'gold' ? 'source-gold' : ''}`}>
              <div className="source-card-badges">
                {src.triage_tier === 'gold' && <span className="source-badge gold">gold</span>}
                {src.doc_type && <span className={`source-badge ${src.doc_type}`}>{src.doc_type}</span>}
                {score && <span className="source-score">{score}%</span>}
              </div>
              <div className="source-card-title">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="source-link">{displayTitle}</a>
                ) : (
                  <span className="source-name">{displayTitle}</span>
                )}
              </div>
              {src.package_name && <span className="source-pkg">{src.package_name}</span>}
              {src.topics && src.topics.length > 0 && (
                <div className="source-topics">
                  {src.topics.slice(0, 3).map((t, ti) => <span key={ti} className="source-topic">{t}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {expanded && totalPages > 1 && (
        <div className="sources-pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="page-btn">Prev</button>
          <span className="page-info">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="page-btn">Next</button>
        </div>
      )}
    </div>
  );
};

let mermaidCounter = 0;

function MermaidBlock({ code }) {
  const ref = React.useRef(null);
  const [svg, setSvg] = React.useState('');
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    // Generate a unique ID per render call -- Mermaid consumes the ID
    const uniqueId = `mermaid-${Date.now()}-${++mermaidCounter}`;

    // Clean up orphaned mermaid SVGs that escape from the rendering container
    const cleanupOrphans = () => {
      const orphan = document.getElementById(uniqueId);
      if (orphan) orphan.remove();
      // Also remove any mermaid-created container for this ID
      const container = document.querySelector(`[data-id="${uniqueId}"]`);
      if (container) container.remove();
    };

    mermaid.render(uniqueId, code).then(({ svg: renderedSvg }) => {
      if (!cancelled) {
        // Mermaid 11.x can resolve with an error SVG instead of rejecting
        if (renderedSvg && renderedSvg.includes('Syntax error')) {
          setError('Mermaid syntax error in diagram');
          cleanupOrphans();
        } else {
          setSvg(renderedSvg);
          setError(null);
        }
      }
      cleanupOrphans();
    }).catch(err => {
      if (!cancelled) setError(err.message || 'Diagram render failed');
      cleanupOrphans();
    });
    return () => { cancelled = true; cleanupOrphans(); };
  }, [code]);

  React.useEffect(() => {
    if (ref.current && svg) {
      ref.current.innerHTML = svg;
    }
  }, [svg]);

  if (error) {
    return (
      <div className="mermaid-error">
        <div className="mermaid-error-label">Diagram could not render — showing source</div>
        <pre><code>{code}</code></pre>
      </div>
    );
  }
  if (!svg) return <div className="mermaid-loading" role="status" aria-label="Loading diagram">Loading diagram...</div>;
  return <div className="mermaid-diagram" ref={ref} role="img" aria-label="Architecture diagram" />;
}

// Stable markdown components reference to avoid re-creation on every render
const markdownComponents = {
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';
    const isInline = !node?.position?.start || node.position.start.line === node.position.end.line;
    if (lang === 'mermaid' && !isInline) {
      return <MermaidBlock code={String(children).replace(/\n$/, '')} />;
    }
    if (!isInline && lang) {
      return (
        <div className="code-block-wrapper">
          <div className="code-block-header">
            <span className="code-lang-label">{lang}</span>
            <button
              className="code-copy-btn"
              onClick={() => navigator.clipboard.writeText(String(children))}
              aria-label="Copy code"
            >
              Copy
            </button>
          </div>
          <pre className={className}><code {...props}>{children}</code></pre>
        </div>
      );
    }
    if (!isInline) {
      return <pre><code className={className} {...props}>{children}</code></pre>;
    }
    return <code className={className} {...props}>{children}</code>;
  },
  h2({ children, ...props }) {
    const text = String(children);
    const sectionIcons = {
      'TL;DR': 'tldr',
      'Core Explanation': 'core',
      'Architecture': 'architecture',
      'Practical Example': 'example',
      'What to Watch For': 'watchfor',
      'Explore Further': 'explore',
    };
    const sectionClass = Object.entries(sectionIcons).find(([key]) => text.includes(key));
    return (
      <h2 className={sectionClass ? `section-heading section-${sectionClass[1]}` : ''} {...props}>
        {children}
      </h2>
    );
  },
};

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState('Balanced');
  const [canvasContent, setCanvasContent] = useState(null);
  const [listening, setListening] = useState(false);
  const [file, setFile] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [knowledgeData, setKnowledgeData] = useState(null);
  const [ecosystemStats, setEcosystemStats] = useState(null);
  const [communityStats, setCommunityStats] = useState(null);
  const [latestRepos, setLatestRepos] = useState(null);

  const [presentationMode, setPresentationMode] = useState(false);
  const [showResourceDrawer, setShowResourceDrawer] = useState(false);
  const [levelToast, setLevelToast] = useState(null);

  const LEVEL_TOOLTIPS = {
    Simple: "Explain like I'm 5 — no jargon, lots of analogies",
    Beginner: 'New to coding — real-world examples, gentle explanations',
    Balanced: 'Intermediate depth — practical examples with architecture details',
    Technical: 'Expert level — benchmarks, internals, API details',
  };

  const handleLevelChange = (newLevel) => {
    setLevel(newLevel);
    setLevelToast(newLevel);
    setTimeout(() => setLevelToast(null), 1800);
  };

  // Auto view mode: canvas shows when content exists; presentation only when user explicitly toggles
  const effectiveViewMode = canvasContent
    ? (presentationMode ? 'presentation' : 'split')
    : 'chat';

  // Fetch live knowledge data on mount
  const [kbWarning, setKbWarning] = useState(null);
  useEffect(() => {
    fetch('/api/knowledge').then(r => r.json()).then(data => setKnowledgeData(data)).catch(() => {});
    fetch('/api/ecosystem-stats').then(r => r.json()).then(data => setEcosystemStats(data)).catch(() => {});
    fetch('/api/latest-repos').then(r => r.json()).then(data => setLatestRepos(data)).catch(() => {});
    fetch('/api/community-stats').then(r => r.json()).then(data => setCommunityStats(data)).catch(() => {});
    // Check KB health — surface problems immediately
    fetch('/api/kb-stats').then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.error || 'KB unavailable'); });
      return r.json();
    }).then(data => {
      if (!data.connected || data.status === 'not_initialized') {
        setKbWarning('Knowledge base is not loaded. Answers may be inaccurate.');
      } else if (data.vectorCount === 0) {
        setKbWarning('Knowledge base is empty (0 entries). Answers will be from general AI knowledge only.');
      } else {
        setKbWarning(null);
      }
    }).catch(err => {
      setKbWarning(`Knowledge base error: ${err.message}`);
    });
  }, []);

  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const resourceDrawerRef = useRef(null);
  const resourceToggleRef = useRef(null);

  const toggleTheme = () => {
    document.body.classList.toggle('light-mode');
    setIsDarkMode(!isDarkMode);
  };

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Render Mermaid in canvas
  useEffect(() => {
    if (canvasContent?.type === 'diagram' && canvasRef.current) {
      const canvasId = `mermaid-canvas-${Date.now()}`;
      mermaid.render(canvasId, canvasContent.content).then(({ svg }) => {
        if (canvasRef.current) canvasRef.current.innerHTML = svg;
      }).catch(err => {
        console.error('Mermaid canvas render error:', err);
        if (canvasRef.current) canvasRef.current.textContent = 'Diagram failed to render';
      });
    }
  }, [canvasContent]);

  // Focus management for resource drawer
  useEffect(() => {
    if (showResourceDrawer && resourceDrawerRef.current) {
      resourceDrawerRef.current.focus();
    } else if (!showResourceDrawer && resourceToggleRef.current) {
      resourceToggleRef.current.focus();
    }
  }, [showResourceDrawer]);

  const handleSubmit = async (e, specialMode = null) => {
    e?.preventDefault();
    if (!input.trim() && !specialMode) return;

    const queryText = specialMode || input;

    // Handle Video Library
    if (queryText === 'VIEW_VIDEOS') {
      const videos = [
        { id: '1_s07kapkb', date: '2026-01-16', dur: '1h 51m', title: 'Building Agentic Systems at Scale: Architecture, Security, and Real-World Implementation' },
        { id: '1_xlre6ukc', date: '2026-01-16', dur: '1h 49m', title: 'Ruflo v3 Release: Revolutionary Agentic AI System with 500K+ Downloads' },
        { id: '1_33xvl0xn', date: '2026-01-29', dur: '1h 5m',  title: 'Agentix Foundation: Building a Global Community for Agentic AI Development' },
        { id: '1_rozlzilu', date: '2026-01-28', dur: '1h 14m', title: 'London Meetup — AI Powered Content Creation: From Sheet Music to Semantic Graphs' },
        { id: '1_8afwqubg', date: '2026-01-23', dur: '2h 1m',  title: 'Building Agentic Systems: Network Topologies, Skills Aggregation, and AI Infrastructure' },
        { id: '1_nvkgdvm8', date: '2026-01-?',  dur: '—',      title: 'Ruflo v3: Building AI Systems with Hive-Mind Intelligence' },
        { id: '1_392oe5oa', date: '2026-01-?',  dur: '—',      title: 'Ruflo v3: Building Intelligent Agents with Self-Learning Vector Systems' },
        { id: '1_oowknql6', date: '2026-01-?',  dur: '—',      title: 'Ruflo v3 and Agentic Systems: Building the Future of AI Development' },
        { id: '1_04q83xk2', date: '2025-11-14', dur: '1h 32m', title: 'AI Hackerspace Live — Nov 7' },
        { id: '1_x6y3m453', date: '2025-12-06', dur: '5h',     title: 'Building the Future: AI-Powered Media Discovery and Smart TV Integration at the Global AI Hackathon' },
        { id: '1_dpwbbr66', date: '2025-?',     dur: '—',      title: 'Agentic AI Revolution: Building Autonomous Intelligent Systems for Real-World Impact' },
        { id: '1_dxehuvpf', date: '2025-?',     dur: '—',      title: 'Building the Prime Radiant: A Coherence Engine for AI Anti-Hallucination' },
        { id: '1_hpe5jw3w', date: '2025-?',     dur: '—',      title: 'From Concept to Code: How Claude AI and Agentic Systems Are Reshaping Development' },
        { id: '1_rtjw6iv4', date: '2025-?',     dur: '—',      title: 'Building Agentic AI Solutions: Ruflo, Anti-Gravity, and Real-World Applications' },
        { id: '1_b72cmcnd', date: '2025-10-17', dur: '5m',     title: 'Devoxx BE Conference: The Rise of AI Agents' },
        { id: '1_prlsngek', date: '2025-?',     dur: '—',      title: 'Root Vector: Building the World\'s Fastest AI Search' },
        { id: '1_2156iluo', date: '2025-?',     dur: '—',      title: 'From Helsinki to the World: Finland\'s AI-Native Government Transformation' },
        { id: '1_ay4ozec9', date: '2025-?',     dur: '—',      title: 'Breaking Down Content Silos: A 72-Hour Hackathon to Unify Streaming Discovery' },
        { id: '1_3c70sv2p', date: '2025-?',     dur: '—',      title: 'From Hackathon to Market: Building AI-Powered Media Discovery at Scale' },
        { id: '1_40wp4k60', date: '2025-?',     dur: '—',      title: 'OS-Level Automation and Agentic Systems: Building the Future of Computer Use' },
      ];
      const baseUrl = 'https://video.agentics.org/media/t/';
      const content = `# 📹 Agentic Foundation Video Library\n\n**${videos.length} Sessions** — All sourced from Agentics Foundation. Full summaries and key topics are indexed in the knowledge base.\n\n---\n\n${videos.map(v => `### 🎬 ${v.title}\n📅 ${v.date} · ⏱ ${v.dur}\n[▶ Watch on Agentics Foundation](${baseUrl}${v.id}) · Ask: *"What was covered in the ${v.title.split(':')[0]} session?"*\n`).join('\n')}\n\n---\n\n> 💡 **All 20 sessions are fully summarized in RuVector.** Ask questions like *"What did rUv say about agent memory?"* or *"How does the Prime Radiant prevent hallucinations?"*`;
      setCanvasContent({ type: 'text', content, title: 'Agentic Foundation Video Library', action: 'videos' });
      return;
    }

    // Handle Knowledge Universe
    if (queryText === 'VIEW_UNIVERSE') {
      setCanvasContent({
        type: 'iframe',
        content: '/knowledge-universe.html',
        title: 'Knowledge Universe',
        action: 'universe'
      });
      return;
    }

    // Handle document viewing
    if (queryText.startsWith('VIEW_PDF:')) {
      const filename = queryText.replace('VIEW_PDF:', '');
      setCanvasContent({
        type: 'pdf',
        content: `/assets/docs/${filename}`,
        title: filename.replace(/_/g, ' ').replace('.pdf', ''),
        action: 'document'
      });
      return;
    }

    if (queryText.startsWith('VIEW_VIDEO:')) {
      const filename = queryText.replace('VIEW_VIDEO:', '');
      setCanvasContent({
        type: 'video',
        content: `/assets/docs/${filename}`,
        title: filename.replace(/_/g, ' ').replace('.mp4', ''),
        action: 'document'
      });
      return;
    }

    if (queryText.startsWith('VIEW_IMAGE:')) {
      const filename = queryText.replace('VIEW_IMAGE:', '');
      setCanvasContent({
        type: 'image',
        content: `/assets/docs/${filename}`,
        title: filename.replace(/_/g, ' ').replace('.png', ''),
        action: 'document'
      });
      return;
    }

    const userMsg = { role: 'user', content: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Use SSE streaming endpoint for real-time token display
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          mode: level,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
      }

      // Add a placeholder assistant message for streaming
      const placeholderIdx = messages.length + 1; // index after user msg
      setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [], streaming: true }]);
      setLoading(false); // Turn off spinner, streaming indicator takes over

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedContent = '';
      let streamSources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEventType = null;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event: ')) {
            currentEventType = trimmed.slice(7).trim();
            continue;
          }
          if (!trimmed.startsWith('data: ')) continue;
          const rawData = trimmed.slice(6);
          const eventType = currentEventType;
          currentEventType = null; // Reset for next event

          try {
            const parsed = JSON.parse(rawData);

            // Check if it's sources array
            if (Array.isArray(parsed)) {
              streamSources = parsed;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, sources: parsed };
                }
                return updated;
              });
              continue;
            }

            // Check for KB warning from server
            if (eventType === 'kb_warning') {
              setKbWarning(parsed?.message || 'Knowledge base is degraded');
              continue;
            }

            // Check if it's confidence data (event: confidence or object with confidence key)
            if (eventType === 'confidence' || (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.confidence !== undefined)) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, confidence: parsed.confidence, confidenceLabel: parsed.label || null };
                }
                return updated;
              });
              continue;
            }

            // Check if it's a done event (explicitly via event type, or by shape)
            if (eventType === 'done' || (parsed && typeof parsed === 'object' && parsed.length !== undefined && !Array.isArray(parsed))) {
              // Done event may also carry confidence data
              const doneConfidence = parsed?.confidence;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  const extra = doneConfidence !== undefined ? { confidence: doneConfidence, confidenceLabel: parsed.label || null } : {};
                  updated[updated.length - 1] = { ...last, streaming: false, ...extra };
                }
                return updated;
              });
              continue;
            }

            // Check if it's an error
            if (parsed && parsed.error) {
              throw new Error(parsed.error);
            }

            // It's a token string
            if (typeof parsed === 'string') {
              streamedContent += parsed;
              const currentContent = streamedContent;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: currentContent };
                }
                return updated;
              });
            }
          } catch (parseErr) {
            // Skip unparseable lines
          }
        }
      }

      // Ensure streaming is marked complete (safety net)
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant' && last.streaming) {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });

      // Final scroll
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        // If last message is a streaming placeholder, update it with error
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant' && last.streaming) {
          updated[updated.length - 1] = { role: 'assistant', content: "Error: " + err.message };
        } else {
          updated.push({ role: 'assistant', content: "Error: " + err.message });
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const [knowledgeRes, statsRes] = await Promise.all([
        fetch('/api/knowledge'),
        fetch('/api/ecosystem-stats')
      ]);
      const data = await knowledgeRes.json();
      const stats = await statsRes.json();
      const timestamp = new Date().toLocaleString();
      const videoCount = data.videoStats?.total || 28;
      const totalRepos = stats.totalRepos || data.repos?.length || 148;
      const totalEntries = stats.totalEntries || data.kb_total_entries || 54543;
      const ruflo = data.repos?.find(r => r.name === 'ruflo');
      const rufloVersion = ruflo?.version || '3.5.2';

      const report = `# Knowledge Base Status\n\n` +
        `| Metric | Value |\n|--------|-------|\n` +
        `| Status | 🟢 Online |\n` +
        `| Last Updated | ${timestamp} |\n` +
        `| Total Repos | **${totalRepos}** across 3 orgs |\n` +
        `| KB Entries | **${totalEntries.toLocaleString()}** |\n` +
        `| Gold Curated | **${(stats.goldCount || 339).toLocaleString()}** |\n` +
        `| Videos | **${videoCount}** sessions |\n` +
        `| Doc Types | **${stats.docTypes || 18}** |\n` +
        `| Backend | PostgreSQL RuVector + HNSW |\n\n` +
        `---\n\n## Ruflo (v${rufloVersion})\n\n` +
        `| Capability | Detail |\n|------------|--------|\n` +
        `| Agent Types | 60+ specialized (coder, architect, security, swarm, GitHub, SPARC, etc.) |\n` +
        `| Swarm Topologies | 7 (hierarchical, mesh, ring, star, hierarchical-mesh, hybrid, adaptive) |\n` +
        `| Lifecycle Hooks | 27 hooks + 12 background workers |\n` +
        `| CLI Commands | 26 commands, 140+ subcommands |\n` +
        `| Consensus | BFT, Raft, CRDT, Gossip, Quorum |\n` +
        `| Search Speed | HNSW 150x–12,500x faster |\n` +
        `| Neural | SONA <0.05ms, Flash Attention 2.49x–7.47x |\n` +
        `| Security | AIMDS 3-layer pipeline, AIDefence middleware |\n\n` +
        `---\n\n## PostgreSQL Knowledge Base\n\n` +
        (data.kb_stats ? `| Domain | Entries | Status |\n|--------|---------|--------|\n` +
        `| Ruflo & Agentic AI | ${data.kb_stats.domains?.ask_ruvnet?.total?.toLocaleString() || totalEntries.toLocaleString()} | ✅ Active |\n` +
        `| **Total** | **${totalEntries.toLocaleString()}** | **RuVector HNSW** |\n\n` : '') +
        `---\n\n## Key Tracked Packages\n\n` +
        `| Package | Version | Status |\n|---------|---------|--------|\n` +
        (data.repos?.length > 0 ? data.repos.map(r => {
          const statusIcon = r.status === 'PRODUCTION' ? '🚀' : r.status === 'ACTIVE' ? '🟢' : '🔗';
          return `| ${statusIcon} ${r.name} | v${r.version || 'latest'} | ${r.status || 'Linked'} |`;
        }).join('\n') : '_No packages configured._') +
        `\n\n*Plus ${Math.max(0, totalRepos - (data.repos?.length || 0))} additional repositories across ruvnet, openclaw, and VibiumDev orgs.*\n\n` +
        `---\n*Powered by Ruflo v3.5 + Agentic Flow HybridReasoningBank*`;

      setCanvasContent({ type: 'text', content: report, action: 'knowledge' });
    } catch (e) {
      console.error(e);
      setCanvasContent({
        type: 'text',
        content: `**SYSTEM ERROR:** Failed to retrieve knowledge base diagnostics.\n\n*Check server logs for details.*`,
        action: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onresult = (e) => setInput(e.results[0][0].transcript);
      recognition.start();
    } else {
      alert("Voice not supported");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const exportCanvas = () => {
    if (!canvasContent) return;
    const blob = new Blob([canvasContent.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas-export.txt';
    a.click();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text || canvasContent?.content || '');
  };

  // Universe overlay — full screen on mobile, below header on desktop
  const UniverseOverlay = canvasContent?.action === 'universe' ? (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 200, background: '#0a0a1a',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Close bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'max(0.5rem, env(safe-area-inset-top, 0.5rem)) 0.75rem 0.5rem',
        background: 'rgba(10,20,40,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(100,150,255,0.2)',
        flexShrink: 0, zIndex: 10,
      }}>
        <span style={{ color: '#7dd3fc', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Knowledge Universe
        </span>
        <button
          onClick={() => setCanvasContent(null)}
          style={{
            padding: '0.35rem 0.85rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px',
            color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem',
            fontFamily: 'system-ui, sans-serif',
            minHeight: '36px',
          }}
        >
          ✕ Close
        </button>
      </div>
      {/* iframe fills remaining space */}
      <iframe
        src="/knowledge-universe.html"
        title="Knowledge Universe"
        style={{ flex: 1, width: '100%', border: 'none', display: 'block', minHeight: 0 }}
      />
    </div>
  ) : null;

  // Capability tile handler
  const handleCapability = (type) => {
    switch (type) {
      case 'videos':
        handleSubmit(null, 'VIEW_VIDEOS');
        break;
      case 'decks':
        setCanvasContent({
          type: 'deck-picker',
          content: null,
          title: 'Presentation Decks',
          action: 'decks'
        });
        break;
      case 'universe':
        setCanvasContent({ type: 'iframe', content: '/knowledge-universe.html', title: 'Knowledge Universe', action: 'universe' });
        break;
      case 'kb':
        fetchKnowledge();
        break;
      case 'rvf-engine':
        setCanvasContent({ type: 'iframe', content: '/rvf-engine.html', title: 'RVF Engine Demo', action: 'rvf-engine' });
        break;
      case 'pi':
        handleSubmit(null, 'Tell me everything about Pi collective intelligence — what it is, how it works, why it matters, and how I can use it. Include architecture diagrams and practical examples.');
        break;
      case 'notebooklm':
        handleSubmit(null, 'What NotebookLM content is available for the RuVector ecosystem? Show me the audio overviews, video explainers, and deep-dive sessions I can explore.');
        break;
      default:
        break;
    }
  };

  return (
    <ErrorBoundary>
    <div className="app-container">
      <a href="#main-chat" className="skip-to-content">Skip to main content</a>
      {UniverseOverlay}

      {/* ===== HEADER TOOLBAR ===== */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <img src="/assets/ruv.png" alt="RuvNet" className="logo-img" />
            <span className="logo-text">
              Ask rUVnet <span className="version-tag">v{packageJson.version}</span>
            </span>
          </div>
          <button
            className="header-btn new-chat-btn"
            onClick={() => { setMessages([]); setCanvasContent(null); setInput(''); }}
            title="Start a new conversation"
            aria-label="Start a new conversation"
          >
            + New Chat
          </button>
        </div>
        <div className="header-right">
          <div className="header-control" style={{ position: 'relative' }}>
            <label className="header-label" htmlFor="level-select">Level</label>
            <select
              id="level-select"
              className={`header-select${levelToast ? ' level-changed' : ''}`}
              value={level}
              title={LEVEL_TOOLTIPS[level]}
              aria-label="Select explanation complexity level"
              onChange={(e) => handleLevelChange(e.target.value)}
            >
              <option value="Simple" title={LEVEL_TOOLTIPS.Simple}>Simple</option>
              <option value="Beginner" title={LEVEL_TOOLTIPS.Beginner}>Beginner</option>
              <option value="Balanced" title={LEVEL_TOOLTIPS.Balanced}>Balanced</option>
              <option value="Technical" title={LEVEL_TOOLTIPS.Technical}>Technical</option>
            </select>
            {levelToast && (
              <span className="level-toast" role="status" aria-live="polite">
                {LEVEL_TOOLTIPS[levelToast]}
              </span>
            )}
          </div>
          <button
            className={`header-icon-btn has-label ${canvasContent?.action === 'knowledge' ? 'active' : ''}`}
            onClick={() => canvasContent?.action === 'knowledge' ? setCanvasContent(null) : fetchKnowledge()}
            title="Knowledge Base"
            aria-label="Knowledge Base"
          >
            📚 <span className="icon-label">KB</span>
          </button>
          <button
            className={`header-icon-btn has-label ${canvasContent?.action === 'universe' ? 'active' : ''}`}
            onClick={() => canvasContent?.action === 'universe' ? setCanvasContent(null) : setCanvasContent({ type: 'iframe', content: '/knowledge-universe.html', title: 'Knowledge Universe', action: 'universe' })}
            title="Knowledge Universe"
            aria-label="Knowledge Universe"
          >
            🌌 <span className="icon-label">Universe</span>
          </button>
          <button className="header-icon-btn" onClick={toggleTheme} title={isDarkMode ? 'Light Mode' : 'Dark Mode'} aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ===== KB WARNING BANNER ===== */}
      {kbWarning && (
        <div className="kb-warning-banner" role="alert">
          <span>⚠️ {kbWarning}</span>
          <button onClick={() => setKbWarning(null)} aria-label="Dismiss warning">✕</button>
        </div>
      )}

      {/* ===== COMMUNITY STATS BAR ===== */}
      {(communityStats || ecosystemStats) && (
        <div className="stats-bar">
          {communityStats?.github?.totalStars > 0 && (<>
            <span><span className="stats-highlight">{(communityStats.github.totalStars).toLocaleString()}</span> GitHub Stars</span>
            <span className="stats-dot">·</span>
          </>)}
          {communityStats?.npm?.monthlyDownloads > 0 && (<>
            <span><span className="stats-highlight">{Math.round(communityStats.npm.monthlyDownloads / 1000)}K+</span> npm Downloads/mo</span>
            <span className="stats-dot">·</span>
          </>)}
          <span><span className="stats-highlight">{communityStats?.rustCrates || 80}+</span> Rust Crates</span>
          <span className="stats-dot">·</span>
          <span><span className="stats-highlight">{communityStats?.kbEntries || ecosystemStats?.totalEntries || 377}</span> KB Entries</span>
          {communityStats?.pi?.memories > 0 && (<>
            <span className="stats-dot">·</span>
            <span><span className="stats-highlight">{communityStats.pi.memories}</span> Pi Memories</span>
          </>)}
          {communityStats?.pi?.contributors > 0 && (<>
            <span className="stats-dot">·</span>
            <span><span className="stats-highlight">{communityStats.pi.contributors}</span> Contributors</span>
          </>)}
        </div>
      )}

      {/* ===== MAIN LAYOUT ===== */}
      <main className={`main-layout ${effectiveViewMode}`} role="main">
        {effectiveViewMode !== 'presentation' && (
          <div className="chat-panel">
            {/* Chat messages */}
            <div className="chat-container" id="main-chat" role="log" aria-live="polite" aria-label="Chat messages">
              {messages.length === 0 ? (
                <HeroSection
                  onAction={(prompt) => handleSubmit(null, prompt)}
                  onCapability={handleCapability}
                  ecosystemStats={ecosystemStats}
                  knowledgeData={knowledgeData}
                  latestRepos={latestRepos}
                />
              ) : (
                <>
                  {/* Collapsible resource drawer — accessible during chat */}
                  {showResourceDrawer && (
                    <div className="resource-drawer" role="dialog" aria-modal="true" aria-label="Resources and documents" ref={resourceDrawerRef} tabIndex={-1}>
                      <div className="resource-drawer-header">
                        <span className="resource-drawer-title">Resources & Explore</span>
                        <button className="resource-drawer-close" onClick={() => setShowResourceDrawer(false)} aria-label="Close resource drawer">✕</button>
                      </div>
                      <div className="capability-tiles capability-tiles-compact">
                        <button className="capability-tile" onClick={() => { handleCapability('pi'); setShowResourceDrawer(false); }}>
                          <span className="tile-icon-wrapper tile-pi"><span className="tile-icon">🧠</span></span>
                          <span className="tile-label">Pi Brain</span>
                        </button>
                        <button className="capability-tile" onClick={() => { handleCapability('videos'); setShowResourceDrawer(false); }}>
                          <span className="tile-icon-wrapper tile-videos"><span className="tile-icon">📹</span></span>
                          <span className="tile-label">Videos</span>
                        </button>
                        <button className="capability-tile" onClick={() => { handleCapability('decks'); setShowResourceDrawer(false); }}>
                          <span className="tile-icon-wrapper tile-decks"><span className="tile-icon">📊</span></span>
                          <span className="tile-label">Decks</span>
                        </button>
                        <button className="capability-tile" onClick={() => { handleCapability('universe'); setShowResourceDrawer(false); }}>
                          <span className="tile-icon-wrapper tile-universe"><span className="tile-icon">🌌</span></span>
                          <span className="tile-label">Universe</span>
                        </button>
                        <button className="capability-tile" onClick={() => { handleCapability('kb'); setShowResourceDrawer(false); }}>
                          <span className="tile-icon-wrapper tile-kb"><span className="tile-icon">📚</span></span>
                          <span className="tile-label">KB</span>
                        </button>
                        <button className="capability-tile" onClick={() => { handleCapability('rvf-engine'); setShowResourceDrawer(false); }}>
                          <span className="tile-icon-wrapper tile-rvf"><span className="tile-icon">&#9889;</span></span>
                          <span className="tile-label">RVF</span>
                        </button>
                        <button className="capability-tile" onClick={() => { handleCapability('notebooklm'); setShowResourceDrawer(false); }}>
                          <span className="tile-icon-wrapper tile-nlm"><span className="tile-icon">📓</span></span>
                          <span className="tile-label">NotebookLM</span>
                        </button>
                      </div>
                      <div className="resource-grid resource-grid-compact">
                        {RESOURCE_DOCS.map((doc, i) => (
                          <button key={i} className={`resource-card resource-${doc.type}`} onClick={() => {
                            if (doc.type === 'notebooklm') { window.open(doc.url, '_blank', 'noopener,noreferrer'); }
                            else { handleSubmit(null, doc.type === 'video' ? `VIEW_VIDEO:${doc.file}` : doc.type === 'image' ? `VIEW_IMAGE:${doc.file}` : `VIEW_PDF:${doc.file}`); }
                            setShowResourceDrawer(false);
                          }}>
                            <span className="resource-icon">{doc.icon}</span>
                            <span className="resource-text">
                              <span className="resource-title">{doc.title}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`} ref={idx === messages.length - 1 ? lastMessageRef : null}>
                      <div className="avatar">
                        {msg.role === 'assistant' ? <img src="/assets/Ruv prompt.png" alt="Ruv" className="avatar-img" /> : '👤'}
                      </div>
                      <div className="content">
                        {msg.streaming && !msg.content ? (
                          <div className="thinking-skeleton" role="status" aria-label="Generating response">
                            <div className="skeleton-bar" />
                            <div className="skeleton-bar" />
                            <div className="skeleton-bar" />
                            <div className="skeleton-bar skeleton-bar-short" />
                          </div>
                        ) : (
                          <div className={`markdown-content${msg.streaming ? ' streaming-cursor' : ''}`}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        {msg.role === 'assistant' && msg.confidence !== undefined && !msg.streaming && (
                          <div className={`confidence-badge confidence-${msg.confidence}`} aria-label={`Confidence: ${msg.confidence}`}>
                            <span className="confidence-dot" />
                            <span className="confidence-text">
                              {msg.confidence === 'high' && (msg.confidenceLabel || 'High confidence')}
                              {msg.confidence === 'medium' && (msg.confidenceLabel || 'Medium confidence')}
                              {msg.confidence === 'low' && (msg.confidenceLabel || 'Limited KB coverage — answer may be less reliable')}
                              {msg.confidence === 'none' && '⚠️ KB NOT LOADED — answer from general AI knowledge only'}
                            </span>
                          </div>
                        )}
                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                          <SourceCards sources={msg.sources} />
                        )}
                        {msg.role === 'assistant' && !msg.canvasGenerated && (
                          <>
                            <div className="message-actions">
                              <button className="action-btn" onClick={() => copyToClipboard(msg.content)} aria-label="Copy response to clipboard"><span aria-hidden="true">📋</span> Copy</button>
                              <button className="action-btn" onClick={() => setCanvasContent({ type: 'text', content: msg.content })} aria-label="Open response in canvas"><span aria-hidden="true">➡️</span> Open in Canvas</button>
                            </div>
                            {idx === messages.length - 1 && !msg.streaming && (
                              <>
                                {/* Quick Actions — one-click follow-ups */}
                                <div className="quick-actions">
                                  <button className="quick-action-btn" onClick={() => handleSubmit(null, `Show me a diagram of: ${msg.content.slice(0, 100)}`)} aria-label="Visualize as a diagram">
                                    <span className="qa-icon" aria-hidden="true">📐</span> Visualize
                                  </button>
                                  <button className="quick-action-btn" onClick={() => handleSubmit(null, `Give me a practical code example for: ${msg.content.slice(0, 100)}`)} aria-label="Show a code example">
                                    <span className="qa-icon" aria-hidden="true">💻</span> Code Example
                                  </button>
                                  <button className="quick-action-btn" onClick={() => handleSubmit(null, `Explain this more simply, as if to a non-technical person: ${msg.content.slice(0, 100)}`)} aria-label="Simplify the explanation">
                                    <span className="qa-icon" aria-hidden="true">✨</span> Simplify
                                  </button>
                                  <button className="quick-action-btn" onClick={() => handleSubmit(null, `Go deeper on the most important aspect of: ${msg.content.slice(0, 100)}`)} aria-label="Deep dive into the topic">
                                    <span className="qa-icon" aria-hidden="true">🔬</span> Deep Dive
                                  </button>
                                </div>
                                {/* Contextual resource cards — auto-surface based on query intent */}
                                {(() => {
                                  const lower = (msg.content || '').toLowerCase();
                                  const cards = [];
                                  if (lower.includes('ceo') || lower.includes('business') || lower.includes('roi') || lower.includes('executive')) {
                                    cards.push({ title: 'CEO Deck', desc: 'Business vision & ROI', icon: '👔', action: () => handleCapability('decks') });
                                  }
                                  if (lower.includes('cto') || lower.includes('architect') || lower.includes('stack') || lower.includes('benchmark')) {
                                    cards.push({ title: 'CTO Deck', desc: 'Architecture deep-dive', icon: '🔧', action: () => handleCapability('decks') });
                                  }
                                  if (lower.includes('wifi') || lower.includes('sensing') || lower.includes('ruview')) {
                                    cards.push({ title: 'RuView Demo', desc: 'WiFi sensing video', icon: '📡', action: () => handleSubmit(null, 'VIEW_VIDEO:RuView_WiFi_Sensing.mp4') });
                                  }
                                  if (lower.includes('getting started') || lower.includes('tutorial') || lower.includes('how to start')) {
                                    cards.push({ title: 'Getting Started', desc: 'Zero to production video', icon: '🚀', action: () => handleSubmit(null, 'VIEW_VIDEO:From_Zero_to_Production_Getting_Started.mp4') });
                                  }
                                  if (lower.includes('notebook') || lower.includes('deep dive') || lower.includes('explore more')) {
                                    cards.push({ title: 'NotebookLM', desc: 'Interactive AI deep-dive', icon: '📓', action: () => window.open(NOTEBOOKLM_URL, '_blank', 'noopener,noreferrer') });
                                  }
                                  if (cards.length === 0) return null;
                                  return (
                                    <div className="contextual-resources">
                                      <span className="ctx-label">Related resources</span>
                                      {cards.map((c, ci) => (
                                        <button key={ci} className="ctx-card" onClick={c.action}>
                                          <span className="ctx-icon">{c.icon}</span>
                                          <span className="ctx-text"><span className="ctx-title">{c.title}</span><span className="ctx-desc">{c.desc}</span></span>
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                                <div className="follow-up-suggestions" aria-live="polite" aria-label="Follow-up suggestions">
                                  {(extractExploreFurther(msg.content).length > 0
                                    ? extractExploreFurther(msg.content)
                                    : getFollowUpSuggestions(msg.content)
                                  ).map((suggestion, si) => (
                                    <button key={si} className="follow-up-pill" onClick={() => { setInput(suggestion); handleSubmit(null, suggestion); }}>
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="message assistant thinking" role="status" aria-live="polite" aria-label="Generating response">
                      <div className="avatar"><img src="/assets/Ruv prompt.png" alt="Ruv" className="avatar-img" /></div>
                      <div className="content">
                        <div className="thinking-message">
                          <strong>Thinking...</strong>
                          <div className="typing-indicator" aria-hidden="true"><span></span><span></span><span></span></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input at BOTTOM */}
            <form className="input-area" onSubmit={handleSubmit}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              {messages.length > 0 && (
                <button type="button" ref={resourceToggleRef} className={`icon-btn resources-toggle ${showResourceDrawer ? 'active' : ''}`} onClick={() => setShowResourceDrawer(p => !p)} aria-label="Browse resources" title="Browse resources & documents">📂</button>
              )}
              <button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()} aria-label="Attach file">📎</button>
              <button type="button" className={`icon-btn voice ${listening ? 'listening' : ''}`} onClick={startVoiceInput} aria-label={listening ? 'Stop listening' : 'Start voice input'}>{listening ? '🔴' : '🎤'}</button>
              <div className="input-wrapper">
                {file && <div className="file-preview">📄 {file.name} <button type="button" onClick={() => setFile(null)} aria-label="Remove attached file">×</button></div>}
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? "Listening..." : "Ask a question..."} disabled={loading} aria-label="Type your question" />
              </div>
              <button type="submit" disabled={loading || (!input.trim() && !file)} aria-label="Send message">SEND</button>
            </form>
          </div>
        )}

        {/* ===== CANVAS PANEL (auto-shows when content exists) ===== */}
        {(effectiveViewMode === 'split' || effectiveViewMode === 'presentation') && canvasContent?.action !== 'universe' && (
          <div className="canvas-panel" style={effectiveViewMode === 'presentation' ? { width: '100%', borderLeft: 'none' } : {}}>
            <div className="canvas-header">
              <h3>{effectiveViewMode === 'presentation' ? 'PRESENTATION MODE' : 'CANVAS'}</h3>
              {canvasContent && (
                <div className="canvas-actions">
                  {(canvasContent.type === 'pdf' || canvasContent.type === 'video') && (
                    <button onClick={() => setPresentationMode(p => !p)} className="canvas-btn" title={presentationMode ? 'Exit fullscreen' : 'Fullscreen'}>
                      {presentationMode ? '⊡ SPLIT' : '⊞ FULL'}
                    </button>
                  )}
                  <button onClick={exportCanvas} className="canvas-btn" title="Download content" aria-label="Export canvas content">EXPORT</button>
                  <button onClick={() => copyToClipboard()} className="canvas-btn" title="Copy to clipboard" aria-label="Copy canvas to clipboard">COPY</button>
                </div>
              )}
            </div>
            <div className="canvas-content">
              {canvasContent && (
                <>
                  <div className="content-controls">
                    <button
                      onClick={() => {
                        setPresentationMode(false);
                        setCanvasContent(null);
                      }}
                      className="close-content-btn"
                      title="Close View"
                    >
                      {effectiveViewMode === 'presentation' ? '🔙 Exit Presentation' : '✕ Close'}
                    </button>
                  </div>
                  {canvasContent.type === 'deck-picker' ? (
                    <div className="deck-picker">
                      <h2 style={{ marginBottom: '0.5rem' }}>CEO & CTO Decks</h2>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Business and technical perspectives on the RuVector/Agentic Intelligence architecture.
                      </p>
                      <div className="deck-cards">
                        {DECK_DOCS.map((doc) => (
                          <button key={doc.file} className="deck-card deck-card-featured" onClick={() => setCanvasContent({
                            type: 'pdf',
                            content: `/assets/docs/${doc.file}`,
                            title: doc.title,
                            action: 'document'
                          })}>
                            <span className="deck-card-icon">{doc.icon}</span>
                            <span className="deck-card-title">{doc.title}</span>
                            <span className="deck-card-desc">{doc.desc}</span>
                          </button>
                        ))}
                      </div>
                      <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Additional Resources</h3>
                      <div className="deck-cards deck-cards-compact">
                        {RESOURCE_DOCS.map((doc) => (
                          <button key={doc.file} className="deck-card" onClick={() => setCanvasContent({
                            type: doc.type === 'video' ? 'video' : doc.type === 'image' ? 'image' : 'pdf',
                            content: `/assets/docs/${doc.file}`,
                            title: doc.title,
                            action: 'document'
                          })}>
                            <span className="deck-card-icon">{doc.icon}</span>
                            <span className="deck-card-title">{doc.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : canvasContent.type === 'diagram' ? (
                    <div ref={canvasRef} className="diagram-container"></div>
                  ) : canvasContent.type === 'pdf' ? (
                    effectiveViewMode === 'presentation' ? (
                      <PDFPresentation
                        url={canvasContent.content}
                        title={canvasContent.title}
                        onClose={() => { setPresentationMode(false); setCanvasContent(null); }}
                      />
                    ) : (
                      <div className="pdf-viewer">
                        <h2>{canvasContent.title}</h2>
                        {/* Mobile: show open button since iframe PDFs fail on most mobile browsers */}
                        {window.innerWidth <= 1024 ? (
                          <div className="pdf-mobile-card">
                            <div className="pdf-mobile-icon">
                              {canvasContent.title?.toLowerCase().includes('ceo') ? '👔' :
                               canvasContent.title?.toLowerCase().includes('cto') ? '🔧' : '📄'}
                            </div>
                            <p className="pdf-mobile-hint">
                              Tap to open the full document.
                              {window.innerWidth < window.innerHeight && ' Rotate to landscape for best viewing.'}
                            </p>
                            <a href={canvasContent.content} target="_blank" rel="noopener noreferrer" className="pdf-open-btn">
                              View Document →
                            </a>
                            {window.innerWidth < window.innerHeight && (
                              <span className="pdf-landscape-hint">↻ Rotate to landscape for slides</span>
                            )}
                          </div>
                        ) : (
                          <iframe
                            src={`${canvasContent.content}#toolbar=0&navpanes=0&view=FitH`}
                            title={canvasContent.title}
                            style={{ width: '100%', flex: 1, minHeight: '60vh', border: 'none' }}
                          />
                        )}
                      </div>
                    )
                  ) : canvasContent.type === 'video' ? (
                    <div className="video-viewer">
                      <h2>{canvasContent.title}</h2>
                      <video controls style={{ width: '100%', maxHeight: '85vh', borderRadius: '8px' }} src={canvasContent.content}>
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : canvasContent.type === 'image' ? (
                    <div className="image-viewer" style={{ padding: '1rem', textAlign: 'center' }}>
                      {canvasContent.title && <h2 style={{ marginBottom: '1rem' }}>{canvasContent.title}</h2>}
                      <img src={canvasContent.content} alt={canvasContent.title || 'Generated visualization'} style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} />
                    </div>
                  ) : canvasContent.type === 'iframe' ? (
                    <iframe src={canvasContent.content} title={canvasContent.title || 'Content'} style={{ width: '100%', flex: 1, minHeight: '70vh', border: 'none', borderRadius: '8px' }} />
                  ) : (
                    <div className="canvas-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{canvasContent.content}</ReactMarkdown></div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
    </ErrorBoundary>
  );
}

export default App;
