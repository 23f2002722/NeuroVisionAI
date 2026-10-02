// ============================================================
// AI Assistant (RAG) — Evidence-Grounded Research Chat
// Neuro-AI Platform  •  src/pages/AIAssistant.tsx
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, BookOpen, User, Bot, Sparkles } from 'lucide-react';
import { apiChat } from '../services/api';
import type { ChatMessage } from '../types';

// ── Static knowledge-source metadata ────────────────────────

const KNOWLEDGE_SOURCES = [
  {
    title: 'BraTS2020 Challenge Papers',
    authors: 'Bakas et al. / Menze et al.',
    year: '2015–2020',
    color: '#7A5D38',
    dim: 'rgba(122,93,56,0.12)',
  },
  {
    title: 'Ho et al. 2020 (DDPM)',
    authors: 'Ho, Jain, Abbeel',
    year: '2020',
    color: 'var(--tc-color)',
    dim: 'rgba(45,138,107,0.1)',
  },
  {
    title: 'Yang et al. 2023 (UniMatch)',
    authors: 'Yang et al.',
    year: '2023',
    color: 'var(--emerald)',
    dim: 'var(--emerald-dim)',
  },
  {
    title: 'iPixMatch Capstone Results',
    authors: 'Capstone Team — 2024',
    year: '2024',
    color: 'var(--amber)',
    dim: 'var(--amber-dim)',
  },
  {
    title: 'BraTS2020 Evaluation Metrics',
    authors: 'Dice / HD95 / Sensitivity',
    year: 'Reference',
    color: 'var(--coral)',
    dim: 'var(--coral-dim)',
  },
];

// ── Prompt suggestion chips ──────────────────────────────────

const PROMPT_CHIPS = [
  'Explain WT, TC, and ET clinical regions',
  'Compare iPixMatch vs UniMatch on BraTS2020',
  'Did DDPM reconstruction improve Dice score in Experiment B?',
  'What is the BraTS2020 dataset?',
  'Explain the DDPM noise schedule',
  'How does semi-supervised learning work for segmentation?',
];

// ── Welcome message (initial assistant message) ──────────────

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hello! I'm your **Evidence-Grounded AI Research Assistant** — powered by Retrieval-Augmented Generation over the BraTS2020 literature corpus and your capstone experimental results.\n\nI can help you:\n- **Explain** tumor sub-region biology (WT, TC, ET) and MRI modalities\n- **Compare** model performance across Experiments A & B (iPixMatch vs UniMatch)\n- **Interpret** reconstruction quality metrics (SSIM, PSNR, MSE)\n- **Summarize** key papers: DDPM, UniMatch, BraTS2020 benchmarks\n- **Answer** questions grounded in your pipeline's verified results\n\nTry one of the suggestion chips below, or type your own question!",
  sources: ['BraTS2020 Challenge Papers', 'iPixMatch Capstone Results'],
  timestamp: new Date().toISOString(),
};

// ── Typing indicator dots ────────────────────────────────────

