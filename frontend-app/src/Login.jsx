import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  // 【本番用】ユーザーが入力する値を保持する状態（State）
  const [nickname, setNickname] = useState('');

  const handleAction = (type) => {
    if (!nickname) return alert("ニックネームを入力してください");

    // --- ここから【ダミー実装】 ---
    // 本来はサーバーが発行するUUIDを、フロント側で適当に生成して代用
    const mockUser = {
      id: "mock-uuid-" + Math.random().toString(36).substr(2, 9),
      nickname: nickname
    };

    // サーバーが成功を返したと仮定してメッセージを作成
    const message = type === 'register' 
      ? `ユーザー '${nickname}' を登録しました` 
      : `ようこそ、${nickname}さん`;
    // --- ここまで【ダミー実装】 ---


    // --- ここから【本番でも使う実装】 ---
    // 成功した結果（ID）をブラウザに保存する（チームの最重要指示）
    localStorage.setItem('userId', mockUser.id);
    localStorage.setItem('nickname', mockUser.nickname);
    
    alert(`${message}\n(ID: ${mockUser.id} を保存しました)`);
    
    if (onLoginSuccess) {
      onLoginSuccess();
    }
    console.log("保存されたユーザーID:", localStorage.getItem('userId'));
    // --- ここまで【本番でも使う実装】 ---
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>ログイン / 新規登録</h2>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="ニックネームを入力してください"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)} //
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