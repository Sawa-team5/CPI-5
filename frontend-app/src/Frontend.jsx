import React, { useState, useEffect, useRef, useMemo } from 'react';
import dummyData from './dummyData.json';
import ChatMode from './ChatMode';
import { fetchThemes, createThemeByAI, API_BASE_URL } from './api_client';

// ★追加: 画面サイズを監視するカスタムフック (コンポーネントの外に定義)
const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
};

const Frontend = ({ onLoginClick }) => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [selfScore, setSelfScore] = useState(0); 
  const [selectedOpinion, setSelectedOpinion] = useState(null);
  const [themes, setThemes] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // メッセージをオブジェクト（テキスト＋ID）で管理
  const [startMessage, setStartMessage] = useState(null);
  
  const initializedRef = useRef(false);

  // 画面サイズ取得
  const [width] = useWindowSize();
  const isMobile = width < 768; // スマホ判定

  useEffect(() => {
    const storedNickname = localStorage.getItem('nickname');
    if (storedNickname) {
      setNickname(storedNickname);
    }

    const initData = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      setIsGenerating(true);
      try {
        const data = await fetchThemes();
        const existingThemes = data?.themes ?? [];

        if (existingThemes.length > 0) {
          setThemes(existingThemes);
        } else {
          console.log("初期データがないため、AIで自動生成を開始します...");
          const politicalTopics = [
            "移民受け入れ拡大", "防衛費の増額", "夫婦別姓制度", 
            "原発の再稼働", "ベーシックインカム", "憲法改正"
          ];
          
          const selectedTopics = politicalTopics
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

          const promises = selectedTopics.map(async (topic) => {
            try {
              const res = await createThemeByAI(topic);
              if (res.themes && res.themes[0]) {
                setThemes((prev) => [...prev, res.themes[0]]);
              }
            } catch (err) {
              console.error(`生成失敗: ${topic}`, err);
            }
          });

          await Promise.all(promises);
        }
      } catch (err) {
        console.error("初期化エラー:", err);
        setThemes(dummyData.themes);
      } finally {
        setIsGenerating(false);
      }
    };

    initData();
  }, []);

  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      localStorage.removeItem('nickname');
      localStorage.removeItem('userId');
      setNickname('');
    }
  };

  const handleThemeClick = async (theme) => {
    setCurrentTheme(theme);
    
    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        const res = await fetch(`${API_BASE_URL}/stance/${theme.id}`, {
            headers: { 'X-User-ID': userId }
        });
        if (res.ok) {
            const data = await res.json();
            setSelfScore(data.stance_score || 0);
        } else {
            setSelfScore(0);
        }
      } catch (e) {
        console.error("Failed to fetch stance", e);
        setSelfScore(0);
      }
    } else {
      setSelfScore(0);
    }
  };

  const handleOpinionClick = (opinion) => {
    setSelectedOpinion(opinion);
  };

  const handleVote = async (type) => {
    if (!selectedOpinion) return;

    const userId = localStorage.getItem('userId');
    if (userId) {
        try {
            const res = await fetch(`${API_BASE_URL}/vote`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-User-ID': userId 
                },
                body: JSON.stringify({
                    opinionId: selectedOpinion.id,
                    voteType: type
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                console.log("移動しました！", data);
                setSelfScore(data.newScore);
            }
        } catch (e) {
            console.error("Vote failed", e);
        }
    }

    const msgText = type === 'agree' 
      ? `「${selectedOpinion.title}」という意見に賛成です。` 
      : `「${selectedOpinion.title}」という意見には反対です。懸念点があります。`;
    
    // 現在時刻(id)もセットして再送防止
    setStartMessage({ text: msgText, id: Date.now() });

    setSelectedOpinion(null); 
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setStartMessage(null);
  };

  // ★修正: スマホ対応の動的スタイル
  const dynamicStyles = {
    container: {
      ...styles.container,
      flexDirection: isMobile ? 'column' : 'row',
    },
    sidebar: {
      ...styles.sidebar,
      width: isMobile ? '100%' : '200px',
      height: isMobile ? 'auto' : '100vh',
      padding: isMobile ? '10px' : '20px',
      flexDirection: isMobile ? 'row' : 'column',
      alignItems: 'center',
      gap: isMobile ? '10px' : '0',
    },
    themeList: {
      ...styles.themeList,
      display: isMobile ? 'none' : 'block', // スマホ時は一旦リスト非表示
    },
    main: {
      ...styles.main,
      height: isMobile ? 'calc(100vh - 60px)' : '100%',
    }
  };

  return (
    <div className="app-container" style={dynamicStyles.container}>
      <div className="app-sidebar" style={dynamicStyles.sidebar}>
        <h3 style={isMobile ? {fontSize: '1.2rem', margin: 0, fontWeight:'bold'} : styles.sidebarTitle}>Polyphony</h3>
        
        {/* PC表示時のみリストなどを表示 */}
        {!isMobile && (
          <>
            <h4 style={{fontSize: '0.9rem', marginBottom: '10px', opacity: 0.8}}>テーマ一覧</h4>

            {isGenerating && themes.length === 0 && (
              <div style={{color: '#fff', padding: '10px', fontSize: '0.9rem'}}>
                AIが思考中...<br/>話題を作っています (3件)
              </div>
            )}

            <ul className="theme-list" style={styles.themeList}>
              {themes.map(theme => (
                <li 
                  key={theme.id} 
                  style={{
                    ...styles.themeItem,
                    backgroundColor: currentTheme?.id === theme.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                    borderLeft: `5px solid ${theme.color || '#ccc'}`
                  }}
                  onClick={() => handleThemeClick(theme)}
                >
                  <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {theme.title}
                  </span>
                  <span style={styles.arrow}>▶</span>
                </li>
              ))}
            </ul>
            
            <div style={styles.userInfoArea}>
              {nickname ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span>Login: <strong>{nickname}</strong></span>
                  <span onClick={handleLogout} style={styles.logoutLink}>ログアウト</span>
                </div>
              ) : (
                <span onClick={onLoginClick} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  ログインしてください
                </span>
              )}
            </div>
          </>
        )}

        {/* スマホ表示時の簡易ヘッダー */}
        {isMobile && (
           <div style={{marginLeft: 'auto', fontSize: '0.8rem'}}>
              {nickname ? <span onClick={handleLogout}>LogOut</span> : <span onClick={onLoginClick}>Login</span>}
           </div>
        )}
      </div>

      <div className="app-main" style={dynamicStyles.main}>
        {currentTheme ? (
          <ThemeDetailView 
            theme={currentTheme} 
            selfScore={selfScore} 
            onOpinionClick={handleOpinionClick} 
            isMobile={isMobile} // スマホ判定を渡す
          />
        ) : (
          <ThemeListView themes={themes} onThemeClick={handleThemeClick} isMobile={isMobile} />
        )}
      </div>

      {selectedOpinion && (
        <div className="modal-overlay" style={styles.modalOverlay}>
          <div className="modal-content" style={styles.modal}>
            <h3 style={{color: selectedOpinion.color || '#333'}}>{selectedOpinion.title}</h3>
            
            <p style={{margin: '20px 0', lineHeight: '1.6'}}>{selectedOpinion.body}</p>
            
            {selectedOpinion.sourceUrl && (
              <div style={styles.sourceLinkArea}>
                <a 
                  href={selectedOpinion.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.sourceAnchor}
                >
                  出典: {selectedOpinion.sourceName || "関連リンク"} 🔗
                </a>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button style={styles.agreeButton} onClick={() => handleVote('agree')}>
                👍 賛成して議論する
              </button>
              <button style={styles.opposeButton} onClick={() => handleVote('oppose')}>
                👎 反対して議論する
              </button>
            </div>
            <button style={styles.closeButton} onClick={() => setSelectedOpinion(null)}>閉じる</button>
          </div>
        </div>
      )}

      {!isChatOpen && (
        <div style={styles.chatToggle} onClick={() => setIsChatOpen(true)}>◀</div>
      )}
      
      <ChatMode 
        isOpen={isChatOpen} 
        onClose={handleCloseChat} 
        currentTheme={currentTheme}
        currentOpinion={selectedOpinion} 
        initialMessage={startMessage} 
      />
    </div>
  );
};

// --- サブコンポーネント ---

const ThemeListView = ({ themes, onThemeClick, isMobile }) => (
  <div className="bubble-container" style={styles.bubbleContainer}>
    {themes.map((theme, index) => (
      <div
        key={theme.id}
        className="theme-bubble"
        style={{
          ...styles.themeBubble,
          backgroundColor: theme.color || '#ccc',
          left: `${20 + (index * 25)}%`,       
          top: `${30 + (index % 2 * 30)}%`,     
        }}
        onClick={() => onThemeClick(theme)}
      >
        {theme.title}
      </div>
    ))}
  </div>
);

// バブル位置計算 (スマホ対応版)
const useBubblePositions = (opinions, isMobile) => {
    return useMemo(() => {
        const positions = {};
        const sortedOpinions = [...opinions].sort((a, b) => (a.score || 0) - (b.score || 0));
        const Y_PATTERNS = [20, 60, 30, 70, 40]; 

        sortedOpinions.forEach((op, index) => {
            const score = op.score || 0;
            
            // スマホなら表示範囲を狭める (見切れ防止)
            const range = isMobile ? 70 : 90;
            const offset = isMobile ? 15 : 5;
            
            const left = ((score + 100) / 200) * range + offset;
            const top = Y_PATTERNS[index % Y_PATTERNS.length];
            
            positions[op.id] = { left: `${left}%`, top: `${top}%` };
        });

        return positions;
    }, [opinions, isMobile]); 
};

const ThemeDetailView = ({ theme, selfScore, onOpinionClick, isMobile }) => {
  const opinions = theme.opinions.slice(0, 5);
  const bubblePositions = useBubblePositions(opinions, isMobile);
  
  // 自分バブルの位置計算
  const range = isMobile ? 70 : 90;
  const offset = isMobile ? 15 : 5;
  const selfLeft = ((selfScore + 100) / 200) * range + offset;

  return (
    <div className="detail-container" style={styles.detailContainer}>
      <h2 style={{...styles.pageTitle, borderColor: theme.color}}>{theme.title}</h2>
      
      <div style={styles.bubblesArea}>
        {opinions.map((op) => {
          const pos = bubblePositions[op.id] || { top: '50%', left: '50%' };
          return (
            <div
              key={op.id}
              className="opinion-bubble"
              style={{
                ...styles.opinionBubble,
                left: pos.left,
                top: pos.top,
                backgroundColor: op.color || theme.color, 
                transition: 'all 0.5s ease-out',
                // スマホならバブルを少し小さく
                width: isMobile ? '110px' : '150px',
                height: isMobile ? '110px' : '150px',
                fontSize: isMobile ? '0.75rem' : '0.9rem',
              }}
              onClick={() => onOpinionClick(op)}
            >
              <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>{op.title}</div>
            </div>
          );
        })}
        
        {/* 自分バブル */}
        <div
          className="self-bubble"
          style={{
            ...styles.selfBubble,
            left: `${selfLeft}%`,
            top: '85%', 
            transition: 'left 0.5s ease-out', 
          }}
        >
          <span style={{fontSize: '0.8rem', display: 'block'}}>自分</span>
          <span style={{fontSize: '0.7rem'}}>{Math.round(selfScore)}</span>
        </div>
      </div>

      <div style={styles.axisContainer}>
        <div style={styles.axisLabelLeft}>
          <span style={{fontSize: '1.2rem', display: 'block'}}>反対</span>
          <span style={{fontSize: '0.8rem', opacity: 0.6}}>-100</span>
        </div>

        <div style={{...styles.axisLine, backgroundColor: '#ddd'}}>
            <div style={{ position: 'absolute', left: '50%', top: '-8px', width: '2px', height: '22px', backgroundColor: '#aaa' }}></div>
            <div style={{ position: 'absolute', left: '50%', top: '15px', transform: 'translateX(-50%)', fontSize: '0.7rem', color: '#999' }}>0</div>
        </div>

        <div style={styles.axisLabelRight}>
          <span style={{fontSize: '1.2rem', display: 'block'}}>賛成</span>
          <span style={{fontSize: '0.8rem', opacity: 0.6}}>+100</span>
        </div>
      </div>
    </div>
  );
};

// --- Styles ---
const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: '"Helvetica Neue", Arial, sans-serif', backgroundColor: '#f9f9f9' },
  sidebar: { width: '200px', backgroundColor: '#37474F', padding: '20px', color: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', zIndex: 10 },
  sidebarTitle: { marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '1px' },
  themeList: { listStyle: 'none', padding: 0, flex: 1, overflowY: 'auto' },
  themeItem: { padding: '12px 15px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '4px', fontSize: '0.95rem', transition: 'all 0.2s' },
  arrow: { fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.7 },
  userInfoArea: { marginTop: 'auto', padding: '15px', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' },
  logoutLink: { fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer', color: '#ddd' },
  main: { flex: 1, position: 'relative', backgroundColor: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bubbleContainer: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' },
  themeBubble: { position: 'absolute', width: '160px', height: '160px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 15px rgba(0,0,0,0.1)', transform: 'translate(-50%, -50%)', color: '#fff', fontSize: '1.2rem', padding: '10px', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.3)' },
  detailContainer: { padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' },
  pageTitle: { fontSize: '2.2rem', marginBottom: '20px', color: '#333', borderLeft: '8px solid #ccc', paddingLeft: '20px' },
  bubblesArea: { flex: 1, position: 'relative', marginBottom: '40px' },
  opinionBubble: { position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '15px', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.15)', transform: 'translate(-50%, -50%)', zIndex: 2, color: '#333', transition: 'transform 0.2s', fontWeight: 'bold' },
  selfBubble: { position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'white', border: '3px solid #333', color: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', transform: 'translate(-50%, -50%)', zIndex: 3, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
  axisContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px', width: '100%', padding: '0 20px' },
  axisLabelLeft: { fontWeight: 'bold', color: '#555', textAlign: 'center' },
  axisLabelRight: { fontWeight: 'bold', color: '#555', textAlign: 'center' },
  axisLine: { flex: 1, height: '6px', backgroundColor: '#eee', position: 'relative', margin: '0 20px', borderRadius: '3px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' },
  modal: { backgroundColor: 'white', padding: '50px', borderRadius: '15px', width: '600px', maxWidth: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
  
  sourceLinkArea: { margin: '10px 0 20px 0', textAlign: 'right' },
  sourceAnchor: { fontSize: '0.9rem', color: '#007bff', textDecoration: 'none', borderBottom: '1px solid #007bff' },

  buttonGroup: { display: 'flex', justifyContent: 'center', gap: '20px', margin: '30px 0' },
  agreeButton: { padding: '15px 40px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' },
  opposeButton: { padding: '15px 40px', backgroundColor: '#E53935', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' },
  closeButton: { padding: '10px 30px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '50px', cursor: 'pointer', color: '#666', fontWeight: 'bold' },
  chatToggle: { position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', width: '40px', height: '80px', backgroundColor: '#263238', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', zIndex: 999, fontSize: '1.2rem', boxShadow: '-2px 0 10px rgba(0,0,0,0.2)' }
};

export default Frontend;