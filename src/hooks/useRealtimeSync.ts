import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useUIStore } from '../store/uiStore';
import { Node, Link } from '../types';

export const useRealtimeSync = (workspaceId?: string) => {
  const { setNodes, setLinks, addNode, updateNode, removeNode, addLink, updateLink, removeLink } = useUIStore();

  useEffect(() => {
    if (!workspaceId) return;

    let nodesChannel: RealtimeChannel;
    let linksChannel: RealtimeChannel;

    // Subscribe to nodes changes
    nodesChannel = supabase
      .channel(`public:nodes:workspace_id=eq.${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nodes',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('Node change received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              const newNode = payload.new as Node;
              addNode(newNode);
              break;
              
            case 'UPDATE':
              const updatedNode = payload.new as Node;
              updateNode(updatedNode.id, updatedNode);
              break;
              
            case 'DELETE':
              const deletedNode = payload.old as Node;
              removeNode(deletedNode.id);
              break;
          }
        }
      )
      .subscribe();

    // Subscribe to links changes
    linksChannel = supabase
      .channel(`public:links:workspace_id=eq.${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'links',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('Link change received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              const newLink = payload.new as Link;
              addLink(newLink);
              break;
              
            case 'UPDATE':
              const updatedLink = payload.new as Link;
              updateLink(updatedLink.id, updatedLink);
              break;
              
            case 'DELETE':
              const deletedLink = payload.old as Link;
              removeLink(deletedLink.id);
              break;
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      if (nodesChannel) {
        supabase.removeChannel(nodesChannel);
      }
      if (linksChannel) {
        supabase.removeChannel(linksChannel);
      }
    };
  }, [workspaceId, addNode, updateNode, removeNode, addLink, updateLink, removeLink]);

  // Monitor connection status
  useEffect(() => {
    const handleConnectionChange = (status: string) => {
      console.log('Realtime connection status:', status);
      // You can update UI state here to show connection status
    };

    // Listen to connection status changes
    supabase.realtime.onOpen(() => handleConnectionChange('OPEN'));
    supabase.realtime.onClose(() => handleConnectionChange('CLOSED'));
    supabase.realtime.onError((error) => {
      console.error('Realtime error:', error);
      handleConnectionChange('ERROR');
    });

    return () => {
      // Cleanup listeners if needed
    };
  }, []);
};
