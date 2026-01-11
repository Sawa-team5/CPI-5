import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, X, Bot, User, Loader2 } from 'lucide-react'; // アイコンライブラリ
import remarkGfm from 'remark-gfm';

// スタイル定義（CSSファイルに分けてもOKですが、コピペ用にここに書きます）
const styles = {
  container: {
    width: '380px', // 少し幅を広げる
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
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px', // メッセージ間の余白
    backgroundColor: '#f8f9fa',
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
    fontSize: '12px'
  }
};

const ChatMode = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 思考中フラグ
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

// ChatMode.js の handleSend 関数

const handleSend = async () => {
  const text = inputText.trim();
  if (!text || isLoading) return;

  // 1. まず自分のメッセージを追加して画面更新
  const newMessages = [...messages, { text, sender: 'user' }];
  setMessages(newMessages);
  setInputText('');
  setIsLoading(true);

  try {
    // 2. Pythonへ送信（履歴すべてを送る）
    const response = await fetch('http://localhost:8000/simple-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: text,
        history: messages, // ★ここが重要：これまでの履歴を送る
        // 必要ならテーマを固定で送ることも可能
        // topic: "AIの権利について", 
        // viewpoint: "賛成" 
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    // 3. AIの返答を追加
    setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);

  } catch (error) {
    console.error('Error:', error);
    setMessages(prev => [...prev, { text: 'エラーが発生しました。', sender: 'bot' }]);
  } finally {
    setIsLoading(false);
  }
};

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enterで改行できるように
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: '#e0f2fe', padding: '6px', borderRadius: '50%' }}>
            <Bot size={20} color="#0284c7" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#333' }}>AI Assistant</h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
          <X size={20} />
        </button>
      </div>
      
      {/* メッセージエリア */}
      <div style={styles.messagesArea}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px', fontSize: '14px' }}>
            <Bot size={48} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
            <p>何でも聞いてください。<br/>AIがお手伝いします。</p>
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
              {/* Botアイコン（左側） */}
              {!isUser && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Bot size={16} color="white" />
                </div>
              )}

              {/* 吹き出し */}
              <div style={{
                padding: '8px 16px',
                borderRadius: '16px',
                borderTopRightRadius: isUser ? '4px' : '16px',
                borderTopLeftRadius: isUser ? '16px' : '4px',
                maxWidth: '85%',
                backgroundColor: isUser ? '#0284c7' : '#ffffff', // ユーザーは濃い青、AIは白
                color: isUser ? 'white' : '#333',
                boxShadow: isUser ? 'none' : '0 2px 5px rgba(0,0,0,0.05)',
                fontSize: '14px',
                lineHeight: '1.5',
                wordBreak: 'break-word'
              }}>
                {isUser ? (
                  msg.text
                ) : (
                  // Markdownレンダリング（スタイルは簡易的）
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        return !inline ? (
                          <div style={{backgroundColor: '#f1f1f1', padding: '8px', borderRadius: '4px', fontSize: '12px', overflowX: 'auto', margin: '8px 0'}}>
                            <code {...props}>{children}</code>
                          </div>
                        ) : (
                          <code style={{backgroundColor: '#f1f1f1', padding: '2px 4px', borderRadius: '3px'}} {...props}>{children}</code>
                        )
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                )}
              </div>

              {/* Userアイコン（右側） */}
              {isUser && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <User size={16} color="#64748b" />
                </div>
              )}
            </div>
          );
        })}

        {/* 思考中のインジケーター */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '8px' }}>
             <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} color="white" />
              </div>
              <div style={styles.typingIndicator}>
                <Loader2 className="animate-spin" size={14} /> 
                <span>AIが考え中...</span>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 入力エリア */}
      <div style={styles.inputArea}>
        <div style={{ 
          display: 'flex', 
          backgroundColor: '#f0f2f5', 
          borderRadius: '24px', 
          padding: '4px 4px 4px 16px',
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
              fontSize: '14px',
              padding: '8px 0'
            }}
          />
          <button 
            onClick={handleSend} 
            disabled={!inputText.trim() || isLoading}
            style={{ 
              backgroundColor: inputText.trim() && !isLoading ? '#0284c7' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: inputText.trim() && !isLoading ? 'pointer' : 'default',
              transition: 'background-color 0.2s'
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      
      {/* ローディングアニメーション用の簡易CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatMode;