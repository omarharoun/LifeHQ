import { Position } from '../types';

// Calculate distance between two points
export const distance = (p1: Position, p2: Position): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Calculate bezier curve control points for smooth connections
export const getBezierPath = (
  start: Position,
  end: Position,
  curvature = 0.25
): string => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Control points for horizontal flow
  const cp1x = start.x + dx * curvature;
  const cp1y = start.y;
  const cp2x = end.x - dx * curvature;
  const cp2y = end.y;
  
  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
};

// Check if a point is inside a circle
export const isPointInCircle = (
  point: Position,
  center: Position,
  radius: number
): boolean => {
  return distance(point, center) <= radius;
};

// Check if a point is inside a rectangle
export const isPointInRect = (
  point: Position,
  rect: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

// Calculate the center point of a node based on its position and size
export const getNodeCenter = (
  position: Position,
  size: number = 60
): Position => {
  return {
    x: position.x + size / 2,
    y: position.y + size / 2,
  };
};

// Calculate connection points on the edge of a node
export const getConnectionPoint = (
  nodeCenter: Position,
  targetPoint: Position,
  nodeRadius: number = 30
): Position => {
  const angle = Math.atan2(
    targetPoint.y - nodeCenter.y,
    targetPoint.x - nodeCenter.x
  );
  
  return {
    x: nodeCenter.x + Math.cos(angle) * nodeRadius,
    y: nodeCenter.y + Math.sin(angle) * nodeRadius,
  };
};

// Clamp a value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Throttle function for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};
