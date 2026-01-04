import React, { useState } from 'react';
import Frontend from './Frontend';
import Login from './Login';
import './App.css';

function App() {
  const [view, setView] = useState('frontend');

  return (
    <div className="App">
      {view === 'login' ? (
        <Login onLoginSuccess={() => setView('frontend')} />
      ) : (
        <Frontend onLoginClick={() => setView('login')} />
      )}
    </div>
  );
}

export default App;
