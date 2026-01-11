import React, { useState, useRef, useEffect } from 'react';

const ChatMode = ({ isOpen, onClose, themeId, stanceScore }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Chat panel opened → initialize session + get step1 message once
  useEffect(() => {
    if (!isOpen) return;

    // make a stable session id per theme trigger
    const sid = themeId ? `theme-${themeId}` : `session-${Date.now()}`;
    setSessionId(sid);

    // reset messages when opening (optional)
    setMessages([]);

    // kick off the first assistant message (step1)
    (async () => {
      try {
        setIsSending(true);
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sid,
            message: '',
            themeTitle: null,
            stanceScore: stanceScore ?? null,
            agreedOpinion: null,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data?.reply) throw new Error(data?.detail || 'Chat start failed');

        setMessages([{ text: data.reply, sender: 'bot' }]);
      } catch (err) {
        console.error(err);
        setMessages([{ text: 'チャットの開始に失敗しました。', sender: 'bot' }]);
      } finally {
        setIsSending(false);
      }
    })();
  }, [isOpen, themeId, stanceScore]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !sessionId || isSending) return;

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setInputText('');

    try {
      setIsSending(true);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          stanceScore: stanceScore ?? null,
          // you can pass themeTitle/agreedOpinion later when you have them
        }),
      });
      
      const data = await res.json();
      if (!res.ok || !data?.reply) throw new Error(data?.detail || 'Chat failed');

      setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { text: 'エラーが発生しました。', sender: 'bot' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
  // If IME is composing, Enter should confirm conversion, not send
  if (e.nativeEvent.isComposing || isComposing) return;

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

  if (!isOpen) return null;

  return (
    <div style={{ 
        width: '350px', 
        height: '100%', 
        position: 'fixed', 
        right: 0, 
        top: 0, 
        backgroundColor: '#f9f9f9', 
        boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        fontFamily: 'Arial, sans-serif',
        borderLeft: '1px solid #ccc'
    }}>
      <div style={{ 
          padding: '15px', 
          backgroundColor: '#6c757d', // 画像のヘッダー色に近づける
          color: 'white', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AIチャット</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>×</button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
            {isSending ? 'AIが考えています…' : 'AIチャットへようこそ。'}
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              margin: '5px 0',
              padding: '10px 14px',
              borderRadius: 10,
              maxWidth: '85%',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'user' ? '#d1e7dd' : '#e2e3e5', // 画像の吹き出し色に近づける
              color: '#333',
              fontSize: '14px',
              lineHeight: '1.4'
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ padding: 15, borderTop: '1px solid #ccc', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex' }}>
            <input
            type="text"
            placeholder="メッセージを入力..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleKeyDown}
            style={{ 
                flexGrow: 1, 
                padding: '10px', 
                borderRadius: '20px', 
                border: '1px solid #ccc', 
                marginRight: '10px',
                outline: 'none'
            }}
            />
            <button onClick={handleSend} style={{ 
                padding: '10px 15px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
            ➤
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMode;
