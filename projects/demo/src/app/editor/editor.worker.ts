/// <reference lib="webworker" />

import { BrushOptions, HistoryItem } from 'lib';

interface PixelDiff {
  x: number;
  y: number;
  color: string;
}

interface CompressedHistoryItem {
  timestamp: Date;
  brushOptions: BrushOptions;
  pixelDiff: PixelDiff[];
}

interface PushToHistoryData {
  type: 'pushToHistory';
  painting: Painting;
  item: HistoryItem;
}


interface PopFromHistoryUntilHistoryItemData {
  type: 'popFromHistoryUntilIndex';
  painting: Painting;
  item: HistoryItem;
}

interface RestoreHistoryData {
  type: 'restoreHistory';
  painting: Painting;
  width: number;
  height: number;
}


interface SavePaintingData {
  type: 'savePaintingMetaData';
  painting: Painting;
}

interface RestorePaintingData {
  type: 'restorePainting';
  id: string;
}

interface Painting {
  id: string;
  title: string;
  canvas: {
    resolution: string;
    width: number;
    height: number;
  };
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
    case 'savePainting':
      savePainting(data);
      break;
    case 'restorePainting':
      restorePainting(data);
      break;
  }
});

function initializeIndexedDB() {
  const request = indexedDB.open('PAINT_OVER_DB', 1);

  request.onupgradeneeded = function (event) {
    db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains('history')) {
      db.createObjectStore('history', { autoIncrement: false });
    }

    if (!db.objectStoreNames.contains('painting')) {
      db.createObjectStore('painting', { keyPath: 'id'});
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
    timestamp: data.item.timestamp,
    brushOptions: data.item.brushOptions,
    pixelDiff: pixelDiff,
  };

  const addItemRequest = store.add(compressedItem, buildHistoryKey(data.painting.id, compressedItem.timestamp));

  addItemRequest.onsuccess = function () {
    postMessage({ type: 'pushToHistory', item: data.item });
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
      if ( cursor.key !== buildHistoryKey(data.painting.id, data.item.timestamp)	) {
        cursor.delete();
        cursor.continue();
      }
    }

    postMessage({ type: 'popFromHistoryUntilHistoryItem', item: data.item });
  };

  request.onerror = function () {
    console.error('Error popping items from history:', request.error);
  };
}

function restoreHistory(data: RestoreHistoryData) {

  const start = performance.now();
  const transaction = db!.transaction('history', 'readonly');
  const store = transaction.objectStore('history');

  const lowerBound = `${data.painting.id}-`;
  const upperBound = `${data.painting.id}-${new Date().getTime()}`;
  const keyRange = IDBKeyRange.bound(lowerBound, upperBound);

  const request = store.getAll(keyRange);

  request.onsuccess = function () {
    const compressedHistoryItems = request.result as CompressedHistoryItem[];
    const historyItems: HistoryItem[] = [];

    for (let i = 0; i < compressedHistoryItems.length; i++) {
      const compressedItem = compressedHistoryItems[i];

      previousImage = convertPixelDiffsToImageData(
        compressedItem.pixelDiff,
        previousImage,
        data.painting.canvas.width,
        data.painting.canvas.height
      );

      const item: HistoryItem = {
        timestamp: compressedItem.timestamp,
        brushOptions: compressedItem.brushOptions,
        snapshot: previousImage,
      };
      historyItems.push(item);
    }
    const end = performance.now();
    postMessage({ type: 'restoreHistory', historyItems, time: end - start });
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
  let newImage;
  if (!previousImage) {
    newImage = new ImageData(width, height);
  } else {
    newImage = new ImageData(previousImage.data.slice(), width, height);
  }

  for (let i = 0; i < diffs.length; i++) {
    const diff = diffs[i];
    const index = (diff.y * width + diff.x) * 4;
    const colorComponents = diff.color.match(/[\d\.]+/g);
    if (colorComponents) {
      newImage.data[index] = parseInt(colorComponents[0]);
      newImage.data[index + 1] = parseInt(colorComponents[1]);
      newImage.data[index + 2] = parseInt(colorComponents[2]);
      newImage.data[index + 3] = colorComponents[3]
        ? Math.ceil(parseFloat(colorComponents[3]) * 255)
        : 255;
    }
  }

  return newImage;
}

function savePainting(data: SavePaintingData) {
  const transaction = db!.transaction('painting', 'readwrite');
  const store = transaction.objectStore('painting');
  const request = store.put(data.painting);
  request.onsuccess = function () {
    postMessage({
      type: 'savePainting',
      painting: data.painting,
    });
  };

  request.onerror = function () {
    console.error('Error saving painting:', request.error);
  };
}

function restorePainting(data: RestorePaintingData) {
  const transaction = db!.transaction('painting', 'readonly');
  const store = transaction.objectStore('painting');
  const request = store.get(data.id);

  request.onsuccess = function () {
    postMessage({ type: 'restorePainting', painting: request.result });
  };

  request.onerror = function () {
    console.error('Error restoring painting:', request.error);
  };
}

function buildHistoryKey(prefix: string, timestamp: Date) {
  return `${prefix}-${timestamp.getTime()}`;
}
