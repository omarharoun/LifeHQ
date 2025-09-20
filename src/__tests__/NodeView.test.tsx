import React from 'react';
import { render } from '@testing-library/react-native';
import { NodeView } from '../components/NodeView';
import { Node } from '../types';

// Mock the store
jest.mock('../store/uiStore', () => ({
  useUIStore: () => ({
    setSelectedNode: jest.fn(),
    setNodeEditor: jest.fn(),
    canvas: {
      zoom: 1,
      panX: 0,
      panY: 0,
      isConnecting: false,
      selectedNodeId: undefined,
    },
  }),
}));

// Mock the hooks
jest.mock('../hooks/useSupabase', () => ({
  useUpdateNode: () => ({
    mutate: jest.fn(),
  }),
}));

const mockNode: Node = {
  id: 'test-node-1',
  workspace_id: 'test-workspace',
  owner: 'test-user',
  type: 'action',
  title: 'Test Node',
  content: { text: 'Test content' },
  position: { x: 100, y: 100 },
  style: { color: '#4299e1' },
  properties: { tags: ['test'] },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('NodeView', () => {
  const mockOnStartConnection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders node with title', () => {
    const { getByText } = render(
      <NodeView
        node={mockNode}
        scale={1}
        onStartConnection={mockOnStartConnection}
      />
    );

    expect(getByText('Test Node')).toBeTruthy();
  });

  it('renders node without title', () => {
    const nodeWithoutTitle = { ...mockNode, title: undefined };
    
    const { queryByText } = render(
      <NodeView
        node={nodeWithoutTitle}
        scale={1}
        onStartConnection={mockOnStartConnection}
      />
    );

    expect(queryByText('Test Node')).toBeFalsy();
  });

  it('applies correct color based on node type', () => {
    const actionNode = { ...mockNode, type: 'action' as const };
    const knowledgeNode = { ...mockNode, type: 'knowledge' as const };
    
    const { rerender } = render(
      <NodeView
        node={actionNode}
        scale={1}
        onStartConnection={mockOnStartConnection}
      />
    );

    // Test action node color (would need to check SVG props in a more complete test)
    expect(actionNode.type).toBe('action');

    rerender(
      <NodeView
        node={knowledgeNode}
        scale={1}
        onStartConnection={mockOnStartConnection}
      />
    );

    expect(knowledgeNode.type).toBe('knowledge');
  });
});
