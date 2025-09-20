import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Canvas } from '../components/Canvas';
import { NodeEditorModal } from '../components/NodeEditorModal';
import { useUIStore } from '../store/uiStore';
import { useNodes, useLinks } from '../hooks/useSupabase';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { SyncQueue } from '../lib/syncQueue';

export const WorkspaceScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    currentWorkspace,
    setNodes,
    setLinks,
    syncQueueCount,
    setSyncQueueCount,
  } = useUIStore();

  // Skip backend data fetching in demo mode
  const nodes: Node[] = [];
  const links: Link[] = [];

  // Initialize demo data
  useEffect(() => {
    // Set some demo nodes for the workspace
    const demoNodes = [
      {
        id: 'demo-node-1',
        workspace_id: currentWorkspace?.id || 'demo',
        owner: 'demo-user',
        type: 'action' as const,
        title: 'Welcome to Dots!',
        content: { text: 'This is your first node' },
        position: { x: 100, y: 100 },
        style: { color: '#4299e1' },
        properties: { tags: ['welcome'] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-node-2',
        workspace_id: currentWorkspace?.id || 'demo',
        owner: 'demo-user',
        type: 'knowledge' as const,
        title: 'Tap to create nodes',
        content: { text: 'Tap anywhere on the canvas to create new nodes' },
        position: { x: 300, y: 200 },
        style: { color: '#48bb78' },
        properties: { tags: ['help'] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    
    setNodes(demoNodes);
    setLinks([]);
  }, [currentWorkspace?.id, setNodes, setLinks]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (!currentWorkspace) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text>No workspace selected</Text>
          <TouchableOpacity style={styles.button} onPress={handleBackPress}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>{currentWorkspace.title}</Text>
        
        <View style={styles.syncStatus}>
          <Text style={styles.syncText}>DEMO</Text>
        </View>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas />
      </View>

      <NodeEditorModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4299e1',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
    textAlign: 'center',
  },
  syncStatus: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  syncText: {
    fontSize: 12,
    color: '#f6ad55',
    fontWeight: '500',
  },
  canvasContainer: {
    flex: 1,
  },
  button: {
    backgroundColor: '#4299e1',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
