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
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'You must be signed in to create a workspace');
        return;
      }

      const workspace = await createWorkspaceMutation.mutateAsync({
        owner: user.id,
        title: 'New Workspace',
        metadata: {},
      });

      setCurrentWorkspace(workspace);
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
      console.error('Sign out error:', error);
    }
  };

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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading workspaces...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Workspaces</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {workspaces && workspaces.length > 0 ? (
          <FlatList
            data={workspaces}
            renderItem={renderWorkspace}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No workspaces yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first workspace to start organizing your dots
            </Text>
          </View>
        )}
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
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  signOutText: {
    fontSize: 14,
    color: '#718096',
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
