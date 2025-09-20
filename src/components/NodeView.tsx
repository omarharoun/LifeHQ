import React from 'react';
import { Text, StyleSheet } from 'react-native';
import {
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Node } from '../types';
import { useUIStore } from '../store/uiStore';
import { useUpdateNode } from '../hooks/useSupabase';
import { throttle } from '../utils/geometry';

interface NodeViewProps {
  node: Node;
  scale: number;
  onStartConnection: (nodeId: string) => void;
}

const NODE_SIZE = 60;
const NODE_COLORS = {
  action: '#4299e1',
  knowledge: '#48bb78',
  custom: '#ed8936',
};

export const NodeView: React.FC<NodeViewProps> = ({
  node,
  scale,
  onStartConnection,
}) => {
  const { setSelectedNode, setNodeEditor, canvas } = useUIStore();
  const updateNodeMutation = useUpdateNode();

  const translateX = useSharedValue(node.position.x);
  const translateY = useSharedValue(node.position.y);
  const scaleValue = useSharedValue(1);

  // Throttled position update to avoid excessive API calls
  const throttledUpdatePosition = React.useMemo(
    () =>
      throttle((x: number, y: number) => {
        updateNodeMutation.mutate({
          nodeId: node.id,
          updates: { position: { x, y } },
        });
      }, 300),
    [updateNodeMutation, node.id]
  );

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scaleValue.value = withSpring(1.1);
      runOnJS(setSelectedNode)(node.id);
    },
    onActive: (event) => {
      translateX.value = node.position.x + event.translationX / scale;
      translateY.value = node.position.y + event.translationY / scale;
    },
    onEnd: () => {
      scaleValue.value = withSpring(1);
      const finalX = translateX.value;
      const finalY = translateY.value;
      
      // Update position in store and queue for sync
      runOnJS(throttledUpdatePosition)(finalX, finalY);
    },
  });

  const tapGestureHandler = useAnimatedGestureHandler({
    onEnd: () => {
      if (canvas.isConnecting && canvas.connectionStart !== node.id) {
        // Handle connection completion
        runOnJS(setSelectedNode)(node.id);
      } else {
        // Regular node selection
        runOnJS(setSelectedNode)(node.id);
      }
    },
  });

  const doubleTapGestureHandler = useAnimatedGestureHandler({
    onEnd: () => {
      runOnJS(setNodeEditor)(true, node.id);
    },
  });

  const longPressGestureHandler = useAnimatedGestureHandler({
    onEnd: (event) => {
      if (event.state === State.ACTIVE) {
        runOnJS(onStartConnection)(node.id);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scaleValue.value },
    ],
  }));

  const nodeColor = node.style.color || NODE_COLORS[node.type];
  const isSelected = canvas.selectedNodeId === node.id;

  return (
    <LongPressGestureHandler
      onGestureEvent={longPressGestureHandler}
      minDurationMs={500}
    >
      <Animated.View>
        <PanGestureHandler onGestureEvent={panGestureHandler}>
          <Animated.View>
            <TapGestureHandler
              onGestureEvent={doubleTapGestureHandler}
              numberOfTaps={2}
            >
              <Animated.View>
                <TapGestureHandler onGestureEvent={tapGestureHandler}>
                  <Animated.View style={[styles.nodeContainer, animatedStyle]}>
                    <Svg
                      width={NODE_SIZE}
                      height={NODE_SIZE}
                      viewBox={`0 0 ${NODE_SIZE} ${NODE_SIZE}`}
                    >
                      <Circle
                        cx={NODE_SIZE / 2}
                        cy={NODE_SIZE / 2}
                        r={(NODE_SIZE / 2) - 2}
                        fill={nodeColor}
                        stroke={isSelected ? '#2d3748' : 'transparent'}
                        strokeWidth={isSelected ? 3 : 0}
                        opacity={0.9}
                      />
                      {node.title && (
                        <SvgText
                          x={NODE_SIZE / 2}
                          y={NODE_SIZE / 2 + 4}
                          fontSize="10"
                          fill="white"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {node.title.substring(0, 8)}
                        </SvgText>
                      )}
                    </Svg>
                    
                    {node.title && (
                      <Text style={styles.nodeLabel}>
                        {node.title}
                      </Text>
                    )}
                  </Animated.View>
                </TapGestureHandler>
              </Animated.View>
            </TapGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </LongPressGestureHandler>
  );
};

const styles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  nodeLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#2d3748',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: NODE_SIZE + 20,
  },
});
