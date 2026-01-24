import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, X, Bot, User, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import { sendSidebarChat } from './api_client';

const styles = {
  container: {
    maxWidth: '100vw',
    height: '100%',
    position: 'fixed',
    right: 0,
    top: 0,
    backgroundColor: '#ffffff',
    boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    borderLeft: '1px solid #e0e0e0',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  inputArea: {
    padding: '16px',
    borderTop: '1px solid #f0f0f0',
    backgroundColor: '#fff',
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '12px 16px',
    backgroundColor: '#f0f0f0',
    borderRadius: '16px',
    borderBottomLeftRadius: '4px',
    width: 'fit-content',
    alignItems: 'center',
    color: '#666',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  confirmModal: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    width: '80%',
    maxWidth: '320px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid #eee',
    textAlign: 'center',
    animation: 'fadeIn 0.2s ease-out',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    justifyContent: 'center',
  }
};

const ChatMode = ({ isOpen, onClose, currentTheme, currentOpinion, initialMessage, isMobile }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const messagesEndRef = useRef(null);
  const lastProcessedIdRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const executeSend = useCallback(async (textToSend) => {
    if (!textToSend || isLoading) return;

    setMessages(prev => [...prev, { text: textToSend, sender: 'user' }]);
    setIsLoading(true);

    try {
      const data = await sendSidebarChat(
        textToSend,
        messages,
        currentTheme?.title || "自由テーマ",
        currentOpinion?.title || "未定",
        currentOpinion?.body || "特になし"
      );

      setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: 'エラーが発生しました。', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  }, [currentTheme, currentOpinion, isLoading, messages]);

  useEffect(() => {
    if (isOpen && initialMessage) {
      if (initialMessage.id !== lastProcessedIdRef.current) {
        executeSend(initialMessage.text);
        lastProcessedIdRef.current = initialMessage.id;
      }
    }
  }, [isOpen, initialMessage, executeSend]);

  const handleManualSend = () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    executeSend(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleManualSend();
    }
  };

  const handleResetClick = () => {
    if (messages.length > 0) {
      setShowResetConfirm(true);
    }
  };

  const executeReset = () => {
    setMessages([]);
    setInputText('');
    setShowResetConfirm(false);
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="chat-container" style={{
      ...styles.container,
      // ★横幅分岐：スマホ480px / PC 500px
      width: isMobile ? '480px' : '500px'
    }}>
      {showResetConfirm && (
        <div className="chat-modal-overlay" style={styles.overlay}>
          <div className="chat-modal-content" style={styles.confirmModal}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ backgroundColor: '#fee2e2', padding: '12px', borderRadius: '50%', color: '#ef4444' }}>
                <AlertTriangle size={isMobile ? 24 : 32} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '16px' : '22px', fontWeight: 'bold', color: '#111' }}>会話をリセットしますか？</h3>
            <p style={{ margin: 0, fontSize: isMobile ? '13px' : '18px', color: '#666', lineHeight: '1.5' }}>
              これまでの会話履歴がすべて消去されます。<br />この操作は元に戻せません。
            </p>

            <div style={styles.modalButtons}>
              <button
                onClick={cancelReset}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: isMobile ? '13px' : '16px',
                  fontWeight: '500'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={executeReset}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: isMobile ? '13px' : '16px',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                }}
              >
                リセットする
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: '#e0f2fe', padding: isMobile ? '6px' : '10px', borderRadius: '50%' }}>
            {/* ★アイコンサイズ分岐 */}
            <Bot size={isMobile ? 20 : 24} color="#0284c7" />
          </div>
          <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.5rem', fontWeight: '600', color: '#333' }}>
            AI Assistant
          </h3>
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '10px' : '20px', alignItems: 'center' }}>
          <button
            onClick={handleResetClick}
            title="会話をリセット"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px' }}
          >
            {/* ★リセットボタンサイズ分岐 */}
            <RotateCcw size={isMobile ? 18 : 24} />
          </button>

          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
            {/* ★閉じるボタンサイズ分岐 */}
            <X size={isMobile ? 20 : 24} />
          </button>
        </div>
      </div>

      <div style={styles.messagesArea}>
        {messages.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px', fontSize: isMobile ? '14px' : '18px' }}>
            <Bot size={isMobile ? 32 : 48} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
            <p>
              {currentTheme ? `「${currentTheme.title}」についてですね。` : 'こんにちは！'}
              <br />
              気になったテーマや意見はありましたか？
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              gap: '8px'
            }}>
              {!isUser && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Bot size={16} color="white" />
                </div>
              )}

              <div style={{
                padding: '8px 16px',
                borderRadius: '16px',
                borderTopRightRadius: isUser ? '4px' : '16px',
                borderTopLeftRadius: isUser ? '16px' : '4px',
                maxWidth: '85%',
                backgroundColor: isUser ? '#0284c7' : '#ffffff',
                color: isUser ? 'white' : '#333',
                boxShadow: isUser ? 'none' : '0 2px 5px rgba(0,0,0,0.05)',
                fontSize: isMobile ? '14px' : '18px',
                lineHeight: '1.5',
                wordBreak: 'break-word'
              }}>
                {isUser ? (
                  msg.text
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        return !inline ? (
                          <div style={{
                            backgroundColor: '#f1f1f1',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: isMobile ? '12px' : '16px',
                            overflowX: 'auto',
                            margin: '8px 0'
                          }}>
                            <code {...props}>{children}</code>
                          </div>
                        ) : (
                          <code style={{
                            backgroundColor: '#f1f1f1',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            fontSize: isMobile ? '12px' : '16px'
                          }} {...props}>{children}</code>
                        )
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                )}
              </div>

              {isUser && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <User size={16} color="#64748b" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{
              ...styles.typingIndicator,
              fontSize: isMobile ? '12px' : '16px'
            }}>
              <Loader2 className="animate-spin" size={14} />
              <span>AIが考え中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        ...styles.inputArea,
        padding: isMobile ? '8px 12px' : '12px 12px' // 全体の余白を削減（以前は16px固定）
      }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#f0f2f5',
          borderRadius: '24px',
          // ★入力エリアのパディング分岐
          padding: isMobile ? '4px 4px 4px 16px' : '8px 8px 8px 24px',
          border: '1px solid transparent',
          transition: 'border 0.2s',
        }}>
          <input
            type="text"
            placeholder="メッセージを入力..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            style={{
              flexGrow: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: isMobile ? '14px' : '18px',
              padding: '8px 0'
            }}
          />
          <button
            onClick={handleManualSend}
            disabled={!inputText.trim() || isLoading}
            style={{
              backgroundColor: inputText.trim() && !isLoading ? '#0284c7' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              // ★送信ボタン本体のサイズ分岐
              width: isMobile ? '36px' : '48px',
              height: isMobile ? '36px' : '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputText.trim() && !isLoading ? 'pointer' : 'default',
              transition: 'background-color 0.2s'
            }}
          >
            {/* ★送信アイコンのサイズ分岐 */}
            <Send size={isMobile ? 16 : 24} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ChatMode;