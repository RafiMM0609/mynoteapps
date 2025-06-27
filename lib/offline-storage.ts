// Offline storage utilities for PWA
// This helps manage data when the app is offline

interface OfflineNote {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  userId: string;
  synced: boolean;
}

interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'note' | 'setting';
  entityId: string;
  data: any;
  timestamp: number;
  attempts: number;
}

interface OfflineSettings {
  key: string;
  value: any;
}

// Create and export the class for typing
export class OfflineStorage {
  private dbName = 'KagitaNotesDB';
  private version = 2; // Increased version to handle schema updates
  private db: IDBDatabase | null = null;
  private syncInProgress = false;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('userId', 'userId', { unique: false });
          notesStore.createIndex('synced', 'synced', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncQueueStore.createIndex('entityType', 'entityType', { unique: false });
          syncQueueStore.createIndex('attempts', 'attempts', { unique: false });
        }
      };
    });
  }

  async saveNote(note: OfflineNote): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.put(note);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getNote(id: string): Promise<OfflineNote | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllNotes(userId: string): Promise<OfflineNote[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getUnsyncedNotes(userId: string): Promise<OfflineNote[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allNotes = request.result || [];
        const unsyncedNotes = allNotes.filter(
          note => note.userId === userId && !note.synced
        );
        resolve(unsyncedNotes);
      };
    });
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async markAsSynced(id: string): Promise<void> {
    const note = await this.getNote(id);
    if (note) {
      note.synced = true;
      await this.saveNote(note);
    }
  }

  // Sync Queue methods
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>): Promise<string> {
    if (!this.db) await this.init();
    
    const syncItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      attempts: 0
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(syncItem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(syncItem.id);
    });
  }
  
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }
  
  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async updateSyncQueueItemAttempts(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      // First get the item
      const getRequest = store.get(id);
      
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          return reject(new Error('Sync queue item not found'));
        }
        
        // Update attempts count
        item.attempts += 1;
        
        // Put back the updated item
        const putRequest = store.put(item);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      };
    });
  }
  
  // Settings management
  async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value ?? null);
    });
  }
  
  // Last sync timestamp tracking
  async updateLastSyncTimestamp(): Promise<void> {
    return this.setSetting('lastSyncTimestamp', Date.now());
  }
  
  async getLastSyncTimestamp(): Promise<number | null> {
    return this.getSetting('lastSyncTimestamp');
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['notes', 'settings'], 'readwrite');
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const notesStore = transaction.objectStore('notes');
        const request = notesStore.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      }),
      new Promise<void>((resolve, reject) => {
        const settingsStore = transaction.objectStore('settings');
        const request = settingsStore.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      })
    ]);
  }
  
  // Background sync processing
  async processSyncQueue(api: any): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress) {
      return { success: 0, failed: 0 };
    }
    
    try {
      this.syncInProgress = true;
      
      const queue = await this.getSyncQueue();
      let successCount = 0;
      let failedCount = 0;
      
      // Process items in order
      for (const item of queue) {
        try {
          // Skip items that have been attempted too many times (5 max attempts)
          if (item.attempts >= 5) {
            console.warn(`Sync item ${item.id} exceeded max attempts, removing from queue`);
            await this.removeSyncQueueItem(item.id);
            failedCount++;
            continue;
          }
          
          // Process based on operation type
          switch (item.operation) {
            case 'create':
              if (item.entityType === 'note') {
                await api.createNote(item.data);
              }
              break;
              
            case 'update':
              if (item.entityType === 'note') {
                await api.updateNote(item.entityId, item.data);
              }
              break;
              
            case 'delete':
              if (item.entityType === 'note') {
                await api.deleteNote(item.entityId);
              }
              break;
          }
          
          // If we reach here, the operation was successful
          await this.removeSyncQueueItem(item.id);
          successCount++;
          
        } catch (error) {
          console.error(`Failed to process sync item ${item.id}:`, error);
          await this.updateSyncQueueItemAttempts(item.id);
          failedCount++;
        }
      }
      
      // Update last sync timestamp if any items were processed
      if (successCount > 0) {
        await this.updateLastSyncTimestamp();
      }
      
      return { success: successCount, failed: failedCount };
    } finally {
      this.syncInProgress = false;
    }
  }
  
  // Mark a note as synced
  async markNoteSynced(id: string): Promise<void> {
    const note = await this.getNote(id);
    if (note) {
      note.synced = true;
      await this.saveNote(note);
    }
  }
  
  // Get offline status information
  async getOfflineStats(): Promise<{ unsyncedNotes: number; queueSize: number; lastSync: number | null }> {
    const [allQueue, lastSync] = await Promise.all([
      this.getSyncQueue(),
      this.getLastSyncTimestamp()
    ]);
    
    // Count unsynced notes
    const unsyncedNotesCount = allQueue.filter(item => 
      item.entityType === 'note' && ['create', 'update'].includes(item.operation)
    ).length;
    
    return {
      unsyncedNotes: unsyncedNotesCount,
      queueSize: allQueue.length,
      lastSync
    };
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Create and export singleton instance
const offlineStorageDefault = new OfflineStorage();
export default offlineStorageDefault;

// Helper functions for common operations
export const OfflineUtils = {
  // Save note for offline use
  saveNoteOffline: async (note: Omit<OfflineNote, 'synced'>) => {
    await offlineStorage.saveNote({ ...note, synced: false });
  },

  // Load notes from offline storage
  loadNotesOffline: async (userId: string): Promise<OfflineNote[]> => {
    return await offlineStorage.getAllNotes(userId);
  },

  // Sync offline notes with server
  syncWithServer: async (userId: string): Promise<{ success: number; failed: number }> => {
    const unsyncedNotes = await offlineStorage.getUnsyncedNotes(userId);
    let success = 0;
    let failed = 0;

    for (const note of unsyncedNotes) {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            title: note.title,
            content: note.content,
          }),
        });

        if (response.ok) {
          await offlineStorage.markAsSynced(note.id);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Failed to sync note:', error);
        failed++;
      }
    }

    return { success, failed };
  },

  // Check if app is offline
  isOffline: (): boolean => {
    return !navigator.onLine;
  },

  // Get storage usage
  getStorageUsage: async (): Promise<{ used: number; quota: number } | null> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  },
};
