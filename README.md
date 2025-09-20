# Dots - Life Orchestration Canvas

A highly customizable React Native app for creating and connecting ideas through a draggable node/graph interface. Built with Expo, TypeScript, and Supabase.

## 🎯 Overview

Dots is a neutral, playful canvas where users create nodes (dots) and connect them to orchestrate their life. The app provides a blank slate - all content is user-generated, with no suggestions or pre-populated content.

### Key Features

- **Interactive Canvas**: Draggable nodes with smooth animations
- **Three Node Types**: Action, Knowledge, and Custom nodes
- **Visual Connections**: Create directed links between nodes
- **Real-time Sync**: Multi-device synchronization via Supabase
- **Offline-First**: Optimistic updates with background sync
- **Secure**: Per-user data isolation with Row Level Security

## 🏗️ Architecture

- **Frontend**: React Native (Expo) + TypeScript
- **Backend**: Supabase (PostgreSQL + Realtime + Auth + Storage)
- **State Management**: Zustand + TanStack Query
- **Canvas**: react-native-svg + react-native-gesture-handler + react-native-reanimated
- **Local Storage**: AsyncStorage with sync queue for offline support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn or npm
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### 1. Clone and Install

```bash
git clone <repository-url>
cd dots
yarn install
```

### 2. Setup Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the database schema:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and execute the contents of `supabase/schema.sql`

### 3. Configure Environment

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit `.env` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Setup Supabase Storage (Optional)

For attachment support, create a storage bucket:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `attachments`
3. Set it to private for security

### 5. Run the App

```bash
# Start the development server
yarn start

# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android
```

## 📱 Usage

### Basic Operations

1. **Create Nodes**: Tap anywhere on the canvas to create a new node
2. **Edit Nodes**: Double-tap a node to open the editor
3. **Move Nodes**: Drag nodes around the canvas
4. **Connect Nodes**: Long-press a node, then tap another to create a connection
5. **Delete**: Use the node editor or tap connections to remove them

### Node Types

- **Action**: Tasks, todos, or actionable items (blue)
- **Knowledge**: Information, notes, or references (green)  
- **Custom**: User-defined type for flexibility (orange)

### Canvas Navigation

- **Pan**: Drag with one finger to move around
- **Zoom**: Pinch to zoom in/out
- **Reset**: Double-tap empty space to center view

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test --coverage

# Run tests in watch mode
yarn test --watch

# Run linter
yarn lint

# Fix linting issues
yarn lint:fix

# Type checking
yarn type-check
```

## 🔧 Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Canvas.tsx       # Main canvas component
│   ├── NodeView.tsx     # Individual node rendering
│   ├── LinkView.tsx     # Connection rendering
│   └── NodeEditorModal.tsx # Node editing interface
├── hooks/               # Custom React hooks
│   ├── useSupabase.ts   # Database operations
│   └── useRealtimeSync.ts # Real-time subscriptions
├── lib/                 # Core utilities
│   ├── supabaseClient.ts # Supabase configuration
│   └── syncQueue.ts     # Offline sync logic
├── screens/             # Main app screens
│   ├── AuthScreen.tsx   # Authentication
│   ├── HomeScreen.tsx   # Workspace selection
│   └── WorkspaceScreen.tsx # Main canvas view
├── store/               # State management
│   └── uiStore.ts       # Zustand store
├── types/               # TypeScript definitions
├── utils/               # Helper functions
│   └── geometry.ts      # Canvas math utilities
└── __tests__/           # Test files
```

### Database Schema

The app uses four main tables:

- **workspaces**: User workspaces/canvases
- **nodes**: Individual dots/nodes
- **links**: Connections between nodes
- **activities**: Audit log for changes

See `supabase/schema.sql` for the complete schema with RLS policies.

### Offline Sync Strategy

1. **Optimistic Updates**: UI updates immediately
2. **Sync Queue**: Operations queued in AsyncStorage
3. **Background Sync**: Automatic retry with exponential backoff
4. **Conflict Resolution**: Last-write-wins with timestamp comparison

## 🚀 Deployment

### Build for Production

```bash
# Build for all platforms
expo build

# Build for specific platform
expo build:ios
expo build:android
```

