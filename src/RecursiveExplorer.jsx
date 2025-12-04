import React, { useState, useMemo } from 'react';
import { sampleData } from './sampleData';

// ============================================
// メインコンポーネント
// ============================================

const RecursiveExplorer = () => {
  const [currentPath, setCurrentPath] = useState(['root']);
  
  // 現在のノードを取得
  const currentNode = useMemo(() => {
    let node = sampleData;
    for (let i = 1; i < currentPath.length; i++) {
      const childId = currentPath[i];
      if (node.type === 'category') {
        node = node.children.find(child => child.id === childId);
        if (!node) return sampleData;
      }
    }
    return node;
  }, [currentPath]);

  // パンくずリスト生成
  const breadcrumbs = useMemo(() => {
    const crumbs = [];
    let node = sampleData;
    crumbs.push({ id: 'root', title: node.title });
    
    for (let i = 1; i < currentPath.length; i++) {
      const childId = currentPath[i];
      if (node.type === 'category') {
        node = node.children.find(child => child.id === childId);
        if (node) {
          crumbs.push({ id: node.id, title: node.title });
        }
      }
    }
    return crumbs;
  }, [currentPath]);

  const navigateToNode = (nodeId) => {
    setCurrentPath([...currentPath, nodeId]);
  };

  const navigateToBreadcrumb = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左サイドバー */}
      <aside className="w-64 bg-slate-800 text-white shadow-lg flex flex-col">
        <div className="p-4 bg-slate-900 font-bold text-lg border-b border-slate-700">
          階層マップ
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={navigateToBreadcrumb} />
        </div>
      </aside>

      {/* メインビュー */}
      <main className="flex-1 overflow-hidden">
        {currentNode.type === 'category' ? (
          <CategoryView
            key={currentNode.id}
            node={currentNode}
            onNavigate={navigateToNode}
          />
        ) : (
          <TopicView
            key={currentNode.id}
            node={currentNode}
          />
        )}
      </main>
    </div>
  );
};

// ============================================
// パンくずリストコンポーネント
// ============================================

const Breadcrumbs = ({ breadcrumbs, onNavigate }) => {
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 mb-3">現在の位置</div>
      {breadcrumbs.map((crumb, index) => (
        <button
          key={crumb.id}
          onClick={() => onNavigate(index)}
          className={`block w-full text-left px-3 py-2 rounded transition-colors ${
            index === breadcrumbs.length - 1
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-700'
          }`}
          style={{ paddingLeft: `${(index + 1) * 12}px` }}
        >
          {index === breadcrumbs.length - 1 ? '▶ ' : ''}
          {crumb.title}
        </button>
      ))}
    </div>
  );
};

// ============================================
// カテゴリビュー（ドリルダウン）
// ============================================

