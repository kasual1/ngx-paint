import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IndexedDbHelper {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('PAINT_OVER_DB', 1);

      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        if (!this.db.objectStoreNames.contains('history')) {
          this.db.createObjectStore('history', { autoIncrement: false });
        }

        if (!this.db.objectStoreNames.contains('painting')) {
          this.db.createObjectStore('painting', { autoIncrement: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async saveObject(storeName: string, key: string, value: any): Promise<any> {
    if (!this.db) {
      console.error('Database not opened');
      return;
    }

    return new Promise<any>((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getObject(storeName: string, key: string): Promise<any> {
    if (!this.db) {
      console.error('Database not opened');
      return;
    }

    return new Promise<any>((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getObjectsWithinRange(
    storeName: string,
    lowerBound: string,
    upperBound: string
  ): Promise<any[]> {
    if (!this.db) {
      console.error('Database not opened');
      return [];
    }

    return new Promise<any[]>((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const keyRange = IDBKeyRange.bound(lowerBound, upperBound);
      const request = store.getAll(keyRange);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteUntilKey(storeName: string, key: string): Promise<void> {
    if (!this.db) {
      console.error('Database not opened');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor(null, 'prev');

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (cursor.key !== key) {
            cursor.delete();
            cursor.continue();
          }
        }

        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting items:', request.error);
        reject(request.error);
      };
    });
  }
}
