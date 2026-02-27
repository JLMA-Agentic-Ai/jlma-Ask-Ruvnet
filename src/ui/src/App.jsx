import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import packageJson from '../../../package.json';
import PDFPresentation from './PDFPresentation';
import './App.css';

// Initialize Mermaid
mermaid.initialize({ startOnLoad: true, theme: 'dark' });

// Collapsible Sidebar Section Component
const SidebarSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>{title}</h3>
        <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      {isOpen && <div className="sidebar-section-content">{children}</div>}
    </div>
  );
};

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

// Hero Section Component
const HeroSection = ({ onAction, knowledgeData, latestRepos, ecosystemStats }) => {
  const getVer = (name) => knowledgeData?.repos?.find(r => r.name === name)?.version;
  const cfVer  = getVer('claude-flow')   || '3.1.0-alpha.44';
  const totalEntries = (knowledgeData?.kb_total_entries || knowledgeData?.kb_stats?.total || 54543).toLocaleString();
  return (
  <div className="hero-section">
    <div className="hero-content">
      {/* Value Proposition Banner */}
      <div className="value-prop-banner">
        <img src="/assets/Ruv prompt.png" alt="RuvNet" className="hero-logo" />
        <h1>Ask rUVnet</h1>
        <p className="value-prop-headline">The most complete agentic AI development stack</p>
        <div className="value-prop-stats">
          <span className="value-prop-stat"><span className="stat-number">{ecosystemStats?.totalRepos || 145}+</span> Repos</span>
          <span className="value-prop-divider">|</span>
          <span className="value-prop-stat"><span className="stat-number">{totalEntries}+</span> KB Entries</span>
          <span className="value-prop-divider">|</span>
          <span className="value-prop-stat">Updated Daily</span>
        </div>
      </div>

      <div className="hero-kb-features">
        <span className="kb-feature-badge">🎬 Video Transcripts Indexed</span>
        <span className="kb-feature-badge kb-feature-recency">⚡ Recency-Weighted · Recent = More Credible</span>
        <span className="kb-feature-badge">🚀 Agentic AI updates fast — newest sources ranked highest</span>
      </div>

      <div className="hero-grid">
        <button onClick={() => onAction('What is Claude-Flow V3 and what are its 60+ specialized agents?')} className="hero-card">
          <span className="icon">⚡</span>
          <span className="text">Claude-Flow V3</span>
        </button>
        <button onClick={() => onAction('How does the ReasoningBank self-learning system work in Agentic Flow?')} className="hero-card">
          <span className="icon">🧠</span>
          <span className="text">ReasoningBank AI</span>
        </button>
        <button onClick={() => onAction('What is RuVector and how does it compare to pgvector for AI applications?')} className="hero-card">
          <span className="icon">🔮</span>
          <span className="text">RuVector DB</span>
        </button>
        <button onClick={() => onAction('VIEW_UNIVERSE')} className="hero-card">
          <span className="icon">🌌</span>
          <span className="text">Knowledge Universe</span>
        </button>
      </div>

      {/* Latest from rUv */}
      {latestRepos && latestRepos.length > 0 && (
        <div className="latest-repos">
          <div className="latest-repos-header">
            <h3>Latest from rUv</h3>
          </div>
          <div className="latest-repos-scroll">
            {latestRepos.slice(0, 5).map((repo) => (
              <a
                key={repo.name}
                href={`https://github.com/ruvnet/${repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-card"
              >
                <div className="repo-card-header">{repo.name}</div>
                <div className="repo-card-desc">
                  {repo.description || 'No description'}
                </div>
                <div className="repo-card-meta">
                  <span className="repo-card-entries">{(repo.entryCount || 0).toLocaleString()} entries</span>
                  {repo.lastUpdated && <span className="repo-card-time">{timeAgo(repo.lastUpdated)}</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Why rUv's Approach is Different */}
      <div className="differentiators">
        <div className="diff-card">
          <span className="diff-icon">🧠</span>
          <div className="diff-title">Self-Learning Systems</div>
          <div className="diff-desc">Every tool improves with use. SONA, EWC++, GNN-enhanced HNSW.</div>
        </div>
        <div className="diff-card">
          <span className="diff-icon">🏗️</span>
          <div className="diff-title">Full Stack, One Vision</div>
          <div className="diff-desc">Vector DB to agent orchestration to autonomous businesses.</div>
        </div>
        <div className="diff-card">
          <span className="diff-icon">⚙️</span>
          <div className="diff-title">Rust + WASM Everywhere</div>
          <div className="diff-desc">Browser, edge, server from one codebase. &lt;400KB.</div>
        </div>
        <div className="diff-card">
          <span className="diff-icon">🔓</span>
          <div className="diff-title">Open Source Innovation</div>
          <div className="diff-desc">Original Rust implementations, not API wrappers.</div>
        </div>
      </div>

      <div className="hero-resources">
        <h3>📚 Quick Start Resources</h3>
        <div className="resource-links">
          <a href="https://www.linkedin.com/in/reuvencohen/" target="_blank" rel="noopener noreferrer" className="resource-link linkedin-link">
            <div className="resource-thumbnail">💼</div>
            <div className="resource-info">
              <span className="resource-title">Reuven Cohen · rUv</span>
              <span className="resource-type">LinkedIn · Creator of RuvNet</span>
            </div>
          </a>
          <a href="https://notebooklm.google.com/notebook/d3dc2e7a-5fb3-405d-87e5-fa98de971a1a" target="_blank" rel="noopener noreferrer" className="resource-link notebooklm-link">
            <div className="resource-thumbnail">🎧</div>
            <div className="resource-info">
              <span className="resource-title">Claude-Flow V3 NotebookLM</span>
              <span className="resource-type">Audio & Video Overviews</span>
            </div>
          </a>
          <a href="https://github.com/ruvnet/claude-flow" target="_blank" rel="noopener noreferrer" className="resource-link github-link">
            <div className="resource-thumbnail">📦</div>
            <div className="resource-info">
              <span className="resource-title">Claude-Flow V3 GitHub</span>
              <span className="resource-type">v{cfVer} · Source & Docs</span>
            </div>
          </a>
          <button onClick={() => onAction('VIEW_VIDEOS')} className="resource-link">
            <div className="resource-thumbnail">📹</div>
            <div className="resource-info">
              <span className="resource-title">Video Library</span>
              <span className="resource-type">20 Sessions · Agentics Foundation · Watchable</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState('Balanced');
  const [canvasContent, setCanvasContent] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [file, setFile] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [knowledgeData, setKnowledgeData] = useState(null);
  const [latestRepos, setLatestRepos] = useState([]);
  const [ecosystemStats, setEcosystemStats] = useState(null);

  // Fetch live knowledge data (versions, stats) on mount
  useEffect(() => {
    fetch('/api/knowledge')
      .then(r => r.json())
      .then(data => setKnowledgeData(data))
      .catch(() => {});
  }, []);

  // Fetch latest repos and ecosystem stats on mount
  useEffect(() => {
    fetch('/api/latest-repos').then(r => r.json()).then(data => setLatestRepos(data)).catch(() => {});
    fetch('/api/ecosystem-stats').then(r => r.json()).then(data => setEcosystemStats(data)).catch(() => {});
  }, []);

  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const isMobile = () => window.innerWidth < 768;

  // Auto-close sidebar when resizing to mobile, auto-open when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when a sidebar action is taken
  const closeSidebarOnMobile = () => {
    if (isMobile()) setSidebarOpen(false);
  };

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

  // Render Mermaid
  useEffect(() => {
    if (canvasContent?.type === 'diagram' && canvasRef.current) {
      try {
        const graphDefinition = canvasContent.content;
        mermaid.render('mermaid-diagram', graphDefinition).then(({ svg }) => {
          if (canvasRef.current) {
            canvasRef.current.innerHTML = svg;
          }
        });
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    }
  }, [canvasContent]);

  const handleSubmit = async (e, specialMode = null) => {
    e?.preventDefault();
    if (!input.trim() && !specialMode) return;

    const queryText = specialMode || input;

    // Handle Video Library — sourced from RuVector KB (50 entries with real watch URLs)
    if (queryText === 'VIEW_VIDEOS') {
      const videos = [
        { id: '1_s07kapkb', date: '2026-01-16', dur: '1h 51m', title: 'Building Agentic Systems at Scale: Architecture, Security, and Real-World Implementation' },
        { id: '1_xlre6ukc', date: '2026-01-16', dur: '1h 49m', title: 'Claude-flow v3 Release: Revolutionary Agentic AI System with 500K+ Downloads' },
        { id: '1_33xvl0xn', date: '2026-01-29', dur: '1h 5m',  title: 'Agentix Foundation: Building a Global Community for Agentic AI Development' },
        { id: '1_rozlzilu', date: '2026-01-28', dur: '1h 14m', title: 'London Meetup — AI Powered Content Creation: From Sheet Music to Semantic Graphs' },
        { id: '1_8afwqubg', date: '2026-01-23', dur: '2h 1m',  title: 'Building Agentic Systems: Network Topologies, Skills Aggregation, and AI Infrastructure' },
        { id: '1_nvkgdvm8', date: '2026-01-?',  dur: '—',      title: 'Claude-Flow V3: Building AI Systems with Hive-Mind Intelligence' },
        { id: '1_392oe5oa', date: '2026-01-?',  dur: '—',      title: 'Claude Flow V3: Building Intelligent Agents with Self-Learning Vector Systems' },
        { id: '1_oowknql6', date: '2026-01-?',  dur: '—',      title: 'CloudFlow V3 and Agentic Systems: Building the Future of AI Development' },
        { id: '1_04q83xk2', date: '2025-11-14', dur: '1h 32m', title: 'AI Hackerspace Live — Nov 7' },
        { id: '1_x6y3m453', date: '2025-12-06', dur: '5h',     title: 'Building the Future: AI-Powered Media Discovery and Smart TV Integration at the Global AI Hackathon' },
        { id: '1_dpwbbr66', date: '2025-?',     dur: '—',      title: 'Agentic AI Revolution: Building Autonomous Intelligent Systems for Real-World Impact' },
        { id: '1_dxehuvpf', date: '2025-?',     dur: '—',      title: 'Building the Prime Radiant: A Coherence Engine for AI Anti-Hallucination' },
        { id: '1_hpe5jw3w', date: '2025-?',     dur: '—',      title: 'From Concept to Code: How Claude AI and Agentic Systems Are Reshaping Development' },
        { id: '1_rtjw6iv4', date: '2025-?',     dur: '—',      title: 'Building Agentic AI Solutions: Claude Flow, Anti-Gravity, and Real-World Applications' },
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
      setViewMode('split');
      return;
    }

    // Handle Knowledge Universe — fullscreen overlay handles display
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
      setViewMode('presentation'); // Switch to presentation mode
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
      setViewMode('presentation'); // Switch to presentation mode
      return;
    }

    const userMsg = { role: 'user', content: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
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

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const botMsg = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources
      };
      setMessages(prev => [...prev, botMsg]);

      // Scroll to show the USER'S question (so they see the start of the conversation)
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-container');
        const userMessages = document.querySelectorAll('.message.user');
        const lastUserMessage = userMessages[userMessages.length - 1];

        if (chatContainer && lastUserMessage) {
          // Scroll to the user's question
          const containerTop = chatContainer.getBoundingClientRect().top;
          const messageTop = lastUserMessage.getBoundingClientRect().top;
          const scrollOffset = messageTop - containerTop + chatContainer.scrollTop - 20;

          chatContainer.scrollTo({
            top: scrollOffset,
            behavior: 'smooth'
          });
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialAction = async (action, content) => {
    setLoading(true);
    try {
      const response = await fetch('/api/special', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      if (action === 'visualize') {
        const imageUrl = data.imageUrl || data.result;
        setCanvasContent({ type: 'image', content: imageUrl, title: 'Generated Visualization', action });
      } else {
        const type = action === 'diagram' ? 'diagram' : 'text';
        setCanvasContent({ type, content: data.result, action });
      }
    } catch (err) {
      console.error('Special action error:', err);
      setCanvasContent({
        type: 'text',
        content: `**${action.charAt(0).toUpperCase() + action.slice(1)} unavailable:** ${err.message}\n\nThis feature requires an OpenAI API key configured on the server.`,
        action: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/knowledge');
      const data = await response.json();

      const timestamp = new Date().toLocaleString();
      const videoCount = data.videoStats?.total || 0;

      // Find Claude-Flow v3 entry for featured display
      const claudeFlow = data.repos.find(r => r.name === 'claude-flow');
      const claudeFlowVersion = claudeFlow?.version || '3.0.0-alpha';
      const claudeFlowFeatures = claudeFlow?.features || ['60+ Specialized Agents', 'ReasoningBank Self-Learning', 'HNSW 150x-12500x Faster Search', '31 Lifecycle Hooks', '12 Background Workers'];

      const report = `
# Knowledge Base Status

**System Status:** 🟢 Online
**Last Updated:** ${timestamp}
**Indexed Videos:** ${videoCount}
**Tracked Repositories:** ${data.repos.length}

---

## 🚀 Featured: Claude-Flow V3

**Version:** ${claudeFlowVersion}
**Status:** ${claudeFlow?.status || 'ACTIVE'}
**Branch:** [main](https://github.com/ruvnet/claude-flow)

### Key Features
${claudeFlowFeatures.map(f => `- ✅ ${f}`).join('\n')}

### Quick Install
\`\`\`bash
npx @claude-flow/cli@latest init --force
\`\`\`

### Resources
- 🎧 [NotebookLM Audio/Video Overview](https://notebooklm.google.com/notebook/d3dc2e7a-5fb3-405d-87e5-fa98de971a1a)
- 📚 [GitHub Documentation](https://github.com/ruvnet/claude-flow)

---

## 🗄️ PostgreSQL Knowledge Base

${data.kb_stats ? `| Domain | Entries | Status |
|--------|---------|--------|
| 🤖 Claude-Flow & Agentic AI | ${data.kb_stats.domains?.ask_ruvnet?.total?.toLocaleString() || '54,128'} | ✅ Active |
| 🔥 Viral Social | ${data.kb_stats.domains?.viral_social?.total?.toLocaleString() || '2,831'} | ✅ Active |
| **Total** | **${(data.kb_total_entries || 60918).toLocaleString()}** | **PostgreSQL RuVector** |
` : ''}
Backend: ${data.kb_backend || 'Local RuvectorStore'}

---

## Tracked Repositories

${data.repos.length > 0 ? data.repos.map(r => {
  const statusIcon = r.status === 'PRODUCTION' ? '🚀' : r.status?.includes('V3') ? '🚀' : r.status === 'ACTIVE' ? '🟢' : r.status === 'LINKED' ? '🔗' : '📦';
  return `- ${statusIcon} **${r.name}** v${r.version || 'latest'} — ${r.description || 'Linked'}`;
}).join('\n') : '_No repositories configured._'}

---

## Indexed Content

The knowledge base includes:
- ⚡ Claude-Flow V3 multi-agent orchestration (60+ agents)
- 🌊 Agentic Flow HybridReasoningBank framework
- 💾 RuVector WASM-optimized vector database
- 🧠 SONA neural architecture & self-learning
- 📹 Video transcripts and coaching sessions

---

## Available Resources

${data.docs && data.docs.length > 0 ? data.docs.map(d => `- [${d.name}](${d.url}) (${d.type})`).join('\n') : '_No additional resources available._'}

${data.websites.length > 0 ? '\n## Documentation\n' + data.websites.map(w => `- ${w.name}`).join('\n') : ''}

---
*Powered by Claude-Flow V3 + Agentic Flow HybridReasoningBank*
*Auto-refreshes on new version releases*
`;

      setCanvasContent({
        type: 'text',
        content: report,
        action: 'knowledge'
      });
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

  const copyToClipboard = () => {
    if (canvasContent) navigator.clipboard.writeText(canvasContent.content);
  };

  // Universe overlay: sits BELOW the header and RIGHT of the sidebar
  // Header is ~72px tall, sidebar is 220px wide when open
  const UniverseOverlay = canvasContent?.action === 'universe' ? (
    <div style={{
      position: 'fixed',
      top: '72px',
      left: (sidebarOpen && !isMobile()) ? '220px' : '0',
      right: 0,
      bottom: 0,
      zIndex: 50,
      background: '#0a0a1a',
    }}>
      <iframe
        src="/knowledge-universe.html"
        title="Knowledge Universe"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
      <button
        onClick={() => setCanvasContent(null)}
        style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10,
          padding: '0.4rem 1rem',
          background: 'rgba(10,20,40,0.9)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(100,150,255,0.3)', borderRadius: '8px',
          color: '#e2e8f0', cursor: 'pointer', fontSize: '0.85rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        ✕ Close
      </button>
    </div>
  ) : null;

  return (
    <div className="app-container">
      {UniverseOverlay}
      <header className="header">
        <div className="header-left">
          <button
            className="mobile-menu-btn menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
            style={{ display: 'none' }}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          {!sidebarOpen && (
            <button className="menu-btn" onClick={() => setSidebarOpen(true)} title="Expand Sidebar">»</button>
          )}
          <div className="logo">
            <img src="/assets/ruv.png" alt="RuvNet" className="logo-img" />
            <span className="logo-text">
              Ask rUVnet <span className="version-tag">v{packageJson.version}</span>
            </span>
          </div>
        </div>
        <div className="header-right">
          <button
            className="new-chat-btn"
            onClick={() => {
              setMessages([]);
              setCanvasContent(null);
              setInput('');
              setViewMode('split'); // Reset view mode on new chat
            }}
            title="Start a new conversation"
          >
            ✨ New Chat
          </button>
          <div className="status"><span className="status-dot"></span> Online</div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </header>

      <div className="main-wrapper">
        <div
          className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header-row" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>MENU</h3>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }} title="Collapse Sidebar">«</button>
          </div>

          <div className="sidebar-content">
            <SidebarSection title="System Brain" defaultOpen={true}>
              <div className="sidebar-options">
                <button
                  className={`sidebar-btn action ${canvasContent?.action === 'knowledge' ? 'active' : ''}`}
                  onClick={() => {
                    if (canvasContent?.action === 'knowledge') {
                      setCanvasContent(null);
                    } else {
                      fetchKnowledge();
                    }
                    closeSidebarOnMobile();
                  }}
                >
                  📚 Knowledge Base
                </button>
                <button
                  className={`sidebar-btn action ${canvasContent?.action === 'universe' ? 'active' : ''}`}
                  onClick={() => {
                    if (canvasContent?.action === 'universe') {
                      setCanvasContent(null);
                    } else {
                      setCanvasContent({
                        type: 'iframe',
                        content: '/knowledge-universe.html',
                        title: 'Knowledge Universe',
                        action: 'universe'
                      });
                    }
                    closeSidebarOnMobile();
                  }}
                >
                  🌌 Knowledge Universe
                </button>
                <button
                  className={`sidebar-btn action ${canvasContent?.action === 'changelog' ? 'active' : ''}`}
                  onClick={() => {
                    setCanvasContent({
                      type: 'text',
                      content: `# What's New\n\n## v2.2.0 — ${new Date().toLocaleDateString()}\n\n### Enhanced Homepage\n- Value proposition banner with live ecosystem stats\n- "Latest from rUv" section showing recently updated repos\n- "Why rUv's Approach is Different" competitive positioning cards\n- Ecosystem overview in canvas panel default view\n\n### Dynamic Repo Tracking\n- Replaced hardcoded 3-repo sweep with dynamic GitHub API\n- All 145+ repos now auto-detected and tracked\n- Sweep state stored in PostgreSQL (not flat files)\n\n### New API Endpoints\n- \`/api/latest-repos\` — 20 most recently updated repos from KB\n- \`/api/ecosystem-stats\` — Aggregate ecosystem statistics\n\n### Mobile Improvements\n- Sidebar auto-collapses on small screens\n- Hamburger menu toggle for mobile\n`,
                      title: "What's New",
                      action: 'changelog'
                    });
                    closeSidebarOnMobile();
                  }}
                >
                  🆕 What's New
                </button>
              </div>
            </SidebarSection>

            <SidebarSection title="Learning Level" defaultOpen={true}>
              <div className="level-selector">
                {['Simple', 'Beginner', 'Balanced', 'Technical'].map((l) => (
                  <button key={l} className={`level-btn ${level === l ? 'active' : ''}`} onClick={() => { setLevel(l); closeSidebarOnMobile(); }}>
                    <span className={`dot ${l.toLowerCase()}`}></span> {l}
                  </button>
                ))}
              </div>
            </SidebarSection>

            <SidebarSection title="View Mode" defaultOpen={true}>
              <div className="view-mode-selector">
                <button className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`} onClick={() => { setViewMode('split'); closeSidebarOnMobile(); }}>📊 Split View</button>
                <button className={`mode-btn ${viewMode === 'chat' ? 'active' : ''}`} onClick={() => { setViewMode('chat'); closeSidebarOnMobile(); }}>💬 Chat Only</button>
              </div>
            </SidebarSection>
          </div>

          <div className="sidebar-footer">
            <div className="user-profile">
              <img src="/assets/ruv-avatar.png" alt="User" className="user-avatar" />
              <div className="user-info">
                <span className="user-name">Guest User</span>
                <span className="user-role">Agentic Engineer</span>
              </div>
            </div>
            <div className="powered-by">
              <span>Powered by</span>
              <strong>Agentic Flow</strong>
            </div>
          </div>
        </div>

        <div className={`main-layout ${viewMode}`}>
          {viewMode !== 'presentation' && (
            <div className="chat-panel">
              {/* Input area moved to TOP for better visibility */}
              <form className="input-area input-top" onSubmit={handleSubmit}>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()}>📎</button>
                <button type="button" className={`icon-btn voice ${listening ? 'listening' : ''}`} onClick={startVoiceInput}>{listening ? '🔴' : '🎤'}</button>
                <div className="input-wrapper">
                  {file && <div className="file-preview">📄 {file.name} <button type="button" onClick={() => setFile(null)}>×</button></div>}
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? "Listening..." : "Ask a question..."} disabled={loading} />
                </div>
                <button type="submit" disabled={loading || (!input.trim() && !file)}>SEND</button>
              </form>

              <div className="chat-container">
                {messages.length === 0 ? (
                  <HeroSection onAction={(prompt) => handleSubmit(null, prompt)} knowledgeData={knowledgeData} latestRepos={latestRepos} ecosystemStats={ecosystemStats} />
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`message ${msg.role}`} ref={idx === messages.length - 1 ? lastMessageRef : null}>
                        <div className="avatar">
                          {msg.role === 'assistant' ? <img src="/assets/Ruv prompt.png" alt="Ruv" className="avatar-img" /> : '👤'}
                        </div>
                        <div className="content">
                          <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                          {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                            <div className="sources">
                              <div className="sources-title">Sources ({msg.sources.length})</div>
                              <div className="sources-list">
                                {msg.sources.slice(0, 6).map((src, si) => {
                                  const githubUrl = src.file_path
                                    ? (src.file_path.startsWith('github://')
                                        ? src.file_path.replace('github://', 'https://github.com/').replace(/^([^/]+)\/([^/]+)\/(.+)$/, '$1/$2/blob/main/$3')
                                        : src.file_path.startsWith('http') ? src.file_path
                                        : src.file_path.startsWith('/tmp/ruvnet-repos/')
                                          ? (() => { const parts = src.file_path.replace('/tmp/ruvnet-repos/', '').split('/'); return parts.length >= 2 ? `https://github.com/ruvnet/${parts[0]}/blob/main/${parts.slice(1).join('/')}` : null; })()
                                          : null)
                                    : null;
                                  const displayTitle = src.title || src.package_name || src.id || `Source ${si + 1}`;
                                  const score = src.score ? Math.round(src.score * 100) : null;
                                  return (
                                    <div key={si} className="source-tag">
                                      {src.doc_type && <span className="source-badge">{src.doc_type}</span>}
                                      {githubUrl ? (
                                        <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="source-link">{displayTitle}</a>
                                      ) : (
                                        <span className="source-name">{displayTitle}</span>
                                      )}
                                      {score && <span className="source-score">{score}%</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {msg.role === 'assistant' && !msg.canvasGenerated && (
                            <div className="message-actions">
                              <button className="action-btn" onClick={() => handleSpecialAction('simplify', msg.content)}>🔄 Simplify</button>
                              <button className="action-btn" onClick={() => handleSpecialAction('code', msg.content)}>💻 Code</button>
                              <button className="action-btn" onClick={() => handleSpecialAction('diagram', msg.content)}>📊 Diagram</button>
                              <button className="action-btn" onClick={() => handleSpecialAction('visualize', msg.content)}>🎨 Visualize</button>
                              <button className="action-btn" onClick={() => setCanvasContent({ type: 'text', content: msg.content })}>➡️ Canvas</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="message assistant thinking">
                        <div className="avatar"><img src="/assets/Ruv prompt.png" alt="Ruv" className="avatar-img" /></div>
                        <div className="content">
                          <div className="thinking-message">
                            <strong>🤔 Thinking...</strong>
                            <div className="typing-indicator"><span></span><span></span><span></span></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>
          )}

          {(viewMode === 'split' || viewMode === 'presentation') && canvasContent?.action !== 'universe' && (
            <div className="canvas-panel" style={viewMode === 'presentation' ? { width: '100%', borderLeft: 'none' } : {}}>
              <div className="canvas-header">
                <h3>{viewMode === 'presentation' ? 'PRESENTATION MODE' : 'CANVAS'}</h3>
                {canvasContent && (
                  <div className="canvas-actions">
                    <button onClick={exportCanvas} className="canvas-btn" title="Download content">EXPORT</button>
                    <button onClick={copyToClipboard} className="canvas-btn" title="Copy to clipboard">COPY</button>
                  </div>
                )}
              </div>
              <div className="canvas-content">
                {!canvasContent ? (
                  <div className="ecosystem-overview">
                    <h2>Ecosystem Overview</h2>
                    <div className="eco-stats-grid">
                      <div className="eco-stat"><span className="eco-number">{ecosystemStats?.totalRepos || 145}</span><span className="eco-label">Repositories</span></div>
                      <div className="eco-stat"><span className="eco-number">{ecosystemStats?.totalEntries?.toLocaleString() || '148K+'}</span><span className="eco-label">KB Entries</span></div>
                      <div className="eco-stat"><span className="eco-number">{ecosystemStats?.docTypes || 6}</span><span className="eco-label">Content Types</span></div>
                    </div>
                    <h3>Stack Architecture</h3>
                    <div className="stack-layers">
                      <div className="stack-layer"><span className="layer-num">5</span><span className="layer-name">Applications</span><span className="layer-desc">Ask-RuvNet, DAA, Flow Nexus</span></div>
                      <div className="stack-layer"><span className="layer-num">4</span><span className="layer-name">Orchestration</span><span className="layer-desc">Claude Flow, Ruv-Swarm, Hive Mind</span></div>
                      <div className="stack-layer"><span className="layer-num">3</span><span className="layer-name">Intelligence</span><span className="layer-desc">Agentic Flow, SONA, ReasoningBank</span></div>
                      <div className="stack-layer"><span className="layer-num">2</span><span className="layer-name">Data & Search</span><span className="layer-desc">RuVector, HNSW, pgvector</span></div>
                      <div className="stack-layer"><span className="layer-num">1</span><span className="layer-name">Foundation</span><span className="layer-desc">Rust Core, WASM Runtime, RVF Format</span></div>
                    </div>
                    <p className="eco-footer">Ask a question to explore any layer in depth</p>
                  </div>
                ) : (
                  <>
                    <div className="content-controls">
                      <button
                        onClick={() => {
                          if (viewMode === 'presentation') {
                            setViewMode('split');
                          } else {
                            setCanvasContent(null);
                          }
                        }}
                        className="close-content-btn"
                        title="Close View"
                      >
                        {viewMode === 'presentation' ? '🔙 Exit Presentation' : '✕ Close View'}
                      </button>
                    </div>
                    {canvasContent.type === 'diagram' ? (
                      <div ref={canvasRef} className="diagram-container"></div>
                    ) : canvasContent.type === 'pdf' ? (
                      viewMode === 'presentation' ? (
                        <PDFPresentation
                          url={canvasContent.content}
                          title={canvasContent.title}
                          onClose={() => setViewMode('split')}
                        />
                      ) : (
                        <div className="pdf-viewer">
                          <h2>{canvasContent.title}</h2>
                          <iframe
                            src={`${canvasContent.content}#toolbar=0&navpanes=0&view=Fit`}
                            title={canvasContent.title}
                            style={{ width: '100%', height: 'calc(100vh - 150px)', border: 'none' }}
                          />
                        </div>
                      )
                    ) : canvasContent.type === 'video' ? (
                      <div className="video-viewer">
                        <h2>{canvasContent.title}</h2>
                        <video
                          controls
                          style={{ width: '100%', maxHeight: '85vh', borderRadius: '8px' }}
                          src={canvasContent.content}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : canvasContent.type === 'image' ? (
                      <div className="image-viewer" style={{ padding: '1rem', textAlign: 'center' }}>
                        {canvasContent.title && <h2 style={{ marginBottom: '1rem' }}>{canvasContent.title}</h2>}
                        <img
                          src={canvasContent.content}
                          alt={canvasContent.title || 'Generated visualization'}
                          style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                        />
                      </div>
                    ) : canvasContent.type === 'iframe' ? (
                      <iframe
                        src={canvasContent.content}
                        title={canvasContent.title || 'Content'}
                        style={{ width: '100%', height: 'calc(100vh - 80px)', border: 'none', borderRadius: '8px' }}
                      />
                    ) : (
                      <div className="canvas-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{canvasContent.content}</ReactMarkdown></div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
