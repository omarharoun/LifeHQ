import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useUIStore } from '../store/uiStore';
import { useUpdateNode, useDeleteNode } from '../hooks/useSupabase';

const NODE_COLORS = {
  action: '#4299e1',
  knowledge: '#48bb78',
  custom: '#ed8936',
};

export const NodeEditorModal: React.FC = () => {
  const {
    isNodeEditorOpen,
    editingNodeId,
    setNodeEditor,
    nodes,
  } = useUIStore();

  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'action' | 'knowledge' | 'custom'>('action');
  const [tags, setTags] = useState('');

  const editingNode = editingNodeId ? nodes.find(n => n.id === editingNodeId) : null;

  useEffect(() => {
    if (editingNode) {
      setTitle(editingNode.title || '');
      setContent(editingNode.content.text || '');
      setType(editingNode.type);
      setTags(editingNode.properties.tags?.join(', ') || '');
    }
  }, [editingNode]);

  const handleSave = async () => {
    if (!editingNodeId) return;

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await updateNodeMutation.mutateAsync({
        nodeId: editingNodeId,
        updates: {
          title,
          type,
          content: { text: content },
          properties: {
            ...editingNode?.properties,
            tags: tagsArray,
          },
          style: {
            ...editingNode?.style,
            color: NODE_COLORS[type],
          },
        },
      });

      setNodeEditor(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save node');
      console.error('Save node error:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Node',
      'Are you sure you want to delete this node? This will also remove all connections.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!editingNodeId) return;
            
            try {
              await deleteNodeMutation.mutateAsync(editingNodeId);
              setNodeEditor(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete node');
              console.error('Delete node error:', error);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setNodeEditor(false);
  };

  if (!isNodeEditorOpen || !editingNode) {
    return null;
  }

  return (
    <Modal
      visible={isNodeEditorOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Node</Text>
          <TouchableOpacity onPress={handleSave} disabled={updateNodeMutation.isLoading}>
            <Text style={[styles.saveText, updateNodeMutation.isLoading && styles.disabled]}>
              {updateNodeMutation.isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter node title"
              maxLength={50}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeSelector}>
              {(['action', 'knowledge', 'custom'] as const).map((nodeType) => (
                <TouchableOpacity
                  key={nodeType}
                  style={[
                    styles.typeButton,
                    type === nodeType && styles.typeButtonSelected,
                    { backgroundColor: type === nodeType ? NODE_COLORS[nodeType] : '#f7fafc' },
                  ]}
                  onPress={() => setType(nodeType)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === nodeType && styles.typeButtonTextSelected,
                    ]}
                  >
                    {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Add notes, ideas, or details..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="work, personal, urgent (comma separated)"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteNodeMutation.isLoading}
          >
            <Text style={styles.deleteButtonText}>
              {deleteNodeMutation.isLoading ? 'Deleting...' : 'Delete Node'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  cancelText: {
    fontSize: 16,
    color: '#718096',
  },
  saveText: {
    fontSize: 16,
    color: '#4299e1',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
  },
  typeButtonTextSelected: {
    color: '#ffffff',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  deleteButton: {
    backgroundColor: '#fed7d7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#e53e3e',
    fontSize: 16,
    fontWeight: '600',
  },
});
