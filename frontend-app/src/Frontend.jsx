import React, { useState, useEffect } from 'react';
import dummyData from './dummyData.json';
import { calculateNewScore } from './dummy_backend';
import ChatMode from './ChatMode';

const Frontend = ({ onLoginClick }) => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [selfScore, setSelfScore] = useState(0);
  const [selectedOpinion, setSelectedOpinion] = useState(null);
  const [themes, setThemes] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    // コンポーネント読み込み時にlocalStorageから名前を取得
    const storedNickname = localStorage.getItem('nickname');
    if (storedNickname) {
      setNickname(storedNickname);
    }

    fetch("/api/themes")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        const backendThemes = json?.themes ?? [];
        setThemes(backendThemes.length > 0 ? backendThemes : dummyData.themes);
      })
      .catch(err => {
        console.error("Failed to fetch themes, using dummyData:", err);
        setThemes(dummyData.themes);
      });
  }, []);

  // ログアウト処理：情報を削除し、表示をリセットする
  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      localStorage.removeItem('nickname');
      localStorage.removeItem('userId');
      setNickname('');
      // 必要に応じて初期画面に戻るなどの処理をここに追加できます
    }
  };

  const handleThemeClick = (theme) => {
    setCurrentTheme(theme);
    setSelfScore(0);
  };

  const handleOpinionClick = (opinion) => {
    setSelectedOpinion(opinion);
  };

  const handleVote = (type) => {
    if (!selectedOpinion) return;
    const newScore = calculateNewScore(selfScore, selectedOpinion.score, type);
    setSelfScore(newScore);
    setSelectedOpinion(null);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>テーマ一覧</h3>
        <ul style={styles.themeList}>
          {themes.map(theme => (
            <li 
              key={theme.id} 
              style={{
                ...styles.themeItem,
                backgroundColor: currentTheme?.id === theme.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'
              }}
              onClick={() => handleThemeClick(theme)}
            >
              {theme.title}
              <span style={styles.arrow}>▶</span>
            </li>
          ))}
        </ul>
        
        {/* User Info Area: image_6bbac1.png の赤枠部分 */}
        <div style={styles.userInfoArea}>
          {nickname ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span>ログイン中: <strong>{nickname}</strong> さん</span>
              <span onClick={handleLogout} style={styles.logoutLink}>
                ログアウト
              </span>
            </div>
          ) : (
            <span 
              onClick={onLoginClick} 
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              ログインしてください
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {currentTheme ? (
          <ThemeDetailView 
            theme={currentTheme} 
            selfScore={selfScore} 
            onOpinionClick={handleOpinionClick} 
          />
        ) : (
          <ThemeListView themes={themes} onThemeClick={handleThemeClick} />
        )}
      </div>

      {/* Modal, Chat, etc. (以下省略せず保持) */}
      {selectedOpinion && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>{selectedOpinion.title}</h3>
            <p style={{margin: '20px 0'}}>{selectedOpinion.body}</p>
            {selectedOpinion.sourceUrl && (
              <div style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
                <a href={selectedOpinion.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1a0dab' }}>
                  ソースを確認する
                </a>
              </div>
            )}
            <div style={styles.buttonGroup}>
              <button style={styles.opposeButton} onClick={() => handleVote('oppose')}>反対</button>
              <button style={styles.agreeButton} onClick={() => handleVote('agree')}>賛成</button>
            </div>
            <button style={styles.closeButton} onClick={() => setSelectedOpinion(null)}>閉じる</button>
          </div>
        </div>
      )}

      {!isChatOpen && (
        <div style={styles.chatToggle} onClick={() => setIsChatOpen(true)}>◀</div>
      )}
      <ChatMode isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

// --- Sub Components ---
const ThemeListView = ({ themes, onThemeClick }) => (
  <div style={styles.bubbleContainer}>
    {themes.map((theme, index) => (
      <div
        key={theme.id}
        style={{
          ...styles.themeBubble,
          backgroundColor: theme.color,
          left: `${20 + (index * 25)}%`,
          top: `${30 + (index % 2 * 20)}%`,
        }}
        onClick={() => onThemeClick(theme)}
      >
        {theme.title}
      </div>
    ))}
  </div>
);

const ThemeDetailView = ({ theme, selfScore, onOpinionClick }) => (
  <div style={styles.detailContainer}>
    <h2 style={styles.pageTitle}>{theme.title}</h2>
    <div style={styles.bubblesArea}>
      {theme.opinions.map((op, index) => {
        const leftPos = ((op.score + 100) / 200) * 100;
        const topPos = 20 + (index * 20) % 50; 
        return (
          <div
            key={op.id}
            style={{
              ...styles.opinionBubble,
              left: `${leftPos}%`,
              top: `${topPos}%`,
              backgroundColor: op.color || theme.color,
            }}
            onClick={() => onOpinionClick(op)}
          >
            <div style={{fontWeight: 'bold'}}>{op.title}</div>
            <div style={{fontSize: '0.8rem', marginTop: '5px'}}>ID: {op.id}</div>
          </div>
        );
      })}
      <div
        style={{
          ...styles.selfBubble,
          left: `${((selfScore + 100) / 200) * 100}%`,
          top: '70%',
        }}
      >
        自分
      </div>
    </div>
    <div style={styles.axisContainer}>
      <div style={styles.axisLabelLeft}>反対</div>
      <div style={styles.axisLine}>
        <div style={styles.axisArrowLeft}>◀</div>
        <div style={styles.axisArrowRight}>▶</div>
      </div>
      <div style={styles.axisLabelRight}>賛成</div>
    </div>
  </div>
);

// --- Styles ---
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f0f2f5',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#7986CB',
    padding: '20px',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  sidebarTitle: {
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.3)',
    paddingBottom: '10px',
  },
  themeList: {
    listStyle: 'none',
    padding: 0,
    flex: 1, // テーマ一覧を広げる
    overflowY: 'auto',
  },
  themeItem: {
    padding: '15px',
    border: '1px solid rgba(255,255,255,0.5)',
    marginBottom: '10px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '4px',
  },
  arrow: {
    fontWeight: 'bold',
  },
  userInfoArea: {
    marginTop: 'auto', // 常に最下部に配置
    padding: '15px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  logoutLink: {
    fontSize: '0.8rem',
    textDecoration: 'underline',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  main: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'white',
    margin: '20px',
    border: '2px solid #333',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  // ... (その他のスタイルも維持)
  bubbleContainer: { position: 'relative', width: '100%', height: '100%' },
  themeBubble: { position: 'absolute', width: '160px', height: '160px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', transform: 'translate(-50%, -50%)' },
  detailContainer: { padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' },
  pageTitle: { fontSize: '1.5rem', marginBottom: '10px' },
  bubblesArea: { flex: 1, position: 'relative', marginBottom: '60px' },
  opinionBubble: { position: 'absolute', width: '130px', height: '130px', borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '10px', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transform: 'translate(-50%, -50%)', zIndex: 2, color: '#333' },
  selfBubble: { position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'white', border: '2px solid #d32f2f', color: '#d32f2f', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', transform: 'translate(-50%, -50%)', zIndex: 3, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  axisContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', width: '100%' },
  axisLabelLeft: { fontWeight: 'bold', fontSize: '1.2rem' },
  axisLabelRight: { fontWeight: 'bold', fontSize: '1.2rem' },
  axisLine: { flex: 1, height: '4px', backgroundColor: '#1a237e', position: 'relative', margin: '0 20px' },
  axisArrowLeft: { position: 'absolute', left: '-8px', top: '-10px', color: '#1a237e', fontSize: '1.5rem' },
  axisArrowRight: { position: 'absolute', right: '-8px', top: '-10px', color: '#1a237e', fontSize: '1.5rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '400px', textAlign: 'center' },
  buttonGroup: { display: 'flex', justifyContent: 'space-around', margin: '20px 0' },
  agreeButton: { padding: '10px 30px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  opposeButton: { padding: '10px 30px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  closeButton: { padding: '5px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  chatToggle: { position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', width: '30px', height: '60px', backgroundColor: '#6c757d', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', zIndex: 999, fontSize: '1.2rem' }
};

export default Frontend;