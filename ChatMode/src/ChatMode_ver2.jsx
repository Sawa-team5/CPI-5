import React, { useState, useRef, useEffect } from 'react';

const ChatMode = () => {
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
    const ws = new WebSocket('ws://localhost:8000/ws'); // バックエンドのWebSocket URLに合わせてください

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_trigger') {
          // トリガー受信時の処理例：メッセージ追加
          setMessages(prev => [...prev, { text: 'バックエンドからのトリガーを受信しました。', sender: 'bot' }]);
        }
      } catch (e) {
        console.error('Invalid JSON', e);
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
  }, []);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setInputText('');

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

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>チャットモード</h2>
      <div style={{ border: '1px solid #ccc', height: 400, overflowY: 'auto', padding: 10, backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              margin: '5px 0',
              padding: '8px 12px',
              borderRadius: 10,
              maxWidth: '80%',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'user' ? '#d1e7dd' : '#f8d7da',
              marginLeft: msg.sender === 'user' ? 'auto' : undefined,
              marginRight: msg.sender === 'bot' ? 'auto' : undefined,
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ marginTop: 10, display: 'flex' }}>
        <input
          type="text"
          placeholder="メッセージを入力してください"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flexGrow: 1, padding: 10, fontSize: 16 }}
        />
        <button onClick={handleSend} style={{ padding: '10px 20px', fontSize: 16 }}>
          送信
        </button>
      </div>
    </div>
  );
};

export default ChatMode;