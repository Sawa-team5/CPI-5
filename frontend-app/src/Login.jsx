import React, { useState } from 'react';
// ★追加: 作った関数をインポート
import { authUser } from './api_client';

const Login = ({ onLoginSuccess }) => {
  const [nickname, setNickname] = useState('');

  const handleAction = async (type) => {
    if (!nickname) return alert("ニックネームを入力してください");

    try {
      // ★修正: 直接 fetch せず、共通の関数を使う
      const data = await authUser(type, nickname);

      // 4. サーバーが発行した本物の情報をブラウザに保存
      // (main.pyを修正したので、data.user がちゃんと存在するはず)
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('nickname', data.user.nickname);
      
      alert(type === 'register' ? "登録が完了しました！" : `おかえりなさい、${data.user.nickname}さん`);
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error(error);
      alert("エラー: " + error.message);
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}>
      <h2>ログイン / 新規登録</h2>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="ニックネームを入力してください"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{ padding: '10px', width: '250px', fontSize: '16px' }}
        />
      </div>
      <div>
        <button 
          onClick={() => handleAction('register')} 
          style={{ marginRight: '10px', padding: '10px 20px', cursor: 'pointer' }}
        >
          新規登録
        </button>
        <button 
          onClick={() => handleAction('login')}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          ログイン
        </button>
      </div>
    </div>
  );
};

export default Login;