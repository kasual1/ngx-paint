/// <reference lib="webworker" />

import { BrushOptions, HistoryItem } from 'lib';

interface PixelDiff {
  x: number;
  y: number;
  color: string;
}

interface CompressedHistoryItem {
  uuid: string;
  brushOptions: BrushOptions;
  pixelDiff: PixelDiff[];
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

let previousImage: ImageData | undefined = undefined;

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
      restoreHistory();
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

  let pixelDiff = computePixelDiffs(previousImage, data.item.snapshot);
  previousImage = data.item.snapshot;


  const compressedItem: CompressedHistoryItem = {
     uuid: data.item.uuid,
     brushOptions: data.item.brushOptions,
     pixelDiff: pixelDiff
   };

  const addItemRequest = store.add(compressedItem);

  addItemRequest.onsuccess = function () {
    console.log('Successfully added item to history:', compressedItem);
  };

  addItemRequest.onerror = function () {
    console.error('Error adding item to history:', addItemRequest.error);
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

function restoreHistory() {
  const transaction = db!.transaction('history', 'readonly');
  const store = transaction.objectStore('history');
  const request = store.getAll();

  request.onsuccess = function () {
    postMessage({ type: 'restoreHistory', data: request.result });
  };

  request.onerror = function () {
    console.error('Error restoring history:', request.error);
  };
}

function computePixelDiffs(image1?: ImageData, image2?: ImageData): PixelDiff[]{
  if(!image1 || !image2){
    return [];
  }

  const diffs: PixelDiff[] = [];
  for (let i = 0; i < image1.data.length; i += 4) {
    if (image1.data[i] !== image2.data[i] ||
        image1.data[i + 1] !== image2.data[i + 1] ||
        image1.data[i + 2] !== image2.data[i + 2] ||
        image1.data[i + 3] !== image2.data[i + 3]) {
      diffs.push({
        x: (i / 4) % image1.width,
        y: Math.floor((i / 4) / image1.width),
        color: `rgba(${image1.data[i]}, ${image1.data[i + 1]}, ${image1.data[i + 2]}, ${image1.data[i + 3]})`
      });
    }
  }
  return diffs;
}