const CategoryView = ({ node, onNavigate }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800">{node.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          サブテーマを選択して掘り下げてください
        </p>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {node.children.map((child) => (
            <BubbleCard
              key={child.id}
              node={child}
              onClick={() => onNavigate(child.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// バブルカード
// ============================================

const BubbleCard = ({ node, onClick }) => {
  const isCategory = node.type === 'category';
  const icon = isCategory ? '📁' : '💬';
  const subtitle = isCategory 
    ? `${node.children?.length || 0} 項目` 
    : `${node.opinions?.length || 0} 意見`;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all hover:scale-105 hover:-translate-y-1 active:scale-95 p-6 text-left border-2 border-transparent hover:border-blue-400"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{node.title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
      {isCategory && (
        <div className="mt-4 text-blue-600 text-sm font-medium flex items-center">
          さらに掘り下げる
          <span className="ml-1">→</span>
        </div>
      )}
    </button>
  );
};

// ============================================
// トピックビュー（意見軸表示）
// ============================================

const TopicView = ({ node }) => {
  const [selectedOpinion, setSelectedOpinion] = useState(null);
  const [userStance, setUserStance] = useState(0.0); // ユーザーの立場
  const [readOpinions, setReadOpinions] = useState(new Set()); // 既読の意見ID

  // 賛成/反対ボタンのハンドラー
  const handleAgree = (opinionId, opinionStance) => {
    if (readOpinions.has(opinionId)) return;
    
    // 自分の立場を意見の方向に寄せる（重み付き平均）
    const newStance = (userStance * 2 + opinionStance) / 3;
    setUserStance(newStance);
    setReadOpinions(new Set([...readOpinions, opinionId]));
  };

  const handleDisagree = (opinionId, opinionStance) => {
    if (readOpinions.has(opinionId)) return;
    
    // 自分の立場を意見の反対方向に寄せる
    const oppositeStance = -opinionStance;
    const newStance = (userStance * 2 + oppositeStance) / 3;
    setUserStance(newStance);
    setReadOpinions(new Set([...readOpinions, opinionId]));
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 shadow-lg">
        <h1 className="text-3xl font-bold">{node.title}</h1>
        <p className="text-blue-100 mt-1">立場の分布を確認できます</p>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          {/* 立場軸の可視化 */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="font-semibold">← 反対</span>
              <span className="text-gray-400">中立</span>
              <span className="font-semibold">賛成 →</span>
            </div>
            
            <svg width="100%" height="200" className="overflow-visible">
              {/* 軸線 */}
              <line
                x1="10%"
                y1="100"
                x2="90%"
                y2="100"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              
              {/* 中心マーカー */}
              <line
                x1="50%"
                y1="90"
                x2="50%"
                y2="110"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4"
              />
              
              {/* ユーザーの立場バブル */}
              <g>
                <circle
                  cx={`${((userStance + 1) / 2) * 80 + 10}%`}
                  cy="100"
                  r="28"
                  fill="#ef4444"
                  stroke="#dc2626"
                  strokeWidth="3"
                  className="transition-all duration-500"
                />
                <text
                  x={`${((userStance + 1) / 2) * 80 + 10}%`}
                  y="100"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  自分
                </text>
              </g>

              {/* 意見バブル */}
              {node.opinions.filter(op => !op.isUser).map((opinion, index) => {
                const xPercent = ((opinion.stance + 1) / 2) * 80 + 10;
                const isRead = readOpinions.has(opinion.id);
                
                return (
                  <g key={opinion.id}>
                    <circle
                      cx={`${xPercent}%`}
                      cy="100"
                      r="24"
                      fill={isRead ? "#94a3b8" : "#3b82f6"}
                      stroke={isRead ? "#64748b" : "#2563eb"}
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setSelectedOpinion(opinion)}
                    />
                    <text
                      x={`${xPercent}%`}
                      y="100"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ユーザーの現在の立場表示 */}
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-red-700">あなたの現在の立場:</span>
                <span className="ml-2 text-lg font-bold text-red-900">
                  {userStance.toFixed(2)}
                </span>
              </div>
              <span className="text-sm text-red-600">
                {userStance > 0.3 ? '賛成寄り' : userStance < -0.3 ? '反対寄り' : '中立的'}
              </span>
            </div>
          </div>

          {/* 意見リスト */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {node.opinions.filter(op => !op.isUser).map((opinion) => (
              <OpinionCard
                key={opinion.id}
                opinion={opinion}
                isSelected={selectedOpinion?.id === opinion.id}
                isRead={readOpinions.has(opinion.id)}
                onClick={() => setSelectedOpinion(opinion)}
                onAgree={() => handleAgree(opinion.id, opinion.stance)}
                onDisagree={() => handleDisagree(opinion.id, opinion.stance)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 意見カードコンポーネント
// ============================================

const OpinionCard = ({ opinion, isSelected, isRead, onClick, onAgree, onDisagree }) => {
  const stanceLabel = 
    opinion.stance > 0.3 ? '賛成寄り' :
    opinion.stance < -0.3 ? '反対寄り' : '中立的';

  const stanceColor =
    opinion.stance > 0.3 ? 'text-green-600 bg-green-50' :
    opinion.stance < -0.3 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50';

  return (
    <div
      className={`p-5 rounded-xl transition-all ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-500 shadow-lg'
          : 'bg-white border-2 border-gray-200 hover:border-gray-300 shadow'
      } ${isRead ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-gray-800 flex-1">
          {opinion.label}
          {isRead && (
            <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-0.5 rounded">
              既読
            </span>
          )}
        </h3>
        <span className={`text-xs px-2 py-1 rounded font-medium ${stanceColor}`}>
          {stanceLabel}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{opinion.summary}</p>
      
      {/* 賛成/反対ボタン */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAgree();
          }}
          disabled={isRead}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            isRead
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
          }`}
        >
          👍 賛成
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDisagree();
          }}
          disabled={isRead}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            isRead
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
          }`}
        >
          👎 反対
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        立場スコア: {opinion.stance.toFixed(2)}
      </div>
    </div>
  );
};

export default RecursiveExplorer;
