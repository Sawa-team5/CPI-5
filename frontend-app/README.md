# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

# バックエンド統合時の注意点 (Merge Guide)

本プロジェクトをバックエンドと統合する際に必要な変更点についてまとめました。

## 1. 記事データのJSON構造

現在、フロントエンドでは `src/dummyData.json` を使用して記事データを表示しています。
バックエンドからAPIでデータを取得する際は、以下のJSON構造に合わせてレスポンスを返すか、フロントエンド側で受け取ったデータをこの形式に変換してください。

```json
{
  "themes": [
    {
      "id": "theme1", // テーマの一意なID
      "title": "高市政権", // テーマのタイトル
      "color": "#E57373", // テーマの背景色
      "opinions": [
        { 
          "id": "op1", // 意見の一意なID
          "title": "積極財政", // 意見のタイトル（バブルに表示）
          "body": "国債を発行して投資を増やすべき...", // 意見の詳細本文
          "score": 80, // 意見のスコア（-100〜100: 左が負、右が正）
          "color": "#EF9A9A", // バブルの色
          "sourceUrl": "https://example.com/..." // ソース記事のURL
        },
        // ... 他の意見
      ]
    },
    // ... 他のテーマ
  ]
}
```

## 2. ダミー機能の無効化とバックエンド接続

現在、計算ロジックとチャット応答はフロントエンド内で完結するダミー実装になっています。
バックエンドと接続する際は、以下の箇所を修正してください。

### A. スコア計算ロジック (`src/Frontend.jsx` & `src/dummy_backend.jsx`)

現在は `src/dummy_backend.jsx` 内の `calculateNewScore` 関数でスコアを計算しています。

**修正手順:**
1. `src/Frontend.jsx` で `calculateNewScore` のインポートを削除または変更する。
2. `handleVote` 関数内で、バックエンドのAPIを呼び出す処理に書き換える。

**変更前 (src/Frontend.jsx):**
```jsx
import { calculateNewScore } from './dummy_backend';

// ...

const handleVote = (type) => {
  if (!selectedOpinion) return;

  // ダミー計算
  const newScore = calculateNewScore(selfScore, selectedOpinion.score, type);

  setSelfScore(newScore);
  setSelectedOpinion(null);
};
```

**変更後イメージ:**
```jsx
// import { calculateNewScore } from './dummy_backend'; // 削除

const handleVote = async (type) => {
  if (!selectedOpinion) return;

  try {
    // バックエンドへPOSTリクエスト
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentScore: selfScore,
        opinionId: selectedOpinion.id,
        voteType: type
      })
    });
    const data = await response.json();
    setSelfScore(data.newScore); // バックエンドから返ってきた新しいスコアをセット
  } catch (error) {
    console.error('Vote failed:', error);
  }
  setSelectedOpinion(null);
};
```

### B. チャット機能 (`src/ChatMode.jsx`)

現在は入力されたテキストをそのままオウム返しするダミー実装になっています。また、WebSocket接続部分もコメントアウトされています。

**修正手順:**
1. `handleSend` 関数内のダミー応答部分を削除する。
2. コメントアウトされている `fetch` 処理（またはWebSocket送信処理）を有効化する。
3. `useEffect` 内のWebSocket接続処理のコメントアウトを解除し、正しいURLを設定する。

**変更前 (src/ChatMode.jsx):**
```jsx
  // WebSocket接続を作成し、chat_triggerイベントを監視する
  useEffect(() => {
    /* 
    // ... コメントアウトされているWebSocket処理 ...
    */
  }, []);

  const handleSend = () => {
    // ...
    
    // ダミー応答 (バックエンド未接続のため)
    setTimeout(() => {
        setMessages(prev => [...prev, { text: 'AIの応答(ダミー): ' + text, sender: 'bot' }]);
    }, 500);

    /*
    // ... コメントアウトされているfetch処理 ...
    */
  };
```

**変更後イメージ:**
```jsx
  // WebSocket接続を有効化
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws'); // 適切なURLに変更

    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
        // ... 受信処理 ...
    };
    // ...
    return () => ws.close();
  }, []);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setInputText('');

    // ダミー応答を削除し、API呼び出しを有効化
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
        console.error(err);
      });
  };
```
