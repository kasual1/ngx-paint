/// <reference lib="webworker" />

import { HistoryItem } from '../../../lib/src/public-api';

interface PixelDiff {
  x: number;
  y: number;
  color: string;
}

interface PushToHistoryData {
  type: 'pushToHistory';
  item: HistoryItem;
}

interface PopFromHistoryUntilHistoryItemData {
  type: 'popFromHistoryUntilIndex';
  item: HistoryItem;
}

let db: IDBDatabase | null = null;

addEventListener('message', ({ data }) => {
  switch (data.type) {
    case 'initializeIndexedDB':
      initializeIndexedDB();
      break;
    case 'pushToHistory':
      pushToHistory(data);
      break;
    case 'popFromHistoryUntilHistoryItem':
      popFromHistoryUntilHistoryItem(data);
      break;
    case 'restoreHistory':
      break;
  }
});

function initializeIndexedDB() {
  const request = indexedDB.open('PAINT_OVER_DB', 1);

  request.onupgradeneeded = function (event) {
    db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains('history')) {
      db.createObjectStore('history', { autoIncrement: true });
    }

    if (!db.objectStoreNames.contains('paintings')) {
      db.createObjectStore('paintings', { autoIncrement: true });
    }
  };

  request.onsuccess = function (event) {
    db = (event.target as IDBOpenDBRequest).result;
    postMessage({ type: 'initializeIndexedDB' });
  };

  request.onerror = function (event) {
    console.error(
      'Error opening IndexedDB:',
      (event.target as IDBOpenDBRequest).error
    );
  };
}

function pushToHistory(data: PushToHistoryData) {
  const transaction = db!.transaction('history', 'readwrite');
  const store = transaction.objectStore('history');
  const request = store.add(data.item);

  request.onsuccess = function () {
    console.log('Successfully added item to history:', data.item);
  };

  request.onerror = function () {
    console.error('Error adding item to history:', request.error);
  };
}

function popFromHistoryUntilHistoryItem(data: PopFromHistoryUntilHistoryItemData) {
  const transaction = db!.transaction('history', 'readwrite');
  const store = transaction.objectStore('history');
  const request = store.openCursor(null, 'prev');

  request.onsuccess = function () {
    const cursor = request.result;
    if (cursor) {
      debugger;
      if ((cursor.value as HistoryItem).uuid !== data.item.uuid) {
        cursor.delete();
        cursor.continue();
      }
    }
  };

  request.onerror = function () {
    console.error('Error popping items from history:', request.error);
  };
}
