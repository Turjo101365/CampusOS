import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Wrench,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Clock,
  Terminal,
  Cpu
} from 'lucide-react';
import { api } from '../api/client.js';

export default function AgentChat({ onDataMutated }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello Sakibul! I am **CampusOS AI** — your university senior assistant for the AUST CSE department. 🎓

I have direct, real-time access to campus timetables, room bookings, departmental events, announcements, and assignment deadlines.

Try asking me anything, or click one of the test queries on the left!`,
      tool_calls: [],
      provider: 'CampusOS Native Engine'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedToolIndex, setExpandedToolIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const sampleQueries = [
    { category: 'Simple Lookups', queries: [
      'When is my next class?',
      'What classes do I have on Wednesday?',
      'What assignments do I have due this week?',
      'Show me all high priority announcements.'
    ]},
    { category: 'Multi-Source Reasoning', queries: [
      'Which labs have a projector and can fit at least 30 people?',
      "I'm free until 2 PM — is there anything on campus I could drop into?"
    ]},
    { category: 'Actions & Ambiguity Handling', queries: [
      'Book Room 7A02 tomorrow from 3 PM to 5 PM.',
      'Register me for the Guest Lecture on Deep Learning.',
      'I need a room for 5 people with a projector, tomorrow between 2 and 4.',
      'Just book me any room tomorrow afternoon.'
    ]}
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg = { role: 'user', content: query.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history format
      const history = updatedMessages
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.sendMessage(query.trim(), history);

      const agentMsg = {
        role: 'assistant',
        content: res.message,
        tool_calls: res.tool_calls || [],
        provider: res.provider || 'CampusOS AI'
      };

      setMessages(prev => [...prev, agentMsg]);

      // If tools were called that mutate state (book_room, cancel_room_booking, register_event, cancel_event_registration)
      const mutatesState = (res.tool_calls || []).some(tc =>
        ['book_room', 'cancel_room_booking', 'register_event', 'cancel_event_registration'].includes(tc.tool)
      );
      if (mutatesState && onDataMutated) {
        onDataMutated();
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an error querying live data: ${err.message}`,
          tool_calls: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Chat history cleared. What campus information can I look up for you?`,
        tool_calls: [],
        provider: 'CampusOS Native Engine'
      }
    ]);
  };

  // Helper to render simple markdown formatting
  const renderFormatted = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Heading 3
      if (line.startsWith('### ')) {
        return <h4 key={idx} style={{ margin: '10px 0 4px', fontSize: '1.05rem', fontWeight: '700' }}>{line.replace('### ', '')}</h4>;
      }
      // Heading 2
      if (line.startsWith('## ')) {
        return <h3 key={idx} style={{ margin: '12px 0 6px', fontSize: '1.15rem', fontWeight: '800' }}>{line.replace('## ', '')}</h3>;
      }
      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} style={{ borderLeft: '3px solid var(--accent-indigo)', paddingLeft: '12px', margin: '6px 0', color: 'var(--text-secondary)', background: 'rgba(99, 102, 241, 0.05)', padding: '6px 12px', borderRadius: '4px' }}>
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      // Bullet list item
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', margin: '3px 0', paddingLeft: '8px' }}>
            <span style={{ color: 'var(--accent-indigo)' }}>•</span>
            <div>{renderInline(line.substring(2))}</div>
          </div>
        );
      }
      // Numbered list item
      const numMatch = line.match(/^([0-9]+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
            <span style={{ color: 'var(--accent-blue)', fontWeight: '700' }}>{numMatch[1]}.</span>
            <div>{renderInline(numMatch[2])}</div>
          </div>
        );
      }
      if (line.trim() === '---') {
        return <hr key={idx} style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />;
      }
      return <p key={idx} style={{ margin: '4px 0' }}>{renderInline(line)}</p>;
    });
  };

  const renderInline = (str) => {
    // Bold **text**
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} style={{ background: 'var(--code-bg)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--code-color)' }}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="agent-view-container">
      {/* Left Sidebar: Sample Queries */}
      <div className="agent-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '0.95rem' }}>
            <Sparkles size={16} color="var(--accent-blue)" />
            <span>Sample Judge Queries</span>
          </div>
          <button className="btn-action-sm" onClick={clearChat} title="Clear conversation">
            <RotateCcw size={12} />
            <span>Clear</span>
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Click any prompt below to evaluate the agent's live multi-source reasoning, real function calling, and clash checks.
        </p>

        {sampleQueries.map((grp, gIdx) => (
          <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.04em', marginTop: '6px' }}>
              {grp.category}
            </div>
            {grp.queries.map((q, qIdx) => (
              <button
                key={qIdx}
                className="sample-chip"
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
              >
                "{q}"
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Right Box: Chat Messages & Input */}
      <div className="agent-chat-box">
        {/* Chat Header */}
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={19} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>CampusOS AI Senior Assistant</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                <span className="status-dot" style={{ width: '6px', height: '6px' }} />
                <span>Active · Live Function Calling & Timetable Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="chat-messages">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={index} className={`chat-bubble ${isUser ? 'chat-user' : 'chat-agent'}`}>
                {/* Agent provider pill */}
                {!isUser && msg.provider && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--accent-blue)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                    <Cpu size={12} />
                    <span>{msg.provider}</span>
                  </div>
                )}

                {/* Content */}
                <div style={{ fontSize: '0.925rem' }}>
                  {isUser ? msg.content : renderFormatted(msg.content)}
                </div>

                {/* Tool Calling Execution Trace */}
                {!isUser && msg.tool_calls && msg.tool_calls.length > 0 && (
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setExpandedToolIndex(expandedToolIndex === index ? null : index)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                        <Terminal size={14} />
                        <span>Executed {msg.tool_calls.length} Live Tool Call{msg.tool_calls.length > 1 ? 's' : ''}</span>
                      </div>
                      {expandedToolIndex === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>

                    {/* Tool Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {msg.tool_calls.map((tc, tIdx) => (
                        <span key={tIdx} className="tool-tag">
                          <Wrench size={11} />
                          <span>{tc.tool}</span>
                        </span>
                      ))}
                    </div>

                    {/* Expanded Tool Details */}
                    {expandedToolIndex === index && (
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {msg.tool_calls.map((tc, tIdx) => (
                          <div
                            key={tIdx}
                            style={{
                              background: 'var(--bg-main)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              padding: '10px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            <div style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                              ⚡ {tc.tool}({JSON.stringify(tc.arguments || {})})
                            </div>
                            <div style={{ marginTop: '4px', maxHeight: '120px', overflowY: 'auto', color: 'var(--text-muted)' }}>
                              Result: {JSON.stringify(tc.result, null, 1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="chat-bubble chat-agent" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="status-dot" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Querying live database & verifying timetable...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form className="chat-input-row" onSubmit={handleFormSubmit}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, padding: '12px 16px' }}
            placeholder="Ask anything (e.g. When is my next class? Book Room 7A02 tomorrow from 3 to 5 PM...)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || !inputText.trim()}
            style={{ padding: '0 20px' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
