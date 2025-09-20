import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { SyncOperation } from '../types';

const SYNC_QUEUE_KEY = 'dots_sync_queue';
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

export class SyncQueue {
  private static instance: SyncQueue;
  private queue: SyncOperation[] = [];
  private isProcessing = false;

  static getInstance(): SyncQueue {
    if (!SyncQueue.instance) {
      SyncQueue.instance = new SyncQueue();
    }
    return SyncQueue.instance;
  }

  async initialize() {
    await this.loadQueue();
    this.startProcessing();
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  async addOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const syncOp: SyncOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(syncOp);
    await this.saveQueue();
    
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  private async startProcessing() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const operation = this.queue[0];
      
      try {
        await this.executeOperation(operation);
        this.queue.shift(); // Remove successful operation
        await this.saveQueue();
      } catch (error) {
        console.error('Sync operation failed:', error);
        
        operation.retryCount++;
        
        if (operation.retryCount >= MAX_RETRY_COUNT) {
          console.error('Max retries reached for operation:', operation);
          this.queue.shift(); // Remove failed operation
        } else {
          // Exponential backoff
          const delay = RETRY_DELAY_BASE * Math.pow(2, operation.retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        await this.saveQueue();
      }
    }

    this.isProcessing = false;
  }

  private async executeOperation(operation: SyncOperation) {
    const { type, table, data } = operation;

    switch (table) {
      case 'nodes':
        if (type === 'create') {
          await supabase.from('nodes').insert(data);
        } else if (type === 'update') {
          await supabase.from('nodes').update(data).eq('id', data.id);
        } else if (type === 'delete') {
          await supabase.from('nodes').delete().eq('id', data.id);
        }
        break;

      case 'links':
        if (type === 'create') {
          await supabase.from('links').insert(data);
        } else if (type === 'update') {
          await supabase.from('links').update(data).eq('id', data.id);
        } else if (type === 'delete') {
          await supabase.from('links').delete().eq('id', data.id);
        }
        break;

      case 'workspaces':
        if (type === 'create') {
          await supabase.from('workspaces').insert(data);
        } else if (type === 'update') {
          await supabase.from('workspaces').update(data).eq('id', data.id);
        } else if (type === 'delete') {
          await supabase.from('workspaces').delete().eq('id', data.id);
        }
        break;

      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
  }
}
