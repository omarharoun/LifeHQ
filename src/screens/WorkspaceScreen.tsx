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

  // Fetch initial data
  const { data: nodes } = useNodes(currentWorkspace?.id);
  const { data: links } = useLinks(currentWorkspace?.id);

  // Setup realtime sync
  useRealtimeSync(currentWorkspace?.id);

  // Initialize sync queue and monitor queue length
  useEffect(() => {
    const syncQueue = SyncQueue.getInstance();
    syncQueue.initialize();

    const interval = setInterval(() => {
      setSyncQueueCount(syncQueue.getQueueLength());
    }, 1000);

    return () => clearInterval(interval);
  }, [setSyncQueueCount]);

  // Update local state when data changes
  useEffect(() => {
    if (nodes) {
      setNodes(nodes);
    }
  }, [nodes, setNodes]);

  useEffect(() => {
    if (links) {
      setLinks(links);
    }
  }, [links, setLinks]);

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
          {syncQueueCount > 0 && (
            <Text style={styles.syncText}>Syncing ({syncQueueCount})</Text>
          )}
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
