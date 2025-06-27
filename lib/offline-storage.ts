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

class OfflineStorage {
  private dbName = 'KagitaNotesDB';
  private version = 1;
  private db: IDBDatabase | null = null;

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

  async saveSetting(key: string, value: any): Promise<void> {
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
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
    });
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
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

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
