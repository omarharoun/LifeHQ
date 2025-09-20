import { create } from 'zustand';
import { CanvasState, Node, Link, Workspace } from '../types';

interface UIState {
  // Canvas state
  canvas: CanvasState;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (panX: number, panY: number) => void;
  setSelectedNode: (nodeId?: string) => void;
  setConnecting: (isConnecting: boolean, startNodeId?: string) => void;

  // Current workspace
  currentWorkspace?: Workspace;
  setCurrentWorkspace: (workspace?: Workspace) => void;

  // Local data (optimistic updates)
  nodes: Node[];
  links: Link[];
  setNodes: (nodes: Node[]) => void;
  setLinks: (links: Link[]) => void;
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  removeNode: (nodeId: string) => void;
  addLink: (link: Link) => void;
  updateLink: (linkId: string, updates: Partial<Link>) => void;
  removeLink: (linkId: string) => void;

  // UI state
  isNodeEditorOpen: boolean;
  editingNodeId?: string;
  setNodeEditor: (isOpen: boolean, nodeId?: string) => void;

  // Sync status
  isSyncing: boolean;
  setSyncing: (syncing: boolean) => void;
  syncQueueCount: number;
  setSyncQueueCount: (count: number) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Canvas state
  canvas: {
    zoom: 1,
    panX: 0,
    panY: 0,
    isConnecting: false,
  },
  
  setCanvasZoom: (zoom) =>
    set((state) => ({
      canvas: { ...state.canvas, zoom },
    })),
  
  setCanvasPan: (panX, panY) =>
    set((state) => ({
      canvas: { ...state.canvas, panX, panY },
    })),
  
  setSelectedNode: (nodeId) =>
    set((state) => ({
      canvas: { ...state.canvas, selectedNodeId: nodeId },
    })),
  
  setConnecting: (isConnecting, startNodeId) =>
    set((state) => ({
      canvas: {
        ...state.canvas,
        isConnecting,
        connectionStart: startNodeId,
      },
    })),

  // Current workspace
  currentWorkspace: undefined,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  // Local data
  nodes: [],
  links: [],
  
  setNodes: (nodes) => set({ nodes }),
  setLinks: (links) => set({ links }),
  
  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),
  
  updateNode: (nodeId, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    })),
  
  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      links: state.links.filter(
        (link) => link.from_node !== nodeId && link.to_node !== nodeId
      ),
    })),
  
  addLink: (link) =>
    set((state) => ({
      links: [...state.links, link],
    })),
  
  updateLink: (linkId, updates) =>
    set((state) => ({
      links: state.links.map((link) =>
        link.id === linkId ? { ...link, ...updates } : link
      ),
    })),
  
  removeLink: (linkId) =>
    set((state) => ({
      links: state.links.filter((link) => link.id !== linkId),
    })),

  // UI state
  isNodeEditorOpen: false,
  editingNodeId: undefined,
  
  setNodeEditor: (isOpen, nodeId) =>
    set({
      isNodeEditorOpen: isOpen,
      editingNodeId: nodeId,
    }),

  // Sync status
  isSyncing: false,
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  syncQueueCount: 0,
  setSyncQueueCount: (count) => set({ syncQueueCount: count }),
}));
