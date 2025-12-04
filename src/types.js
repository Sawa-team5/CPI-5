// ============================================
// 型定義
// ============================================

export type NodeType = 'category' | 'topic';

export interface BaseNode {
  id: string;
  title: string;
  type: NodeType;
}

export interface Opinion {
  id: string;
  label: string;
  summary: string;
  stance: number; // -1.0 (反対) ～ 1.0 (賛成)
  isUser?: boolean;
}

export interface CategoryNode extends BaseNode {
  type: 'category';
  children: (CategoryNode | TopicNode)[];
}

export interface TopicNode extends BaseNode {
  type: 'topic';
  opinions: Opinion[];
}

export type TreeNode = CategoryNode | TopicNode;

export interface BreadcrumbItem {
  id: string;
  title: string;
}
