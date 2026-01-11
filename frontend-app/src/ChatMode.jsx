import React, { useState, useRef, useEffect } from 'react';

const ChatMode = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket接続を作成し、chat_triggerイベントを監視する
  useEffect(() => {
    if (!userId) return

    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("WebSocket connected");

    ws.send(
      JSON.stringify({
        type: "hello",
        userId: userId,
      })
    );
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "chat_trigger") {
        console.log("Chat trigger received", data);

        // チャットモードを開く
        setChatModeOpen(true);

        // どのテーマで発火したか保持
        setTriggeredThemeId(data.themeId);
        setTriggeredScore(data.stanceScore);
        }
      } catch (e) {
        console.error("Invalid JSON", e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setInputText('');

    // ダミー応答 (バックエンド未接続のため)
    setTimeout(() => {
        setMessages(prev => [...prev, { text: 'AIの応答(ダミー): ' + text, sender: 'bot' }]);
    }, 500);

    // PythonバックエンドにPOSTで送信し、応答を受け取る
    fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
      .then(res => res.json())
      .then(data => {
        setMessages(prev => [...prev, { text: 'AIの応答: ' + data.reply, sender: 'bot' }]);
      })
      .catch(err => {
        setMessages(prev => [...prev, { text: 'エラーが発生しました。', sender: 'bot' }]);
        console.error(err);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
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
                AIチャットへようこそ。<br/>何か話しかけてください。
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
