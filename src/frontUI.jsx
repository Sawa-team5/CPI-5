import React, { useState, useEffect } from 'react';

const KaleidoscopeView = () => {
  const [allTopics, setAllTopics] = useState([]); // 全トピックデータ
  const [currentTopic, setCurrentTopic] = useState(null); // 現在表示中のトピック詳細
  const [userScore, setUserScore] = useState(50);
  const [selectedTopicId, setSelectedTopicId] = useState('tax_usage');

  useEffect(() => {
    // info.json を fetch で取得
    fetch('/info.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(jsonData => {
        // JSON構造: { topics: [...] }
        if (jsonData.topics && jsonData.topics.length > 0) {
          setAllTopics(jsonData.topics);
          
          // 初期表示: tax_usage または 最初のトピック
          const initialTopic = jsonData.topics.find(t => t.id === 'tax_usage') || jsonData.topics[0];
          setCurrentTopic(initialTopic);
          setUserScore(initialTopic.user_position_score);
          setSelectedTopicId(initialTopic.id);
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  // トピック切り替え時の処理
  const handleTopicSelect = (topicId) => {
    setSelectedTopicId(topicId);
    const topic = allTopics.find(t => t.id === topicId);
    if (topic) {
      setCurrentTopic(topic);
      setUserScore(topic.user_position_score);
    }
  };

  const handleEmpathy = (targetScore, clusterName) => {
    const newScore = (userScore + targetScore) / 2;
    setUserScore(newScore);
    alert(`「${clusterName}」に共感しました。\nあなたの立ち位置が ${Math.round(newScore)} に移動しました。`);
  };

  if (!currentTopic) return <div className="p-10">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* --- 左サイドバー：テーマ一覧 (JSONから生成) --- */}
      <div className="w-64 bg-slate-700 text-white flex flex-col shadow-lg z-20">
        <div className="p-4 bg-slate-800 font-bold text-lg border-b border-slate-600">
          テーマ一覧
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {allTopics.map((topic) => (
            <div key={topic.id}>
              <button
                onClick={() => handleTopicSelect(topic.id)}
                className={`w-full text-left px-4 py-3 flex justify-between items-center hover:bg-slate-600 transition-colors ${
                  selectedTopicId === topic.id ? 'bg-slate-600 border-l-4 border-blue-400' : ''
                }`}
              >
                <span>{topic.title}</span>
                <span className="text-slate-400">▶</span>
              </button>
              
              {/* サブアイテムの展開（選択中かつサブアイテムがある場合） */}
              {selectedTopicId === topic.id && topic.subItems && topic.subItems.length > 0 && (
                <div className="bg-slate-800 py-2">
                  {topic.subItems.map((item, idx) => (
                    <div key={idx} className="px-8 py-1 text-sm text-slate-300 hover:text-white cursor-pointer hover:bg-slate-700">
                      • {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- メインエリア：意見マップ --- */}
      <div className="flex-1 relative bg-white overflow-hidden">
        <h2 className="absolute top-6 left-8 text-2xl font-bold text-gray-700 z-10">
          議題: {currentTopic.title}
        </h2>
        
        {/* 軸線 */}
        <div className="absolute top-1/2 left-20 right-20 h-1 bg-gray-300 transform -translate-y-1/2">
          <div className="absolute -top-6 left-0 text-gray-400 text-sm">Left</div>
          <div className="absolute -top-6 right-0 text-gray-400 text-sm">Right</div>
        </div>
        
        {/* 自分の位置 */}
        <div 
          className="absolute top-1/2 w-8 h-8 bg-white rounded-full border-2 border-red-500 shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-all duration-500 z-20 flex items-center justify-center"
          style={{ left: `${userScore}%` }}
        >
          <span className="text-red-500 font-bold text-xs">自分</span>
        </div>

        {/* 意見の表示 */}
        {currentTopic.opinions && currentTopic.opinions.map((op) => (
          <div
            key={op.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
            style={{ left: `${op.position_score}%`, top: `${30 + (op.id * 15)}%` }} 
          >
            <button
              onClick={() => handleEmpathy(op.position_score, op.cluster_name)}
              className={`w-24 h-24 rounded-full ${op.color} text-white text-sm font-bold shadow-md hover:scale-110 transition-transform flex items-center justify-center p-2 text-center z-10 opacity-90 hover:opacity-100`}
            >
              {op.cluster_name}
            </button>
            
            {/* ホバー時に詳細を表示 */}
            <div className="absolute top-28 w-72 bg-white p-4 rounded-lg shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none text-left">
              <p className="text-sm text-gray-700 mb-2 font-medium">{op.summary}</p>
              {op.articles && op.articles.length > 0 && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  参考: {op.articles[0].title}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KaleidoscopeView;
