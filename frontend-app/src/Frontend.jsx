import React, { useState, useEffect } from 'react';
import dummyData from './dummyData.json';
import { calculateNewScore } from './dummy_backend';
import ChatMode from './ChatMode';

const Frontend = () => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [selfScore, setSelfScore] = useState(0);
  const [selectedOpinion, setSelectedOpinion] = useState(null);
  const [themes, setThemes] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // setThemes(dummyData.themes); UNCOMMENT TO USE DUMMY DATA
      fetch("/api/themes")
      .then(r => r.json())
      .then(json => setData(json.themes))
      .catch(console.error);
  }, []);

  const handleThemeClick = (theme) => {
    setCurrentTheme(theme);
    setSelfScore(0); // Reset self score when changing theme
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

      {/* Modal */}
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

      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <div 
          style={styles.chatToggle} 
          onClick={() => setIsChatOpen(true)}
        >
          ◀
        </div>
      )}

      {/* Chat Mode */}
      <ChatMode isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

const ThemeListView = ({ themes, onThemeClick }) => {
  return (
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
};

const ThemeDetailView = ({ theme, selfScore, onOpinionClick }) => {
  return (
    <div style={styles.detailContainer}>
      <h2 style={styles.pageTitle}>{theme.title}</h2>
      
      <div style={styles.bubblesArea}>
        {/* Opinion Bubbles */}
        {theme.opinions.map((op, index) => {
          // Map score -100 to 100 -> 0% to 100%
          const leftPos = ((op.score + 100) / 200) * 100;
          // Stagger top positions
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

        {/* Self Bubble */}
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

      {/* Axis */}
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
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
    backgroundColor: '#f0f2f5',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#7986CB', // Blue-ish
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
    transition: 'background-color 0.2s',
  },
  arrow: {
    fontWeight: 'bold',
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
  bubbleContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  themeBubble: {
    position: 'absolute',
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#333',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
    transform: 'translate(-50%, -50%)',
  },
  detailContainer: {
    padding: '20px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  pageTitle: {
    marginBottom: '10px',
    fontSize: '1.5rem',
  },
  bubblesArea: {
    flex: 1,
    position: 'relative',
    marginBottom: '60px', // Space for axis
  },
  opinionBubble: {
    position: 'absolute',
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '10px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    transform: 'translate(-50%, -50%)',
    zIndex: 2,
    color: '#333',
  },
  selfBubble: {
    position: 'absolute',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'white',
    border: '2px solid #d32f2f',
    color: '#d32f2f',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    transform: 'translate(-50%, -50%)',
    zIndex: 3,
    transition: 'left 0.5s ease-in-out',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  axisContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: '60px',
    width: '100%',
    boxSizing: 'border-box',
  },
  axisLabelLeft: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    marginRight: '10px',
  },
  axisLabelRight: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    marginLeft: '10px',
  },
  axisLine: {
    flex: 1,
    height: '4px',
    backgroundColor: '#1a237e',
    position: 'relative',
  },
  axisArrowLeft: {
    position: 'absolute',
    left: '-8px',
    top: '-10px',
    color: '#1a237e',
    fontSize: '1.5rem',
  },
  axisArrowRight: {
    position: 'absolute',
    right: '-8px',
    top: '-10px',
    color: '#1a237e',
    fontSize: '1.5rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    width: '400px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '20px',
    marginBottom: '20px',
  },
  agreeButton: {
    padding: '10px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  opposeButton: {
    padding: '10px 30px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  closeButton: {
    padding: '5px 15px',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  chatToggle: {
    position: 'fixed',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '30px',
    height: '60px',
    backgroundColor: '#6c757d',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderTopLeftRadius: '10px',
    borderBottomLeftRadius: '10px',
    zIndex: 999,
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
    fontSize: '1.2rem',
    userSelect: 'none',
  }
};

export default Frontend;
