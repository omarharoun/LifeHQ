// Core data types for the Dots app

export interface Position {
  x: number;
  y: number;
}

export interface NodeStyle {
  color?: string;
  size?: number;
  shape?: 'circle' | 'square' | 'diamond';
}

export interface NodeProperties {
  tags?: string[];
  dueDate?: string;
  points?: number;
  attachments?: string[];
  [key: string]: any;
}

export interface Node {
  id: string;
  workspace_id: string;
  owner: string;
  type: 'action' | 'knowledge' | 'custom';
  title?: string;
  content: Record<string, any>;
  position: Position;
  style: NodeStyle;
  properties: NodeProperties;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  workspace_id: string;
  owner: string;
  from_node: string;
  to_node: string;
  label?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  owner: string;
  title: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  workspace_id: string;
  action: string;
  payload: Record<string, any>;
  created_at: string;
}

// UI State types
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selectedNodeId?: string;
  isConnecting: boolean;
  connectionStart?: string;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'nodes' | 'links' | 'workspaces';
  data: any;
  timestamp: number;
  retryCount: number;
}

// Auth types
export interface User {
  id: string;
  email?: string;
  created_at: string;
}
