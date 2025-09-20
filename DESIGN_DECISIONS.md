# Design Decisions

This document outlines key architectural and implementation decisions made during the development of the Dots app.

## Canvas Rendering: react-native-svg vs react-native-skia

**Decision**: Use `react-native-svg`

**Reasoning**:
- **Ecosystem Maturity**: Better documentation, more examples, and wider community support
- **Debugging**: SVG elements can be inspected and styled more easily
- **Performance**: Sufficient for the MVP's node count and complexity
- **Learning Curve**: Lower barrier to entry for contributors
- **Compatibility**: Better integration with gesture handlers and animations

**Trade-offs**:
- **Performance**: Skia would handle thousands of nodes better
- **Advanced Graphics**: Skia offers more sophisticated rendering capabilities
- **Future Scaling**: May need to reconsider for complex visualizations

**Alternative Considered**: 
react-native-skia offers superior performance for complex graphics but was deemed overkill for the MVP requirements.

## State Management: Zustand vs Redux Toolkit

**Decision**: Use `Zustand`

**Reasoning**:
- **Simplicity**: Minimal boilerplate compared to Redux
- **TypeScript Integration**: Excellent TypeScript support out of the box
- **Bundle Size**: Significantly smaller than Redux ecosystem
- **Performance**: No unnecessary re-renders with proper selectors
- **Developer Experience**: Easier to understand and maintain

**Trade-offs**:
- **Ecosystem**: Smaller ecosystem compared to Redux
- **DevTools**: Less sophisticated debugging tools
- **Team Familiarity**: Redux might be more familiar to some developers

## Database Strategy: Optimistic Updates vs Server-First

**Decision**: Optimistic updates with sync queue

**Reasoning**:
- **User Experience**: Immediate feedback feels more responsive
- **Offline Support**: Essential for mobile apps with intermittent connectivity
- **Real-time Feel**: Works well with Supabase real-time subscriptions
- **Conflict Resolution**: Manageable with timestamp-based merging

**Implementation**:
1. Update local state immediately
2. Queue operation in AsyncStorage
3. Sync to server in background
4. Handle conflicts with last-write-wins

**Trade-offs**:
- **Complexity**: More complex than server-first approach
- **Consistency**: Temporary inconsistencies possible
- **Error Handling**: Need robust retry mechanisms

## Authentication: Magic Links vs Traditional

**Decision**: Magic link authentication

**Reasoning**:
- **User Experience**: No password management friction
- **Security**: Reduces password-related vulnerabilities
- **Mobile Optimization**: Better UX on mobile devices
- **Supabase Integration**: Native support with minimal setup

**Trade-offs**:
- **Email Dependency**: Requires reliable email delivery
- **User Education**: Some users unfamiliar with magic links
- **Session Management**: Need to handle email client behavior

## Node Positioning: Absolute vs Relative

**Decision**: Absolute positioning with coordinate system

**Reasoning**:
- **Precision**: Exact positioning for drag operations
- **Persistence**: Easy to save/restore positions
- **Canvas Scaling**: Works well with zoom/pan operations
- **Performance**: Efficient for collision detection and connections

**Implementation**:
- Nodes store `{x, y}` coordinates
- Canvas provides coordinate transformation
- Gesture handlers work in screen coordinates
- Database stores world coordinates

## Sync Conflict Resolution: Last-Write-Wins vs CRDT

**Decision**: Last-write-wins with timestamps

**Reasoning**:
- **Simplicity**: Easy to implement and understand
- **Performance**: Minimal computational overhead
- **Use Case Fit**: Node positioning conflicts are rare
- **MVP Scope**: Sufficient for single-user primary workflow

**Implementation**:
```typescript
if (serverTimestamp > localTimestamp) {
  // Accept server version
  updateLocalState(serverData);
} else {
  // Keep local version, sync to server
  syncToServer(localData);
}
```

**Future Consideration**: 
For true collaborative editing, CRDTs (Conflict-free Replicated Data Types) would provide better conflict resolution.

## Canvas Navigation: Transform vs Viewport

