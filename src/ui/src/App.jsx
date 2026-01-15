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

// Hero Section Component
const HeroSection = ({ onAction }) => (
  <div className="hero-section">
    <div className="hero-content">
      <img src="/assets/Ruv prompt.png" alt="RuvNet" className="hero-logo" />
      <h1>Ask rUVnet</h1>
      <p className="hero-subtitle">Your Agentic Engineering Companion</p>

      <div className="hero-grid">
        <button onClick={() => onAction('Explain Claude-Flow V3 and its 54+ specialized agents')} className="hero-card">
          <span className="icon">⚡</span>
          <span className="text">Claude-Flow V3</span>
        </button>
        <button onClick={() => onAction('Explain Agentic Flow HybridReasoningBank')} className="hero-card">
          <span className="icon">🌊</span>
          <span className="text">Agentic Flow</span>
        </button>
        <button onClick={() => onAction('Show Ruvector WASM and SIMD optimizations')} className="hero-card">
          <span className="icon">💻</span>
          <span className="text">RuVector Code</span>
        </button>
        <button onClick={() => onAction('Explain the multi-agent swarm architecture')} className="hero-card">
          <span className="icon">🏗️</span>
          <span className="text">Swarm Architecture</span>
        </button>
      </div>

      <div className="hero-resources">
        <h3>📚 Quick Start Resources</h3>
        <div className="resource-links">
          <a href="https://notebooklm.google.com/notebook/d3dc2e7a-5fb3-405d-87e5-fa98de971a1a" target="_blank" rel="noopener noreferrer" className="resource-link notebooklm-link">
            <div className="resource-thumbnail">🎧</div>
            <div className="resource-info">
              <span className="resource-title">Claude-Flow V3 NotebookLM</span>
              <span className="resource-type">Audio & Video Overviews</span>
            </div>
          </a>
          <button onClick={() => onAction('VIEW_PDF:Agentic_Engineering_Stack.pdf')} className="resource-link">
            <div className="resource-thumbnail">📊</div>
            <div className="resource-info">
              <span className="resource-title">Agentic Engineering Stack</span>
              <span className="resource-type">PDF Guide</span>
            </div>
          </button>
          <button onClick={() => onAction('VIEW_PDF:Agentic_Intelligence_Frameworks.pdf')} className="resource-link">
            <div className="resource-thumbnail">🧠</div>
            <div className="resource-info">
              <span className="resource-title">Intelligence Frameworks</span>
              <span className="resource-type">PDF Guide</span>
            </div>
          </button>
          <button onClick={() => onAction('VIEW_VIDEO:The_Agentic_Stack.mp4')} className="resource-link">
            <div className="resource-thumbnail">▶️</div>
            <div className="resource-info">
              <span className="resource-title">The Agentic Stack</span>
              <span className="resource-type">Video Tutorial</span>
            </div>
          </button>
        </div>
        <div className="resource-links" style={{ marginTop: '0.5rem' }}>
          <a href="https://github.com/ruvnet/claude-flow/tree/v3" target="_blank" rel="noopener noreferrer" className="resource-link github-link">
            <div className="resource-thumbnail">📦</div>
            <div className="resource-info">
              <span className="resource-title">Claude-Flow V3 GitHub</span>
              <span className="resource-type">Source Code & Docs</span>
            </div>
          </a>
          <button onClick={() => onAction('VIEW_PDF:Claude-Flow_v3_Swarm_Platform.pdf')} className="resource-link swarm-link">
            <div className="resource-thumbnail">🐝</div>
            <div className="resource-info">
              <span className="resource-title">Swarm Platform Overview</span>
              <span className="resource-type">NotebookLM Export</span>
            </div>
          </button>
          <button onClick={() => onAction('VIEW_PDF:The_Agentic_Toolkit_Redefining_Creation.pdf')} className="resource-link">
            <div className="resource-thumbnail">🛠️</div>
            <div className="resource-info">
              <span className="resource-title">Agentic Toolkit Guide</span>
              <span className="resource-type">PDF Guide</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState('Balanced');
  const [canvasContent, setCanvasContent] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [file, setFile] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

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
    // Mock special action for now or implement endpoint
    setTimeout(() => {
      const result = `Here is the ${action} for: ${content}`;
      setCanvasContent({ type: 'text', content: result });
      setLoading(false);
    }, 1000);
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

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
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
                  }}
                >
                  📚 Knowledge Base
                </button>
              </div>
            </SidebarSection>

            <SidebarSection title="Learning Level" defaultOpen={true}>
              <div className="level-selector">
                {['Simple', 'Beginner', 'Balanced', 'Technical'].map((l) => (
                  <button key={l} className={`level-btn ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)}>
                    <span className={`dot ${l.toLowerCase()}`}></span> {l}
                  </button>
                ))}
              </div>
            </SidebarSection>

            <SidebarSection title="View Mode" defaultOpen={true}>
              <div className="view-mode-selector">
                <button className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`} onClick={() => setViewMode('split')}>📊 Split View</button>
                <button className={`mode-btn ${viewMode === 'chat' ? 'active' : ''}`} onClick={() => setViewMode('chat')}>💬 Chat Only</button>
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
                  <HeroSection onAction={(prompt) => handleSubmit(null, prompt)} />
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`message ${msg.role}`} ref={idx === messages.length - 1 ? lastMessageRef : null}>
                        <div className="avatar">
                          {msg.role === 'assistant' ? <img src="/assets/Ruv prompt.png" alt="Ruv" className="avatar-img" /> : '👤'}
                        </div>
                        <div className="content">
                          <ReactMarkdown className="markdown-content" remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          {msg.role === 'assistant' && !msg.canvasGenerated && (
                            <div className="message-actions">
                              <button className="action-btn" onClick={() => handleSpecialAction('simplify', msg.content)}>🔄 Simplify</button>
                              <button className="action-btn" onClick={() => handleSpecialAction('code', msg.content)}>💻 Code</button>
                              <button className="action-btn" onClick={() => handleSpecialAction('diagram', msg.content)}>📊 Diagram</button>
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

          {(viewMode === 'split' || viewMode === 'presentation') && (
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
                  <div className="canvas-placeholder">
                    <div style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '1rem' }}>▤</div>
                    <p>Select content to view details</p>
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
                    ) : (
                      <ReactMarkdown className="canvas-markdown" remarkPlugins={[remarkGfm]}>{canvasContent.content}</ReactMarkdown>
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
