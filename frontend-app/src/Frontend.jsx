import React, { useState, useEffect, useRef, useMemo } from 'react';
import dummyData from './dummyData.json';
import ChatMode from './ChatMode';
import HelpPage from './HelpPage';
import { fetchThemes, createThemeByAI, API_BASE_URL } from './api_client';

/**
 * 画面サイズを監視するカスタムフック
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
    isMobile: windowSize.width < 768 || windowSize.height < 500,
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 投票済み意見IDリストの管理
  const [votedOpinionIds, setVotedOpinionIds] = useState(() => {
    const stored = localStorage.getItem('votedOpinionIds');
    return stored ? JSON.parse(stored) : [];
  });

  const initializedRef = useRef(false);
  const { isMobile: isSmallScreen } = useWindowSize();

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
      localStorage.removeItem('votedOpinionIds');
      setNickname('');
      setVotedOpinionIds([]);
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

    // すでに投票済みならアラートを出して終了（念のための二重チェック）
    if (votedOpinionIds.includes(selectedOpinion.id)) {
      alert('この意見にはすでに投票済みです。');
      setSelectedOpinion(null);
      return;
    }

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

          const newVoted = [...votedOpinionIds, selectedOpinion.id];
          setVotedOpinionIds(newVoted);
          localStorage.setItem('votedOpinionIds', JSON.stringify(newVoted));
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

  return (
    <div className="app-container" style={{ ...styles.container, flexDirection: 'row' }}>
      <div className="app-sidebar" style={{
        ...styles.sidebar,
        width: isSmallScreen ? '200px' : '250px'
      }}>
        <h3 style={{
          ...styles.sidebarTitle,
          fontSize: isSmallScreen ? '1.2rem' : '1.5rem'
        }}>
          Kaleidoscope
        </h3>

        <h4
          style={{
            fontSize: isSmallScreen ? '0.9rem' : '1.2rem',
            marginBottom: '13px',
            opacity: 0.8,
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={() => setCurrentTheme(null)}
        >
          テーマ一覧
        </h4>

        {isGenerating && themes.length === 0 && (
          <div style={{ color: '#fff', padding: '10px', fontSize: '0.8rem' }}>AIが話題を生成中...</div>
        )}
        <ul className="theme-list" style={styles.themeList}>
          {themes.map(theme => (
            <li
              key={theme.id}
              style={{
                ...styles.themeItem,
                fontSize: isSmallScreen ? '1.8rem' : '1.2rem',
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

        <h4
          style={{
            fontSize: isSmallScreen ? '0.9rem' : '1.2rem',
            marginBottom: '13px',
            opacity: 0.8,
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={() => setIsHelpOpen(true)}
        >
          ヘルプ
        </h4>

        <div style={styles.userInfoArea}>
          {nickname ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ fontSize: isSmallScreen ? '0.85rem' : '1.0rem' }}>
                Login: <strong>{nickname}</strong>
              </span>
              <span onClick={handleLogout} style={{ ...styles.logoutLink, fontSize: isSmallScreen ? '0.75rem' : '0.8rem' }}>
                ログアウト
              </span>
            </div>
          ) : (
            <span onClick={onLoginClick} style={{ cursor: 'pointer', textDecoration: 'underline', fontSize: isSmallScreen ? '0.8rem' : '0.9rem' }}>
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
            isMobile={isSmallScreen}
            votedOpinionIds={votedOpinionIds}
          />
        ) : (
          <ThemeListView themes={themes} onThemeClick={handleThemeClick} isMobile={isSmallScreen} />
        )}
      </div>

      {selectedOpinion && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={() => setSelectedOpinion(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              ...styles.modalContent,
              width: isSmallScreen ? '80vw' : '500px',
              height: isSmallScreen ? '75vh' : 'auto',
              maxWidth: isSmallScreen ? '80vw' : '500px',
              maxHeight: isSmallScreen ? '75vh' : '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: isSmallScreen ? '20px' : '30px',
              margin: 'auto',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
              <h3 style={{
                color: '#333',
                borderLeft: `6px solid ${selectedOpinion.color || '#ccc'}`,
                paddingLeft: '12px',
                marginBottom: '15px',
                fontSize: isSmallScreen ? '1.1rem' : '1.5rem',
                lineHeight: '1.3'
              }}>
                {selectedOpinion.title}
              </h3>
              <p className="modal-body-text" style={{
                fontSize: isSmallScreen ? '0.9rem' : '1.2rem',
                lineHeight: '1.6',
                color: '#444'
              }}>
                {selectedOpinion.body}
              </p>
              {selectedOpinion.sourceUrl && (
                <div style={styles.sourceLinkArea}>
                  <a href={selectedOpinion.sourceUrl} target="_blank" rel="noopener noreferrer" style={styles.sourceAnchor}>
                    出典: {selectedOpinion.sourceName || "関連リンク"} 🔗
                  </a>
                </div>
              )}
            </div>

            {/* ★修正箇所: 投票済みかどうかの条件分岐を追加 */}
            <div style={{
              marginTop: '20px',
              display: 'flex',
              flexDirection: isSmallScreen ? (window.innerHeight < 500 ? 'row' : 'column') : 'row',
              gap: '12px',
              flexShrink: 0
            }}>
              {votedOpinionIds.includes(selectedOpinion.id) ? (
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#f0f0f0',
                  color: '#888',
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  回答済みです
                </div>
              ) : (
                <>
                  <button
                    style={{ ...styles.agreeButton, flex: 1, padding: isSmallScreen ? '10px' : '12px 25px' }}
                    onClick={() => handleVote('agree')}
                  >
                    👍 賛成して議論
                  </button>
                  <button
                    style={{ ...styles.opposeButton, flex: 1, padding: isSmallScreen ? '10px' : '12px 25px' }}
                    onClick={() => handleVote('oppose')}
                  >
                    👎 反対して議論
                  </button>
                </>
              )}
            </div>
            <button
              style={{ ...styles.closeButton, marginTop: '10px' }}
              onClick={() => setSelectedOpinion(null)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3500,
          }}
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              width: isSmallScreen ? '75vw' : '800px',
              maxHeight: '85vh',
              borderRadius: '12px',
              padding: isSmallScreen ? '10px' : '40px',
              position: 'relative',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              color: '#333'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsHelpOpen(false)}
              style={{
                position: 'absolute',
                top: isSmallScreen ? '10px' : '20px',
                right: isSmallScreen ? '10px' : '20px',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>
            <HelpPage />
          </div>
        </div>
      )}

      {!isChatOpen && <div style={styles.chatToggle} onClick={() => setIsChatOpen(true)}>◀</div>}
      <ChatMode isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); setStartMessage(null); }} currentTheme={currentTheme} currentOpinion={selectedOpinion} initialMessage={startMessage} isMobile={isSmallScreen} />
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
          width: isMobile ? '120px' : '220px',
          height: isMobile ? '120px' : '220px',
          fontSize: isMobile ? '0.9rem' : '2.1rem',
        }}
        onClick={() => onThemeClick(theme)}
      >
        {theme.title}
      </div>
    ))}
  </div>
);

