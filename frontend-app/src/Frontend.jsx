import React, { useState, useEffect, useRef, useMemo } from 'react';
import dummyData from './dummyData.json';
import ChatMode from './ChatMode';
import { fetchThemes, createThemeByAI, API_BASE_URL } from './api_client';

/**
 * 画面サイズを監視するカスタムフック
 * レイアウト判定用とサイズ計算用のフラグを分離して提供
 */
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile: windowSize.width < 768, // バブルサイズ等の計算用
  };
};

const Frontend = ({ onLoginClick }) => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [selfScore, setSelfScore] = useState(0);
  const [selectedOpinion, setSelectedOpinion] = useState(null);
  const [themes, setThemes] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [startMessage, setStartMessage] = useState(null);

  const initializedRef = useRef(false);

  // 画面サイズの取得
  const { isMobile: isSmallScreen } = useWindowSize();

  // ★変更: レイアウト分岐用フラグは常にfalseにしてPCレイアウトを強制
  const isMobileLayout = false;

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
          const politicalTopics = ["移民受け入れ拡大", "防衛費の増額", "夫婦別姓制度", "原発の再稼働", "ベーシックインカム", "憲法改正"];
          const selectedTopics = politicalTopics.sort(() => 0.5 - Math.random()).slice(0, 3);

          const promises = selectedTopics.map(async (topic) => {
            try {
              const res = await createThemeByAI(topic);
              if (res.themes && res.themes[0]) {
                setThemes((prev) => [...prev, res.themes[0]]);
              }
            } catch (err) { console.error(`生成失敗: ${topic}`, err); }
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
        } else { setSelfScore(0); }
      } catch (e) { setSelfScore(0); }
    } else { setSelfScore(0); }
  };

  const handleVote = async (type) => {
    if (!selectedOpinion) return;
    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        const res = await fetch(`${API_BASE_URL}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-ID': userId },
          body: JSON.stringify({
            opinionId: selectedOpinion.id,
            voteType: type,
            themeId: currentTheme.id
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSelfScore(data.newScore);
        }
      } catch (e) { console.error("Vote failed", e); }
    }

    const msgText = type === 'agree'
      ? `「${selectedOpinion.title}」という意見に賛成です。`
      : `「${selectedOpinion.title}」という意見には反対です。懸念点があります。`;

    setStartMessage({ text: msgText, id: Date.now() });
    setSelectedOpinion(null);
    setIsChatOpen(true);
  };

  // PCレイアウトを基本とするスタイル設定
  const containerStyle = { ...styles.container, flexDirection: 'row' };
  const sidebarStyle = { ...styles.sidebar };

  return (
    <div className="app-container" style={containerStyle}>
      {/* サイドバー: PCレイアウトとして常に表示 */}
      <div className="app-sidebar" style={sidebarStyle}>
        <h3 style={styles.sidebarTitle}>Kaleidoscope</h3>

        <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', opacity: 0.8 }}>テーマ一覧</h4>
        {isGenerating && themes.length === 0 && (
          <div style={{ color: '#fff', padding: '10px', fontSize: '0.8rem' }}>AIが話題を生成中...</div>
        )}

        <ul className="theme-list" style={styles.themeList}>
          {themes.map(theme => (
            <li
              key={theme.id}
              style={{
                ...styles.themeItem,
                backgroundColor: currentTheme?.id === theme.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                borderLeft: `5px solid ${theme.color || '#ccc'}`
              }}
              onClick={() => handleThemeClick(theme)}
            >
              <span className="theme-title-text">{theme.title}</span>
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
              ログイン / ユーザー切替
            </span>
          )}
        </div>
      </div>

      <div className="app-main" style={styles.main}>
        {currentTheme ? (
          <ThemeDetailView
            theme={currentTheme}
            selfScore={selfScore}
            onOpinionClick={(op) => setSelectedOpinion(op)}
            isMobile={isSmallScreen} // バブルサイズの調整に使用
          />
        ) : (
          <ThemeListView
            themes={themes}
            onThemeClick={handleThemeClick}
            isMobile={isSmallScreen}
          />
        )}
      </div>

      {/* モーダル表示 */}
      {selectedOpinion && (
        <div className="modal-overlay" onClick={() => setSelectedOpinion(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              color: '#333',
              borderLeft: `6px solid ${selectedOpinion.color || '#ccc'}`,
              paddingLeft: '12px',
              marginBottom: '15px'
            }}>{selectedOpinion.title}</h3>
            <p className="modal-body-text">{selectedOpinion.body}</p>

            {selectedOpinion.sourceUrl && (
              <div style={styles.sourceLinkArea}>
                <a href={selectedOpinion.sourceUrl} target="_blank" rel="noopener noreferrer" style={styles.sourceAnchor}>
                  出典: {selectedOpinion.sourceName || "関連リンク"} 🔗
                </a>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button style={styles.agreeButton} onClick={() => handleVote('agree')}>👍 賛成して議論</button>
              <button style={styles.opposeButton} onClick={() => handleVote('oppose')}>👎 反対して議論</button>
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
        onClose={() => { setIsChatOpen(false); setStartMessage(null); }}
        currentTheme={currentTheme}
        currentOpinion={selectedOpinion}
        initialMessage={startMessage}
        isMobile={isSmallScreen}
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
          width: isMobile ? '120px' : '160px',
          height: isMobile ? '120px' : '160px',
          fontSize: isMobile ? '0.9rem' : '1.2rem',
        }}
        onClick={() => onThemeClick(theme)}
      >
        {theme.title}
      </div>
    ))}
  </div>
);

// ★追加: カラーコード(HEX)をRGBAに変換して透明度を付与する関数
// これで、バブルが重なったときに薄く透けて見えるようになる
const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(200, 200, 200, ${alpha})`;
  let c = hex;
  // #RGB または #RRGGBB 形式に対応
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(c)) {
    c = c.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
  }
  return hex;
};