function TypingDots() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 0',
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--tc-color)',
            opacity: 0.8,
            animation: `typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

// ── Markdown-lite renderer (bold + newlines) ─────────────────

function renderContent(text: string) {
  // Split on **bold** markers and line breaks
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(<strong key={idx}>{part.slice(2, -2)}</strong>);
    } else {
      // Handle newlines within plain text segments
      const lines = part.split('\n');
      lines.forEach((line, li) => {
        if (li > 0) nodes.push(<br key={`${idx}-br-${li}`} />);
        // Handle list items
        if (line.trimStart().startsWith('- ')) {
          nodes.push(
            <span
              key={`${idx}-li-${li}`}
              style={{ display: 'block', paddingLeft: 14, position: 'relative' }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 2,
                  color: 'var(--tc-color)',
                  fontWeight: 700,
                }}
              >
                ·
              </span>
              {line.trimStart().slice(2)}
            </span>
          );
        } else {
          nodes.push(line);
        }
      });
    }
  });

  return nodes;
}

// ── Main Component ───────────────────────────────────────────

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [inputText]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const { reply, sources } = await apiChat(updatedMessages);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: reply,
        sources,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content:
          'Sorry, I encountered an error reaching the RAG backend. Please try again or check the API connection.',
        sources: [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChipClick(prompt: string) {
    setInputText(prompt);
    textareaRef.current?.focus();
  }

  return (
    <>
      {/* ── Keyframe injected into <head> via style tag ── */}
      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes msg-appear {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-bubble { animation: msg-appear 0.28s ease-out; }

        /* TC-color-focused textarea */
        .textarea-ai:focus {
          border-color: var(--tc-color) !important;
          box-shadow: 0 0 0 3px rgba(45,138,107,0.14) !important;
        }

        /* Knowledge source card hover */
        .ks-card:hover {
          background: rgba(45,138,107,0.08) !important;
          border-color: rgba(45,138,107,0.3) !important;
        }

        /* Chip hover override for tc-color theme */
        .chip-ai:hover {
          background: rgba(45,138,107,0.12) !important;
          border-color: rgba(45,138,107,0.45) !important;
          color: var(--tc-color) !important;
        }
      `}</style>

      <div
        className="main-content page-enter"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '40px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >

        {/* ── Page Header ── */}
        <div
          style={{
            background: 'var(--cream)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 32px 22px',
            marginBottom: 24,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            {/* Title block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'var(--grad-ai)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-md)',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={24} color="#fff" />
              </div>
              <div>
                <h1
                  className="section-title"
                  style={{
                    margin: 0,
                    fontSize: 20,
                    letterSpacing: '-0.01em',
                    color: 'var(--forest)',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  Evidence-Grounded AI Research Assistant
                </h1>
                <p className="section-subtitle" style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--sage)' }}>
                  Ask questions backed by BraTS2020 literature &amp; your capstone results
                </p>
              </div>
            </div>

            {/* Model badge */}
            <span
              className="badge-neuro badge-violet"
              style={{ fontSize: 12, padding: '6px 14px', alignSelf: 'center' }}
            >
              <Sparkles size={12} />
              Gemini-RAG + BraTS Literature
            </span>
          </div>
        </div>

        {/* ── Body: chat + sidebar ── */}
        <div style={{ display: 'flex', flex: 1, gap: 20, overflow: 'hidden' }}>

          {/* ── Chat column ── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >

            {/* Prompt chips */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 11, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, fontWeight: 600 }}>
                Suggested questions
              </p>
              <div className="chip-row" style={{ flexWrap: 'wrap' }}>
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    className="chip chip-ai"
                    onClick={() => handleChipClick(chip)}
                    style={{ fontSize: 12, transition: 'all 150ms ease' }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Message area ── */}
            <div
              style={{
                height: 450,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                paddingRight: 6,
                paddingBottom: 8,
              }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className="msg-bubble"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: 8,
                  }}
                >
                  {/* Avatar + bubble row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      maxWidth: '88%',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: msg.role === 'user' ? 'var(--grad-ddpm)' : 'var(--grad-ai)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {msg.role === 'user' ? (
                        <User size={16} color="#fff" />
                      ) : (
                        <Bot size={16} color="#fff" />
                      )}
                    </div>

                    {/* Bubble */}
                    {msg.role === 'user' ? (
                      /* User — right-aligned mint pill */
                      <div
                        style={{
                          background: 'var(--mint)',
                          color: 'var(--forest)',
                          padding: '10px 16px',
                          borderRadius: '18px 4px 18px 18px',
                          fontSize: 14,
                          lineHeight: 1.55,
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {msg.content}
                      </div>
                    ) : (
                      /* Assistant — ivory card with tc-color left border */
                      <div
                        style={{
                          background: 'var(--ivory)',
                          border: '1px solid var(--border)',
                          borderLeft: '3px solid var(--tc-color)',
                          padding: '14px 18px',
                          borderRadius: '4px 18px 18px 18px',
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: 'var(--forest)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {renderContent(msg.content)}
                      </div>
                    )}
                  </div>

                  {/* Source citation badges (assistant only) */}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        paddingLeft: 44,
                      }}
                    >
                      {msg.sources.map((src, si) => (
                        <span
                          key={si}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10.5,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: 'rgba(45,138,107,0.1)',
                            color: 'var(--tc-color)',
                            border: '1px solid rgba(45,138,107,0.25)',
                            fontWeight: 500,
                          }}
                        >
                          <BookOpen size={10} />
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--sage-light)',
                      paddingLeft: msg.role === 'assistant' ? 44 : 0,
                      paddingRight: msg.role === 'user' ? 44 : 0,
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="msg-bubble" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'var(--grad-ai)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Bot size={16} color="#fff" />
                  </div>
                  <div
                    style={{
                      background: 'var(--ivory)',
                      border: '1px solid var(--border)',
                      borderLeft: '3px solid var(--tc-color)',
                      padding: '12px 18px',
                      borderRadius: '4px 18px 18px 18px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <TypingDots />
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ── */}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 16,
                paddingBottom: 20,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-end',
                  background: 'var(--ivory)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '10px 10px 10px 16px',
                  transition: 'border-color 150ms ease',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <textarea
                  ref={textareaRef}
                  className="textarea-ai"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about tumor regions, DDPM metrics, segmentation results..."
                  rows={1}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--forest)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    lineHeight: 1.55,
                    resize: 'none',
                    overflowY: 'hidden',
                    minHeight: 24,
                    maxHeight: 140,
                    paddingTop: 2,
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  style={{
                    padding: '9px 16px',
                    flexShrink: 0,
                    opacity: !inputText.trim() || isLoading ? 0.5 : 1,
                    cursor: !inputText.trim() || isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  title="Send message (Enter)"
                >
                  {isLoading ? (
                    <span className="spinner" style={{ borderTopColor: '#fff', width: 16, height: 16 }} />
                  ) : (
                    <Send size={16} />
                  )}
                  <span style={{ fontSize: 13 }}>Send</span>
                </button>
              </div>

              {/* Footer note */}
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--sage-light)',
                  textAlign: 'center',
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <Sparkles size={11} style={{ color: 'var(--tc-color)' }} />
                Powered by RAG over BraTS2020 literature + Capstone results
                <span style={{ margin: '0 4px', opacity: 0.3 }}>|</span>
                Press <kbd
                  style={{
                    background: 'var(--cream)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '1px 5px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--forest)',
                  }}
                >Enter</kbd> to send, <kbd
                  style={{
                    background: 'var(--cream)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '1px 5px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--forest)',
                  }}
                >Shift+Enter</kbd> for newline
              </p>
            </div>
          </div>

          {/* ── Side panel — Knowledge Sources (280px) ── */}
          <div
            style={{
              width: 280,
              minWidth: 280,
              borderLeft: '1px solid var(--border)',
              padding: '24px 20px',
              overflowY: 'auto',
              background: 'var(--cream)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <BookOpen size={15} style={{ color: 'var(--tc-color)' }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--sage)',
                  fontFamily: 'var(--font-serif)',
                }}
              >
                Knowledge Sources
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {KNOWLEDGE_SOURCES.map((src, i) => (
                <div
                  key={i}
                  className="ks-card"
                  style={{
                    background: 'var(--ivory)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    borderLeft: `3px solid ${src.color}`,
                    cursor: 'default',
                    transition: 'all 150ms ease',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--forest)',
                      lineHeight: 1.4,
                    }}
                  >
                    {src.title}
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 11,
                      color: 'var(--sage-light)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {src.authors}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 6,
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: src.dim,
                      color: src.color,
                      border: `1px solid ${src.color}44`,
                    }}
                  >
                    {src.year}
                  </span>
                </div>
              ))}
            </div>

            {/* RAG info box */}
            <div
              style={{
                marginTop: 20,
                padding: '12px 14px',
                background: 'rgba(45,138,107,0.08)',
                border: '1px solid rgba(45,138,107,0.2)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: 'var(--sage)',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: 'var(--tc-color)', fontWeight: 700 }}>RAG</span> grounds every
                answer in retrieved document chunks. Cited sources appear as badges beneath each
                response.
              </p>
            </div>

            {/* Stats */}
            <div
              style={{
                marginTop: 16,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {[
                { label: 'Documents', value: '5' },
                { label: 'Embeddings', value: '2.4K' },
                { label: 'Model', value: 'Gemini' },
                { label: 'Context', value: '32K' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: 'var(--ivory)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <p
                    className="font-mono"
                    style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--tc-color)' }}
                  >
                    {stat.value}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Conversation stats */}
            <div style={{ marginTop: 20 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--sage-light)',
                  marginBottom: 8,
                  fontFamily: 'var(--font-serif)',
                }}
              >
                Session
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--sage)' }}>Messages</span>
                  <span className="font-mono" style={{ color: 'var(--tc-color)' }}>{messages.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--sage)' }}>Exchanges</span>
                  <span className="font-mono" style={{ color: 'var(--tc-color)' }}>
                    {Math.floor(messages.filter((m) => m.role === 'user').length)}
                  </span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div
              style={{
                marginTop: 20,
                padding: '10px 12px',
                background: 'rgba(217, 107, 82, 0.22)',
                border: '1px solid rgba(217, 107, 82, 0.22)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(180,60,75,0.9)', lineHeight: 1.55 }}>
                Research prototype only. AI-generated responses require expert clinical interpretation. Not a diagnostic tool.
              </p>
            </div>
          </div>

        </div>{/* end body */}
      </div>{/* end main-content */}
    </>
  );
}
