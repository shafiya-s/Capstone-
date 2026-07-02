import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface AskFreshTrackProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => Promise<string>;
}

const EXAMPLE_PROMPTS = [
  "What recipe can I cook with my expiring items?",
  "How can I improve my Kitchen Health Score?",
  "Give me storage tips to extend the shelf life of bananas.",
  "Which items in my kitchen should I eat first?"
];

export const AskFreshTrack: React.FC<AskFreshTrackProps> = ({ chatHistory, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking]);

  const handleSend = async (msg: string) => {
    if (!msg.trim()) return;
    setInput('');
    setIsThinking(true);
    await onSendMessage(msg);
    setIsThinking(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend(input);
    }
  };

  // Helper to format responses with simple markdown links or bold items
  const formatResponse = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Check for bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().substring(2);
        return <li key={idx} style={{ marginLeft: '20px', marginBottom: '4px' }}>{parseBold(itemText)}</li>;
      }
      if (line.trim().match(/^\d+\.\s/)) {
        const itemText = line.trim().replace(/^\d+\.\s/, '');
        return <li key={idx} style={{ marginLeft: '20px', listStyleType: 'decimal', marginBottom: '4px' }}>{parseBold(itemText)}</li>;
      }
      return <p key={idx} style={{ marginBottom: '8px' }}>{parseBold(line)}</p>;
    });
  };

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      // Parse inline code
      const codeParts = part.split(/(`.*?`)/g);
      return codeParts.map((subPart, subIdx) => {
        if (subPart.startsWith('`') && subPart.endsWith('`')) {
          return (
            <code key={subIdx} style={{ 
              backgroundColor: 'rgba(46,125,50,0.08)', 
              color: 'var(--primary)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              {subPart.slice(1, -1)}
            </code>
          );
        }
        return subPart;
      });
    });
  };

  return (
    <div className="animated">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ask FreshTrack AI</h1>
          <p className="page-subtitle">Your AI kitchen assistant for recipe recommendations, waste analysis, and storage advice</p>
        </div>
      </div>

      <div className="chat-container">
        {/* Chat History Panel */}
        <div className="chat-history">
          {chatHistory.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              maxWidth: '500px',
              margin: 'auto'
            }}>
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</span>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
                Meet FreshTrack Assistant
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                Ask me about recipe combinations, food shelf-life tips, or details about the items currently stored in your kitchen.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '13px',
                      textAlign: 'left',
                      padding: '12px 16px',
                      justifyContent: 'flex-start',
                      width: '100%',
                      borderColor: 'var(--border-color)',
                      fontWeight: '500'
                    }}
                  >
                    💡 "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {chatHistory.map((chat, idx) => (
                <div
                  key={idx}
                  className={`chat-bubble ${
                    chat.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                  }`}
                >
                  <div style={{ fontSize: '11px', opacity: '0.7', marginBottom: '4px', textAlign: chat.sender === 'user' ? 'right' : 'left' }}>
                    {chat.sender === 'user' ? 'You' : 'FreshTrack AI'}
                  </div>
                  <div>
                    {chat.sender === 'user' ? chat.message : formatResponse(chat.message)}
                  </div>
                </div>
              ))}
              
              {isThinking && (
                <div className="chat-bubble chat-bubble-ai">
                  <div style={{ fontSize: '11px', opacity: '0.7', marginBottom: '4px' }}>FreshTrack AI</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Analyzing inventory and preparing response</span>
                    <span style={{
                      display: 'inline-flex',
                      gap: '3px'
                    }}>
                      <span className="dot" style={{ width: '4px', height: '4px', backgroundColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite alternate' }} />
                      <span className="dot" style={{ width: '4px', height: '4px', backgroundColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite alternate 0.2s' }} />
                      <span className="dot" style={{ width: '4px', height: '4px', backgroundColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite alternate 0.4s' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={historyEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Type your question here (e.g. 'What can I cook with tomato and avocado?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="chat-input"
            disabled={isThinking}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isThinking || !input.trim()}
            className="btn btn-primary"
            style={{ padding: '0 24px', display: 'flex', alignItems: 'center' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Dynamic Keyframe Injection for the dot animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: translateY(0); opacity: 0.3; }
          100% { transform: translateY(-4px); opacity: 1; }
        }
      `}} />
    </div>
  );
};