const ThemeDetailView = ({ theme, selfScore, onOpinionClick, isMobile }) => {
  const opinions = theme.opinions.slice(0, 10); // 表示件数を考慮

  const bubblePositions = useMemo(() => {
    const positions = {};

    // 1. 色ごとの縦位置リストを定義 (3グループ想定)
    // グループごとの「高さの帯」を分けるイメージです
    const colorPatterns = {
      group0: [25, 55, 85], // 1つ目の色のy軸位置パターン
      group1: [14, 40, 70], // 2つ目の色のy軸位置パターン
    };

    // 色をグループ（0, 1, 2）に割り当てるためのマップ
    const uniqueColors = Array.from(new Set(opinions.map(op => op.color || theme.color)));

    // 各グループで何番目のバブルかを表示するためのカウンター
    const colorCounters = {};

    opinions.forEach((op) => {
      const color = op.color || theme.color;

      // この色が uniqueColors の何番目か（0, 1, 2）を確認
      const colorIndex = uniqueColors.indexOf(color);
      const groupKey = `group${colorIndex % 2}`; // 2つ以上の色があっても0-1に丸める

      // このグループで何回目の登場かをカウント
      if (colorCounters[groupKey] === undefined) colorCounters[groupKey] = 0;
      const count = colorCounters[groupKey];

      // パターンリストから縦位置を取得（リスト末尾を超えたらループ）
      const pattern = colorPatterns[groupKey];
      const topValue = pattern[count % pattern.length];

      // 横位置（スコアベース）
      const range = isMobile ? 64 : 84;
      const offset = isMobile ? 18 : 8;
      const left = ((op.score + 100) / 200) * range + offset;

      positions[op.id] = {
        left: `${left}%`,
        top: `${topValue}%`
      };

      // 次の同じ色のバブルのためにカウントアップ
      colorCounters[groupKey]++;
    });

    return positions;
  }, [opinions, isMobile, theme.color]);

  // --- 以下、レンダリング部分は元のコードを維持 ---
  const range = isMobile ? 65 : 85;
  const offset = isMobile ? 18 : 8;
  const selfLeft = ((selfScore + 100) / 200) * range + offset;

  return (
    <div className="detail-container" style={styles.detailContainer}>
      <h2 className="theme-detail-title" style={{ ...styles.pageTitle, borderColor: theme.color }}>{theme.title}</h2>

      <div style={styles.bubblesArea}>
        {opinions.map((op) => {
          const pos = bubblePositions[op.id] || { top: '50%', left: '50%' };
          const baseColor = op.color || theme.color;
          return (
            <div
              key={op.id}
              className="opinion-bubble"
              style={{
                ...styles.opinionBubble,
                left: pos.left,
                top: pos.top,
                backgroundColor: hexToRgba(baseColor, 0.4),
                border: `1px solid ${baseColor}`,
                width: isMobile ? '105px' : '150px',
                height: isMobile ? '65px' : '80px',
                fontSize: isMobile ? '0.75rem' : '0.9rem',
              }}
              onClick={() => onOpinionClick(op)}
            >
              <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>{op.title}</div>
            </div>
          );
        })}

        <div
          className="self-bubble"
          style={{
            ...styles.selfBubble,
            left: `${selfLeft}%`,
            top: '95%',
            width: isMobile ? '60px' : '80px',
            height: isMobile ? '60px' : '80px',
          }}
        >
          <span style={{ fontSize: '0.7rem', display: 'block' }}>自分</span>
          <span style={{ fontSize: '0.8rem' }}>{Math.round(selfScore)}</span>
        </div>
      </div>

      <div className="axis-container" style={styles.axisContainer}>
        <div style={styles.axisLabelLeft}>
          <span className="axis-text">反対</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>-100</span>
        </div>
        <div style={styles.axisLine}>
          <div style={{ position: 'absolute', left: '50%', top: '-8px', width: '2px', height: '22px', backgroundColor: '#aaa' }}></div>
        </div>
        <div style={styles.axisLabelRight}>
          <span className="axis-text">賛成</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>+100</span>
        </div>
      </div>
    </div>
  );
};

