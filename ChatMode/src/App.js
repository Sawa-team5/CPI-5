import logo from './logo.svg';
import './App.css';
import React from 'react';
import ChatMode from './ChatMode';  // ChatMode.jsxをインポート

function App() {
  return (
    <div className="App">
      
      <ChatMode />  {/* ここにチャットモードコンポーネントを配置 */}
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;