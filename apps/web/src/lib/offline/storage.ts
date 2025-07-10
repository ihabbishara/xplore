// Offline Storage Utility
// Simple localStorage wrapper for offline data persistence

interface OfflineStorage {
  setItem: (key: string, value: any) => Promise<void>;
  getItem: (key: string) => Promise<any>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
}

class LocalStorageWrapper implements OfflineStorage {
  private prefix = 'xplore_offline_';

  async setItem(key: string, value: any): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error('Failed to save to offline storage:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<any> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (item === null) return null;
      return JSON.parse(item);
    } catch (error) {
      console.error('Failed to read from offline storage:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Failed to remove from offline storage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      keys.forEach(key => {
        localStorage.removeItem(this.prefix + key);
      });
    } catch (error) {
      console.error('Failed to clear offline storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ''));
        }
      }
      return keys;
    } catch (error) {
      console.error('Failed to get all keys from offline storage:', error);
      return [];
    }
  }
}

// Export singleton instance
export const offlineStorage = new LocalStorageWrapper();