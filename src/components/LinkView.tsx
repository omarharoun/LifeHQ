import React from 'react';
import { TouchableOpacity } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { Link, Node } from '../types';
import { getBezierPath, getNodeCenter, getConnectionPoint } from '../utils/geometry';
import { useDeleteLink } from '../hooks/useSupabase';

interface LinkViewProps {
  link: Link;
  fromNode: Node;
  toNode: Node;
  canvasWidth: number;
  canvasHeight: number;
}

export const LinkView: React.FC<LinkViewProps> = ({
  link,
  fromNode,
  toNode,
  canvasWidth,
  canvasHeight,
}) => {
  const deleteLinkMutation = useDeleteLink();

  const fromCenter = getNodeCenter(fromNode.position);
  const toCenter = getNodeCenter(toNode.position);
  
  // Calculate connection points on node edges
  const fromPoint = getConnectionPoint(fromCenter, toCenter);
  const toPoint = getConnectionPoint(toCenter, fromCenter);
  
  const pathData = getBezierPath(fromPoint, toPoint);
  
  // Calculate midpoint for label
  const midX = (fromPoint.x + toPoint.x) / 2;
  const midY = (fromPoint.y + toPoint.y) / 2;

  const handleLinkPress = () => {
    // For now, just delete the link on press
    // In a full implementation, you might want a context menu or confirmation
    deleteLinkMutation.mutate(link.id);
  };

  return (
    <Svg
      width={canvasWidth}
      height={canvasHeight}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <TouchableOpacity onPress={handleLinkPress}>
        <Path
          d={pathData}
          stroke="#718096"
          strokeWidth={2}
          fill="none"
          strokeDasharray={link.metadata.dashed ? "5,5" : undefined}
          opacity={0.7}
        />
        
        {/* Arrow head */}
        <Path
          d={`M ${toPoint.x - 8} ${toPoint.y - 4} L ${toPoint.x} ${toPoint.y} L ${toPoint.x - 8} ${toPoint.y + 4}`}
          stroke="#718096"
          strokeWidth={2}
          fill="none"
          opacity={0.7}
        />
        
        {link.label && (
          <SvgText
            x={midX}
            y={midY - 8}
            fontSize="12"
            fill="#4a5568"
            textAnchor="middle"
            fontWeight="500"
          >
            {link.label}
          </SvgText>
        )}
      </TouchableOpacity>
    </Svg>
  );
};
