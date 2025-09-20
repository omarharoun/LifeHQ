import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { NodeView } from './NodeView';
import { LinkView } from './LinkView';
import { useUIStore } from '../store/uiStore';
import { useCreateNode, useCreateLink } from '../hooks/useSupabase';
import { getCurrentUser } from '../lib/supabaseClient';
import { Node } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_SIZE = 2000; // Large canvas for panning

export const Canvas: React.FC = () => {
  const {
    canvas,
    setCanvasZoom,
    setCanvasPan,
    setConnecting,
    setSelectedNode,
    nodes,
    links,
    currentWorkspace,
  } = useUIStore();

  const createNodeMutation = useCreateNode();
  const createLinkMutation = useCreateLink();

  const [connectionStart, setConnectionStart] = useState<string | null>(null);

  const scale = useSharedValue(canvas.zoom);
  const translateX = useSharedValue(canvas.panX);
  const translateY = useSharedValue(canvas.panY);

  const panGestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = canvas.panX + event.translationX;
      translateY.value = canvas.panY + event.translationY;
    },
    onEnd: () => {
      runOnJS(setCanvasPan)(translateX.value, translateY.value);
    },
  });

  const pinchGestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = Math.max(0.5, Math.min(3, canvas.zoom * event.scale));
    },
    onEnd: () => {
      runOnJS(setCanvasZoom)(scale.value);
    },
  });

  const tapGestureHandler = useAnimatedGestureHandler({
    onEnd: (event) => {
      if (event.state === State.END) {
        const x = (event.x - translateX.value) / scale.value;
        const y = (event.y - translateY.value) / scale.value;
        
        if (canvas.isConnecting) {
          // Cancel connection mode
          runOnJS(setConnecting)(false);
          runOnJS(setConnectionStart)(null);
        } else {
          // Create new node at tap position
          runOnJS(handleCreateNode)(x, y);
        }
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleCreateNode = async (x: number, y: number) => {
    try {
      const user = await getCurrentUser();
      if (!user || !currentWorkspace) return;

      await createNodeMutation.mutateAsync({
        workspace_id: currentWorkspace.id,
        owner: user.id,
        type: 'action',
        title: 'New Node',
        content: {},
        position: { x: x - 30, y: y - 30 }, // Center the node on tap point
        style: {},
        properties: {},
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create node');
      console.error('Create node error:', error);
    }
  };

  const handleStartConnection = (nodeId: string) => {
    setConnectionStart(nodeId);
    setConnecting(true, nodeId);
    setSelectedNode(nodeId);
  };

  const handleCompleteConnection = async (toNodeId: string) => {
    if (!connectionStart || connectionStart === toNodeId) {
      setConnecting(false);
      setConnectionStart(null);
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user || !currentWorkspace) return;

      await createLinkMutation.mutateAsync({
        workspace_id: currentWorkspace.id,
        owner: user.id,
        from_node: connectionStart,
        to_node: toNodeId,
        label: '',
        metadata: {},
      });

      setConnecting(false);
      setConnectionStart(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to create connection');
      console.error('Create link error:', error);
    }
  };

  React.useEffect(() => {
    if (canvas.isConnecting && canvas.selectedNodeId && canvas.selectedNodeId !== connectionStart) {
      handleCompleteConnection(canvas.selectedNodeId);
    }
  }, [canvas.isConnecting, canvas.selectedNodeId, connectionStart]);

  return (
    <View style={styles.container}>
      <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
        <Animated.View style={styles.container}>
          <PanGestureHandler onGestureEvent={panGestureHandler}>
            <Animated.View style={styles.container}>
              <TapGestureHandler onGestureEvent={tapGestureHandler}>
                <Animated.View style={[styles.canvas, animatedStyle]}>
                  {/* Render links first (behind nodes) */}
                  {links.map((link) => {
                    const fromNode = nodes.find((n) => n.id === link.from_node);
                    const toNode = nodes.find((n) => n.id === link.to_node);
                    
                    if (!fromNode || !toNode) return null;
                    
                    return (
                      <LinkView
                        key={link.id}
                        link={link}
                        fromNode={fromNode}
                        toNode={toNode}
                        canvasWidth={CANVAS_SIZE}
                        canvasHeight={CANVAS_SIZE}
                      />
                    );
                  })}

                  {/* Render nodes */}
                  {nodes.map((node) => (
                    <NodeView
                      key={node.id}
                      node={node}
                      scale={scale.value}
                      onStartConnection={handleStartConnection}
                    />
                  ))}
                </Animated.View>
              </TapGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.instructions}>
          {canvas.isConnecting
            ? 'Tap another node to connect'
            : 'Tap to create • Long press to connect • Double tap to edit'}
        </Text>
        
        {canvas.isConnecting && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setConnecting(false);
              setConnectionStart(null);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: '#f8f9fa',
  },
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