**Decision**: Transform-based approach with react-native-reanimated

**Reasoning**:
- **Performance**: Native driver for smooth 60fps animations
- **Gesture Integration**: Natural integration with pan/pinch gestures
- **State Management**: Single transform state for entire canvas
- **Predictable Behavior**: Consistent zoom/pan behavior

**Implementation**:
```typescript
const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: translateX.value },
    { translateY: translateY.value },
    { scale: scale.value },
  ],
}));
```

## Error Handling: Silent vs User-Facing

**Decision**: Hybrid approach with graceful degradation

**Reasoning**:
- **Sync Errors**: Handle silently with retry logic
- **User Actions**: Show feedback for direct user actions
- **Critical Errors**: Surface authentication and network issues
- **Logging**: Comprehensive logging for debugging

**Strategy**:
- Network errors: Retry with exponential backoff
- Validation errors: Show user-friendly messages
- Sync queue: Visual indicator of pending operations
- Crashes: Graceful fallback states

## Testing Strategy: Unit + Integration vs E2E

**Decision**: Focus on unit and integration tests

**Reasoning**:
- **Development Speed**: Faster feedback loop
- **Reliability**: Less flaky than E2E tests
- **Coverage**: Better coverage of edge cases
- **CI/CD**: Faster build times

**Implementation**:
- Unit tests for utilities and hooks
- Integration tests for component interactions
- Mock Supabase for predictable testing
- E2E tests for critical user flows (future addition)

## Real-time Architecture: Polling vs WebSockets

**Decision**: Supabase real-time (WebSocket-based)

**Reasoning**:
- **Efficiency**: Lower bandwidth than polling
- **Latency**: Immediate updates for real-time feel
- **Battery Life**: Less battery drain than frequent polling
- **Supabase Integration**: Built-in support with minimal setup

**Implementation**:
```typescript
supabase
  .channel('nodes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'nodes' }, 
      handleNodeChange)
  .subscribe();
```

## Code Organization: Feature vs Layer

**Decision**: Hybrid approach with domain grouping

**Reasoning**:
- **Scalability**: Easy to locate related functionality
- **Separation of Concerns**: Clear boundaries between layers
- **Team Collaboration**: Reduces merge conflicts
- **Maintainability**: Logical grouping of related code

**Structure**:
```
src/
├── components/     # UI components
├── hooks/         # Business logic hooks
├── lib/           # Core utilities
├── screens/       # Route components
├── store/         # State management
├── types/         # Type definitions
└── utils/         # Pure functions
```

## Performance Optimizations

### Node Rendering
- **Virtualization**: Not implemented in MVP (premature optimization)
- **Memoization**: React.memo for NodeView components
- **Throttling**: Position updates throttled to 300ms

### Gesture Handling
- **Native Driver**: All animations use native driver
- **Gesture Consolidation**: Single gesture handler per node
- **Event Throttling**: Position updates batched

### Database Queries
- **Query Caching**: 5-minute stale time for static data
- **Subscription Filtering**: Server-side filtering by workspace
- **Batch Operations**: Multiple changes in single transaction

## Security Considerations

### Data Access
- **Row Level Security**: All tables use RLS policies
- **User Isolation**: Workspace-based data separation
- **API Security**: No direct database access from client

### Authentication
- **JWT Tokens**: Supabase handles token management
- **Session Persistence**: Secure token storage
- **Auto-refresh**: Automatic token refresh

### Input Validation
- **Client-side**: Immediate user feedback
- **Server-side**: Database constraints and triggers
- **Sanitization**: Prevent XSS in user content

## Deployment Strategy

### Environment Management
- **Development**: Local Supabase instance (optional)
- **Staging**: Shared Supabase project for testing
- **Production**: Dedicated Supabase project

### CI/CD Pipeline
- **Testing**: Automated test suite on every PR
- **Building**: Expo build service for app store deployment
- **Monitoring**: Error tracking and performance monitoring

These decisions can be revisited as the app evolves and requirements change. The focus was on delivering a solid MVP while maintaining flexibility for future enhancements.