// --- Styles ---
const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: '"Helvetica Neue", Arial, sans-serif', backgroundColor: '#f9f9f9', overflow: 'hidden' },
  sidebar: { width: '200px', backgroundColor: '#37474F', padding: '20px', color: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', zIndex: 10, flexShrink: 0 },
  sidebarTitle: { marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '1px' },
  themeList: { listStyle: 'none', padding: 0, flex: 1, overflowY: 'auto' },
  themeItem: { padding: '12px 15px', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '4px', fontSize: '0.9rem', transition: 'all 0.2s' },
  arrow: { fontWeight: 'bold', fontSize: '0.7rem', opacity: 0.7 },
  userInfoArea: { marginTop: 'auto', padding: '15px', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center' },
  logoutLink: { fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', color: '#ddd' },
  main: { flex: 1, position: 'relative', backgroundColor: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bubbleContainer: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' },
  themeBubble: { position: 'absolute', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 15px rgba(0,0,0,0.1)', transform: 'translate(-50%, -50%)', color: '#fff', padding: '15px', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.3)' },
  detailContainer: { padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' },
  pageTitle: { fontSize: '1.8rem', marginBottom: '15px', color: '#333', borderLeft: '8px solid #ccc', paddingLeft: '15px' },
  bubblesArea: { flex: 1, position: 'relative', marginBottom: '30px' },
  opinionBubble: { position: 'absolute', borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '10px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.15)', transform: 'translate(-50%, -50%)', zIndex: 2, color: '#333', fontWeight: 'bold' },
  selfBubble: { position: 'absolute', borderRadius: '50%', backgroundColor: 'white', border: '3px solid #333', color: '#333', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', transform: 'translate(-50%, -50%)', zIndex: 3, boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'left 0.5s ease-out' },
  axisContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', width: '100%', padding: '0 10px' },
  axisLabelLeft: { fontWeight: 'bold', color: '#555', textAlign: 'center' },
  axisLabelRight: { fontWeight: 'bold', color: '#555', textAlign: 'center' },
  axisLine: { flex: 1, height: '4px', backgroundColor: '#eee', position: 'relative', margin: '0 15px', borderRadius: '2px' },
  sourceLinkArea: { margin: '10px 0', textAlign: 'right' },
  sourceAnchor: { fontSize: '0.8rem', color: '#007bff', textDecoration: 'none' },
  buttonGroup: { display: 'flex', justifyContent: 'center', gap: '15px', margin: '20px 0' },
  agreeButton: { padding: '12px 25px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' },
  opposeButton: { padding: '12px 25px', backgroundColor: '#E53935', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' },
  closeButton: { padding: '8px 20px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '50px', cursor: 'pointer', color: '#666' },
  chatToggle: { position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', width: '30px', height: '60px', backgroundColor: '#263238', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', zIndex: 999 }
};

export default Frontend;