### CI/CD

The project includes GitHub Actions workflow (`.github/workflows/ci.yml`) that:

1. Runs linting and type checking
2. Executes test suite with coverage
3. Builds the app for production
4. Can be extended for automatic deployment

### Environment Variables for Production

Set these secrets in your CI/CD pipeline:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 🔒 Security

### Row Level Security (RLS)

All database tables use RLS policies to ensure users can only access their own data:

```sql
-- Example policy for nodes table
create policy "nodes_owner" on public.nodes
  for all
  using (exists (select 1 from public.workspaces w 
         where w.id = public.nodes.workspace_id 
         and w.owner = auth.uid()));
```

### Best Practices

- Service role key never exposed to client
- All API calls authenticated via Supabase Auth
- Input validation on client and server
- Signed URLs for private file access

## 📈 Performance

### Optimizations

- **Throttled Position Updates**: Node positions saved every 300ms
- **Optimistic UI**: Immediate feedback with background sync  
- **Query Caching**: 5-minute stale time for static data
- **Gesture Optimization**: Native driver for smooth animations

### Monitoring

- Sync queue length displayed in UI
- Connection status indicators
- Error logging for failed operations

## 🛠️ Extending the App

### Adding New Node Types

1. Update the `Node` type in `src/types/index.ts`
2. Add color mapping in `NodeView.tsx`
3. Update database schema check constraint
4. Add UI selector in `NodeEditorModal.tsx`

### Multi-User Workspaces

To extend from single-user to collaborative workspaces:

1. Create a `workspace_members` table
2. Update RLS policies to check membership
3. Add real-time presence indicators
4. Implement conflict resolution for simultaneous edits

### Attachment Support

The foundation is ready - extend by:

1. Adding file upload UI in `NodeEditorModal`
2. Implementing `useAttachments` hook
3. Creating signed URL generation
4. Adding file type validation

## 📚 API Reference

### Supabase Tables

#### workspaces
- `id`: UUID primary key
- `owner`: User ID (foreign key)
- `title`: Workspace name
- `metadata`: JSON for extensibility

#### nodes  
- `id`: UUID primary key
- `workspace_id`: Workspace reference
- `type`: 'action' | 'knowledge' | 'custom'
- `position`: {x, y} coordinates
- `style`: Visual properties
- `properties`: Custom metadata

#### links
- `from_node`, `to_node`: Node references
- `label`: Optional connection label
- `metadata`: Custom properties

### Edge Functions

Example function at `supabase/functions/share/index.ts` demonstrates:
- JWT token validation
- Service role operations
- CORS handling
- Error responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention

Use conventional commits:
- `feat(canvas): add node dragging`
- `fix(auth): resolve login issue`
- `docs(readme): update setup instructions`

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚧 Roadmap

### v1.1 - Enhanced Interactions
- [ ] Node templates and presets
- [ ] Bulk operations (select multiple nodes)
- [ ] Undo/redo functionality
- [ ] Export workspace as image

### v1.2 - Collaboration
- [ ] Multi-user workspace support
- [ ] Real-time cursors and presence
- [ ] Comment system on nodes
- [ ] Activity feed

### v1.3 - Advanced Features
- [ ] Node grouping and layers
- [ ] Custom node shapes
- [ ] Workflow automation
- [ ] Integration with external services

## 💡 Design Decisions

### Canvas Implementation: SVG vs Skia

**Chosen**: react-native-svg
**Reasoning**: 
- Better ecosystem compatibility
- Simpler debugging and styling
- Sufficient performance for MVP
- Lower learning curve

**Alternative**: react-native-skia offers better performance for complex graphics but adds complexity.

### State Management: Zustand vs Redux

**Chosen**: Zustand
**Reasoning**:
- Minimal boilerplate
- TypeScript-first design  
- Excellent performance
- Easy to test

### Offline Strategy: Optimistic vs Pessimistic

**Chosen**: Optimistic updates
**Reasoning**:
- Better user experience
- Works well with real-time sync
- Handles network issues gracefully
- Aligns with mobile app expectations

---

For questions or support, please open an issue on GitHub.