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

interface RestoreHistoryData {
  type: 'restoreHistory';
  width: number;
  height: number;
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
      restoreHistory(data);
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
    pixelDiff: pixelDiff,
  };

  const addItemRequest = store.add(compressedItem);

  addItemRequest.onsuccess = function () {
    console.log('Successfully added item to history:', compressedItem);
  };

  addItemRequest.onerror = function () {
    console.error('Error adding item to history:', addItemRequest.error);
  };
}

function popFromHistoryUntilHistoryItem(
  data: PopFromHistoryUntilHistoryItemData
) {
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

function restoreHistory(data: RestoreHistoryData) {
  const transaction = db!.transaction('history', 'readonly');
  const store = transaction.objectStore('history');
  const request = store.getAll();

  request.onsuccess = function () {
    const compressedHistoryItems = request.result as CompressedHistoryItem[];
    const historyItems: HistoryItem[] = [];

    for (let i = 0; i < compressedHistoryItems.length; i++) {
      const compressedItem = compressedHistoryItems[i];

      previousImage = convertPixelDiffsToImageData(
        compressedItem.pixelDiff,
        previousImage,
        data.width,
        data.height
      );

      const item: HistoryItem = {
        uuid: compressedItem.uuid,
        brushOptions: compressedItem.brushOptions,
        snapshot: previousImage
      };
      historyItems.push(item);
    }
    postMessage({ type: 'restoreHistory', historyItems });
  };

  request.onerror = function () {
    console.error('Error restoring history:', request.error);
  };
}

function computePixelDiffs(
  image1?: ImageData,
  image2?: ImageData
): PixelDiff[] {
  if (!image1 || !image2) {
    return [];
  }

  const pixelDiffs: PixelDiff[] = [];

  for (let y = 0; y < image1!.height; y++) {
    for (let x = 0; x < image1!.width; x++) {
      const index = (y * image1!.width + x) * 4;

      const oldPixel = image1!.data.slice(index, index + 4);
      const newPixel = image2!.data.slice(index, index + 4);

      if (oldPixel.join(',') !== newPixel.join(',')) {
        const [r, g, b, a] = newPixel;
        const alpha = a / 255; // Normalize alpha to 0-1 range
        pixelDiffs.push({
          x,
          y,
          color: `rgba(${r},${g},${b},${alpha})`,
        });
      }
    }
  }

  return pixelDiffs;
}

function convertPixelDiffsToImageData(
  diffs: PixelDiff[],
  previousImage: ImageData | undefined,
  width: number,
  height: number
): ImageData {
  const offscreenCanvas = new OffscreenCanvas(width, height);
  const ctx = offscreenCanvas.getContext('2d')!;

  if (previousImage) {
    ctx.putImageData(previousImage, 0, 0);
  }

  for (let i = 0; i < diffs.length; i++) {
    const diff = diffs[i];
    ctx.fillStyle = diff.color;
    ctx.fillRect(diff.x, diff.y, 1, 1);
  }

  const newImage = ctx.getImageData(0, 0, width, height);

  return newImage;
}
