import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { SyncQueue } from '../lib/syncQueue';
import { useUIStore } from '../store/uiStore';
import { Node, Link, Workspace } from '../types';

const syncQueue = SyncQueue.getInstance();

// Workspaces
export const useWorkspaces = () => {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (workspace: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspaces')
        .insert(workspace)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

// Nodes
export const useNodes = (workspaceId?: string) => {
  return useQuery({
    queryKey: ['nodes', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
};

export const useCreateNode = () => {
  const { addNode, currentWorkspace } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (node: Omit<Node, 'id' | 'created_at' | 'updated_at'>) => {
      const newNode: Node = {
        ...node,
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Optimistic update
      addNode(newNode);
      
      // Queue for sync
      await syncQueue.addOperation({
        type: 'create',
        table: 'nodes',
        data: { ...node, id: newNode.id },
      });
      
      return newNode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', currentWorkspace?.id] });
    },
  });
};

export const useUpdateNode = () => {
  const { updateNode } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ nodeId, updates }: { nodeId: string; updates: Partial<Node> }) => {
      // Optimistic update
      updateNode(nodeId, { ...updates, updated_at: new Date().toISOString() });
      
      // Queue for sync
      await syncQueue.addOperation({
        type: 'update',
        table: 'nodes',
        data: { id: nodeId, ...updates },
      });
      
      return { nodeId, updates };
    },
    onSuccess: (_, variables) => {
      const { currentWorkspace } = useUIStore.getState();
      queryClient.invalidateQueries({ queryKey: ['nodes', currentWorkspace?.id] });
    },
  });
};

export const useDeleteNode = () => {
  const { removeNode } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nodeId: string) => {
      // Optimistic update
      removeNode(nodeId);
      
      // Queue for sync
      await syncQueue.addOperation({
        type: 'delete',
        table: 'nodes',
        data: { id: nodeId },
      });
      
      return nodeId;
    },
    onSuccess: () => {
      const { currentWorkspace } = useUIStore.getState();
      queryClient.invalidateQueries({ queryKey: ['nodes', currentWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['links', currentWorkspace?.id] });
    },
  });
};

// Links
export const useLinks = (workspaceId?: string) => {
  return useQuery({
    queryKey: ['links', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
};

export const useCreateLink = () => {
  const { addLink, currentWorkspace } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (link: Omit<Link, 'id' | 'created_at' | 'updated_at'>) => {
      const newLink: Link = {
        ...link,
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Optimistic update
      addLink(newLink);
      
      // Queue for sync
      await syncQueue.addOperation({
        type: 'create',
        table: 'links',
        data: { ...link, id: newLink.id },
      });
      
      return newLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', currentWorkspace?.id] });
    },
  });
};

export const useDeleteLink = () => {
  const { removeLink } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (linkId: string) => {
      // Optimistic update
      removeLink(linkId);
      
      // Queue for sync
      await syncQueue.addOperation({
        type: 'delete',
        table: 'links',
        data: { id: linkId },
      });
      
      return linkId;
    },
    onSuccess: () => {
      const { currentWorkspace } = useUIStore.getState();
      queryClient.invalidateQueries({ queryKey: ['links', currentWorkspace?.id] });
    },
  });
};
