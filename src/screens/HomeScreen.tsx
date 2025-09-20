import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWorkspaces, useCreateWorkspace } from '../hooks/useSupabase';
import { useUIStore } from '../store/uiStore';
import { getCurrentUser, signOut } from '../lib/supabaseClient';
import { Workspace } from '../types';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspaceMutation = useCreateWorkspace();
  const { setCurrentWorkspace } = useUIStore();

  const handleCreateWorkspace = async () => {
    try {
      // Create a demo workspace without backend
      const demoWorkspace = {
        id: `demo-workspace-${Date.now()}`,
        owner: 'demo-user',
        title: 'New Workspace',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCurrentWorkspace(demoWorkspace);
      navigation.navigate('Workspace' as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to create workspace');
      console.error('Create workspace error:', error);
    }
  };

  const handleOpenWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    navigation.navigate('Workspace' as never);
  };

  // Demo workspaces for offline mode
  const demoWorkspaces = [
    {
      id: 'demo-1',
      owner: 'demo-user',
      title: 'My First Workspace',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-2', 
      owner: 'demo-user',
      title: 'Ideas & Projects',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  const renderWorkspace = ({ item }: { item: Workspace }) => (
    <TouchableOpacity
      style={styles.workspaceCard}
      onPress={() => handleOpenWorkspace(item)}
    >
      <Text style={styles.workspaceTitle}>{item.title}</Text>
      <Text style={styles.workspaceDate}>
        Created {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Workspaces</Text>
        <View style={styles.demoBadge}>
          <Text style={styles.demoText}>DEMO MODE</Text>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={demoWorkspaces}
          renderItem={renderWorkspace}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateWorkspace}
          disabled={createWorkspaceMutation.isLoading}
        >
          <Text style={styles.createButtonText}>
            {createWorkspaceMutation.isLoading ? 'Creating...' : '+ New Workspace'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2d3748',
  },
  demoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4299e1',
  },
  demoText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  list: {
    paddingTop: 24,
  },
  workspaceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  workspaceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  workspaceDate: {
    fontSize: 14,
    color: '#718096',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  createButton: {
    backgroundColor: '#4299e1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
