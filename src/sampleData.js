// ============================================
// サンプルデータ（再帰的な木構造）
// ============================================

export const sampleData = {
  id: 'root',
  title: 'トップ',
  type: 'category',
  children: [
    {
      id: 'takaichi',
      title: '高市政権',
      type: 'category',
      children: [
        {
          id: 'political_funding',
          title: '政治資金',
          type: 'category',
          children: [
            {
              id: 'slush_fund',
              title: '裏金問題の処分',
              type: 'topic',
              opinions: [
                {
                  id: 'op1',
                  label: '厳罰化すべき',
                  summary: '違反議員への厳格な処分が必要という意見',
                  stance: -0.8,
                },
                {
                  id: 'op2',
                  label: '再発防止が優先',
                  summary: '制度改革と透明性確保を優先すべきという意見',
                  stance: 0.5,
                },
                {
                  id: 'op3',
                  label: '自分の意見',
                  summary: 'バランスの取れた対応が必要',
                  stance: 0.0,
                  isUser: true,
                },
              ],
            },
            {
              id: 'transparency',
              title: '透明性の確保',
              type: 'topic',
              opinions: [
                {
                  id: 'op4',
                  label: 'デジタル化推進',
                  summary: '政治資金のデジタル化と公開強化',
                  stance: 0.9,
                },
                {
                  id: 'op5',
                  label: '現状維持',
                  summary: '既存の枠組みで十分という意見',
                  stance: -0.6,
                },
              ],
            },
          ],
        },
        {
          id: 'tax',
          title: '税金の使い道',
          type: 'category',
          children: [
            {
              id: 'defense',
              title: '防衛費',
              type: 'topic',
              opinions: [
                {
                  id: 'op6',
                  label: '増額必要',
                  summary: '国際情勢を踏まえ防衛費の増額が必須',
                  stance: 0.85,
                },
                {
                  id: 'op7',
                  label: '社会保障優先',
                  summary: '医療・福祉予算を優先すべき',
                  stance: -0.7,
                },
                {
                  id: 'op8',
                  label: '現状維持',
                  summary: '現行予算の範囲で効率化',
                  stance: 0.1,
                },
              ],
            },
            {
              id: 'healthcare',
              title: '医療費',
              type: 'topic',
              opinions: [
                {
                  id: 'op9',
                  label: '増額すべき',
                  summary: '高齢化社会に対応した予算増が必要',
                  stance: 0.8,
                },
                {
                  id: 'op10',
                  label: '効率化優先',
                  summary: '予算増より医療システムの効率化を',
                  stance: -0.3,
                },
              ],
            },
            {
              id: 'education',
              title: '教育費',
              type: 'topic',
              opinions: [
                {
                  id: 'op11',
                  label: '教育投資拡大',
                  summary: '未来への投資として教育予算を増やすべき',
                  stance: 0.9,
                },
                {
                  id: 'op12',
                  label: '民間活用',
                  summary: '公費より民間の教育投資を促進',
                  stance: -0.5,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'trump',
      title: 'トランプ政権',
      type: 'category',
      children: [
        {
          id: 'trade_policy',
          title: '貿易政策',
          type: 'topic',
          opinions: [
            {
              id: 'op13',
              label: '保護主義支持',
              summary: '自国産業保護のための関税政策',
              stance: 0.7,
            },
            {
              id: 'op14',
              label: '自由貿易推進',
              summary: 'グローバル経済との協調が重要',
              stance: -0.8,
            },
          ],
        },
      ],
    },
    {
      id: 'bear',
      title: '熊の駆除',
      type: 'topic',
      opinions: [
        {
          id: 'op15',
          label: '駆除推進',
          summary: '人命保護のため積極的な駆除が必要',
          stance: 0.8,
        },
        {
          id: 'op16',
          label: '共生重視',
          summary: '生態系保護と人間の共生を模索すべき',
          stance: -0.7,
        },
        {
          id: 'op17',
          label: '中間的アプローチ',
          summary: '状況に応じた柔軟な対応',
          stance: 0.0,
        },
      ],
    },
  ],
};
