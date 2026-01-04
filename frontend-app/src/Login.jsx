import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  const [nickname, setNickname] = useState('');

  const handleAction = async (type) => {
    if (!nickname) return alert("ニックネームを入力してください");

    try {
      // 1. バックエンドのエンドポイントを選択
      const endpoint = type === 'register' ? '/api/users/register' : '/api/users/login';

      // 2. 実際の API 通信を実行
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }) 
      });

      const data = await response.json();

      // 3. サーバーエラー（重複など）のハンドリング
      if (!response.ok) {
        throw new Error(data.detail || "認証に失敗しました");
      }

      // 4. サーバーが発行した本物の情報をブラウザに保存
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('nickname', data.user.nickname);
      
      alert(type === 'register' ? "登録が完了しました！" : `おかえりなさい、${data.user.nickname}さん`);
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      alert("エラー: " + error.message);
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>ログイン / 新規登録</h2>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="ニックネームを入力してください"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{ padding: '10px', width: '250px' }}
        />
      </div>
      <div>
        <button onClick={() => handleAction('register')} style={{ marginRight: '10px' }}>新規登録</button>
        <button onClick={() => handleAction('login')}>ログイン</button>
      </div>
    </div>
  );
};

export default Login;