const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(200, 200, 200, ${alpha})`;
  let c = hex.substring(1).split('');
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  c = '0x' + c.join('');
  return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
};

const ThemeDetailView = ({ theme, selfScore, onOpinionClick, isMobile, votedOpinionIds = [] }) => {
  const opinions = theme.opinions.slice(0, 10);
  const BAR_RANGE = 88;
  const OFFSET_LEFT = 6;

  const bubblePositions = useMemo(() => {
    const positions = {};
    const colorPatterns = { group0: [21, 51, 81], group1: [15, 45, 70] };
    const uniqueColors = Array.from(new Set(opinions.map(op => op.color || theme.color)));
    const colorCounters = {};

    const placedPositions = [];

    opinions.forEach((op) => {
      const color = op.color || theme.color;
      const colorIndex = uniqueColors.indexOf(color);
      const groupKey = `group${colorIndex % 2}`;
      if (colorCounters[groupKey] === undefined) colorCounters[groupKey] = 0;

      const count = colorCounters[groupKey];
      const pattern = colorPatterns[groupKey];

      // 1. 初期座標の計算
      let topValue = pattern[count % pattern.length];
      const limitedOpScore = Math.max(-100, Math.min(100, op.score));
      const leftValue = ((limitedOpScore + 100) / 200) * BAR_RANGE + OFFSET_LEFT;

      // ★修正箇所: 中央付近かつ「上半分」にある場合のみ、トピック名回避のため初期値を下げる
      // 画面上部が0%のため、topValue < 50 が上半分に相当します
      if (Math.abs(limitedOpScore) < 30 && topValue < 50) {
        topValue += 15;
      }

      const isOverlapping = (l, t) => {
        return placedPositions.some(pos =>
          Math.abs(pos.left - l) < 15 && Math.abs(pos.top - t) < 15
        );
      };

      // 2. 重なり回避
      // 各ステップで50回ずつ試行合計150回の探索
      const jumpSteps = [37, 23, 17];
      let safetyCounter = 0;
      let foundSpace = !isOverlapping(leftValue, topValue);

      if (!foundSpace) {
        for (const step of jumpSteps) {
          for (let i = 0; i < 50; i++) {
            safetyCounter++;
            topValue = (topValue + step) % 100;

            // 見切れ防止（15%〜85%の範囲に収める）
            if (topValue < 15) topValue += 10;
            if (topValue > 85) topValue -= 10;

            if (!isOverlapping(leftValue, topValue)) {
              foundSpace = true;
              break;
            }
          }
          if (foundSpace) break;
        }
      }

      // 諦め
      if (!foundSpace) {
        console.warn(`[Kaleidoscope] 重なりが解消できませんでした。諦めます。対象意見: ${op.title}`);
      }

      // 3. 最終位置の確定
      positions[op.id] = { left: `${leftValue}%`, top: `${topValue}%` };
      placedPositions.push({ left: leftValue, top: topValue });
      colorCounters[groupKey]++;
    });
    return positions;
  }, [opinions, theme.color, BAR_RANGE, OFFSET_LEFT]);

  const limitedScore = Math.max(-100, Math.min(100, selfScore));
  const selfLeft = ((limitedScore + 100) / 200) * BAR_RANGE + OFFSET_LEFT;

  return (
    <div className="detail-container" style={{
      ...styles.detailContainer,
      paddingBottom: isMobile ? '0px' : styles.detailContainer.paddingBottom
    }}>
      <h2 className="theme-detail-title" style={{ ...styles.pageTitle, borderColor: theme.color }}>{theme.title}</h2>

      <div style={styles.bubblesArea}>
        {opinions.map((op) => {
          const pos = bubblePositions[op.id] || { top: '50%', left: '50%' };
          const baseColor = op.color || theme.color;
          const isVoted = votedOpinionIds.includes(op.id);
          return (
            <div
              key={op.id}
              className="opinion-bubble"
              style={{
                ...styles.opinionBubble,
                left: pos.left,
                top: pos.top,
                backgroundColor: hexToRgba(baseColor, isVoted ? 0.15 : 0.4),
                border: `1px solid ${baseColor}`,
                width: isMobile ? '100px' : '200px',
                height: isMobile ? '60px' : '130px',
                fontSize: isMobile ? '0.75rem' : '1.15rem',
                opacity: isVoted ? 0.6 : 1,
                cursor: 'pointer'
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
            top: isMobile ? '118%' : '103%',
            width: isMobile ? '50px' : '65px',
            height: isMobile ? '50px' : '65px',
            border: isMobile ? '1px solid #333' : '3px solid #333',
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: isMobile ? '0.6rem' : '0.8rem', display: 'block' }}>自分</span>
          <span style={{ fontSize: isMobile ? '0.8rem' : '1.2rem' }}>{Math.round(selfScore)}</span>
        </div>
      </div>

      <div className="axis-container" style={{
        ...styles.axisContainer,
        transform: isMobile ? 'translateY(12px)' : 'none',
        padding: 0
      }}>
        <div style={{ ...styles.axisLabelLeft, width: `${OFFSET_LEFT}%` }}>
          <span className="axis-text" style={{ fontSize: isMobile ? '0.8rem' : '1.2rem' }}>反対</span>
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', opacity: 0.6, display: 'block' }}>-100</span>
        </div>

        <div style={styles.axisLine}>
          <div style={{ position: 'absolute', left: '50%', top: '-8px', width: '2px', height: '22px', backgroundColor: '#aaa' }}></div>
        </div>

        <div style={{ ...styles.axisLabelRight, width: `${OFFSET_LEFT}%` }}>
          <span className="axis-text" style={{ fontSize: isMobile ? '0.8rem' : '1.2rem' }}>賛成</span>
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', opacity: 0.6, display: 'block' }}>+100</span>
        </div>
      </div>
    </div>
  );
};

// --- Styles ---
const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: '"Helvetica Neue", Arial, sans-serif', backgroundColor: '#f9f9f9', overflow: 'hidden' },
  sidebar: { backgroundColor: '#37474F', padding: '25px', color: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', zIndex: 10, flexShrink: 0 },
  sidebarTitle: { marginBottom: '25px', fontWeight: 'bold', letterSpacing: '1px' },
  clickableMenu: { opacity: 0.8, cursor: 'pointer', textDecoration: 'underline', marginBottom: '13px' },
  themeList: { listStyle: 'none', padding: 0, flex: 1, overflowY: 'auto' },
  themeItem: { padding: '12px 15px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '4px', transition: 'all 0.2s' },
  arrow: { fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.7 },
  userInfoArea: { marginTop: 'auto', padding: '15px', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', textAlign: 'center' },
  logoutLink: { textDecoration: 'underline', cursor: 'pointer', color: '#ddd' },
  main: { flex: 1, position: 'relative', backgroundColor: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bubbleContainer: { position: 'relative', width: '100%', height: '100%' },
  themeBubble: { position: 'absolute', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 15px rgba(0,0,0,0.1)', transform: 'translate(-50%, -50%)', color: '#fff', textAlign: 'center' },
  detailContainer: { padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' },
  pageTitle: { fontSize: '2.2rem', marginBottom: '20px', color: '#333', borderLeft: '10px solid #ccc', paddingLeft: '20px' },
  bubblesArea: { flex: 1, position: 'relative', marginBottom: '30px' },
  opinionBubble: { position: 'absolute', borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '15px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.15)', transform: 'translate(-50%, -50%)', zIndex: 2, color: '#333', fontWeight: 'bold' },
  selfBubble: { position: 'absolute', borderRadius: '50%', backgroundColor: 'white', color: '#333', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', transform: 'translate(-50%, -50%)', zIndex: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.3)', transition: 'left 0.5s ease-out' },
  axisContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70px', width: '100%', padding: '0' },
  axisLabelLeft: { fontWeight: 'bold', color: '#555', textAlign: 'right', paddingRight: '15px', flexShrink: 0 },
  axisLabelRight: { fontWeight: 'bold', color: '#555', textAlign: 'left', paddingLeft: '15px', flexShrink: 0 },
  axisLine: { flex: 1, height: '4px', backgroundColor: '#eee', position: 'relative', borderRadius: '2px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', position: 'relative' },
  modalTitle: { color: '#333', borderLeft: '6px solid #ccc', paddingLeft: '12px', marginBottom: '15px' },
  modalButtons: { display: 'flex', gap: '15px', marginTop: '20px' },
  agreeButton: { flex: 1, padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' },
  opposeButton: { flex: 1, padding: '12px', backgroundColor: '#E53935', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' },
  closeButton: { marginTop: '15px', padding: '8px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '50px', cursor: 'pointer' },
  modalCloseX: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
  chatToggle: { position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', width: '35px', height: '70px', backgroundColor: '#263238', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', zIndex: 999 },
};

export default Frontend;