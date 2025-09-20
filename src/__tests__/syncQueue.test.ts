import { SyncQueue } from '../lib/syncQueue';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

jest.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

describe('SyncQueue', () => {
  let syncQueue: SyncQueue;

  beforeEach(() => {
    jest.clearAllMocks();
    syncQueue = SyncQueue.getInstance();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('should be a singleton', () => {
    const instance1 = SyncQueue.getInstance();
    const instance2 = SyncQueue.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize and load queue from storage', async () => {
    const storedQueue = JSON.stringify([
      {
        id: 'test-1',
        type: 'create',
        table: 'nodes',
        data: { title: 'Test' },
        timestamp: Date.now(),
        retryCount: 0,
      },
    ]);

    mockAsyncStorage.getItem.mockResolvedValue(storedQueue);

    await syncQueue.initialize();

    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('dots_sync_queue');
    expect(syncQueue.getQueueLength()).toBe(1);
  });

  it('should add operation to queue', async () => {
    await syncQueue.initialize();

    await syncQueue.addOperation({
      type: 'create',
      table: 'nodes',
      data: { title: 'New Node' },
    });

    expect(syncQueue.getQueueLength()).toBe(1);
    expect(mockAsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should clear queue', async () => {
    await syncQueue.initialize();
    
    await syncQueue.addOperation({
      type: 'create',
      table: 'nodes',
      data: { title: 'Test' },
    });

    expect(syncQueue.getQueueLength()).toBe(1);

    await syncQueue.clearQueue();

    expect(syncQueue.getQueueLength()).toBe(0);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'dots_sync_queue',
      JSON.stringify([])
    );
  });
});
