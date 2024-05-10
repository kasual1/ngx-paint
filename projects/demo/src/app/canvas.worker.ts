/// <reference lib="webworker" />

import { HistoryItem } from '../../../lib/src/public-api';

interface PixelDiff {
  x: number;
  y: number;
  color: string;
}

interface StoreDiffMessage {
  canvas: { width: number; height: number };
  secondLastImageData: ImageData;
  lastImageData: ImageData;
}

addEventListener('message', ({ data }) => {
  switch (data.type) {
    case 'pushToHistory':
      pushToHistory(data);
      break;
    case 'popFromHistory':
      popFromHistory();
      break;
    case 'restoreHistory':
      restoreHistory();
      break;
  }
});

function pushToHistory({
  canvas,
  secondLastImageData,
  lastImageData,
}: StoreDiffMessage) {
  const diff = calculateImageDataDiff(secondLastImageData, lastImageData);
  storeInIndexedDB(
    'diffsDatabase',
    'diffsStore',
    'currentDiff',
    canvas,
    diff
  ).then(() => {
    postMessage({ type: 'pushToHistory' });
  });
}

function popFromHistory() {
  retrieveFromIndexedDB('diffsDatabase', 'diffsStore', 'currentDiff').then(
    (storedHistory: any) => {
      if (storedHistory && storedHistory.diffs.length > 0) {
        storedHistory.diffs.pop();

        storeInIndexedDB(
          'diffsDatabase',
          'diffsStore',
          'currentDiff',
          storedHistory.canvas,
          storedHistory.diffs
        ).then(() => {
          postMessage({ type: 'popFromHistory' });
        });
      }
    }
  );
}

function restoreHistory() {
  retrieveFromIndexedDB('diffsDatabase', 'diffsStore', 'currentDiff').then(
    (storedHistory: any) => {
      if(storedHistory === undefined) {
         postMessage({ type: 'restoreHistory', data: [] });
         return;
      }

      const restoredHistoryItems = convertDiffsToHistoryItems(
        storedHistory.diffs,
        storedHistory.canvas.width,
        storedHistory.canvas.height
      );
      postMessage({ type: 'restoreHistory', data: restoredHistoryItems });
    }
  );
}

function calculateImageDataDiff(
  oldImageData: ImageData,
  newImageData: ImageData
): PixelDiff[] {
  const pixelDiffs: PixelDiff[] = [];

  for (let y = 0; y < oldImageData.height; y++) {
    for (let x = 0; x < oldImageData.width; x++) {
      const index = (y * oldImageData.width + x) * 4;

      const oldPixel = oldImageData.data.slice(index, index + 4);
      const newPixel = newImageData.data.slice(index, index + 4);

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

function storeInIndexedDB(
  dbName: string,
  storeName: string,
  key: string,
  canvas: { width: number; height: number },
  value: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(dbName, 1);

    openRequest.onupgradeneeded = function () {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    openRequest.onsuccess = function () {
      const db = openRequest.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      const getRequest = store.get(key);

      getRequest.onsuccess = function () {
        const existingHistory = getRequest.result || { canvas, diffs: [] };
        existingHistory.diffs.push(value);
        const putRequest = store.put(existingHistory, key);

        putRequest.onsuccess = function () {
          resolve();
        };

        putRequest.onerror = function () {
          reject(putRequest.error);
        };
      };

      getRequest.onerror = function () {
        reject(getRequest.error);
      };
    };

    openRequest.onerror = function () {
      reject(openRequest.error);
    };
  });
}

function retrieveFromIndexedDB(
  dbName: string,
  storeName: string,
  key: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(dbName, 1);

    openRequest.onupgradeneeded = function () {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    openRequest.onsuccess = function () {
      const db = openRequest.result;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);

      const getRequest = store.get(key);

      getRequest.onsuccess = function () {
        resolve(getRequest.result);
      };

      getRequest.onerror = function () {
        reject(getRequest.error);
      };
    };

    openRequest.onerror = function () {
      reject(openRequest.error);
    };
  });
}

function convertDiffsToHistoryItems(
  diffs: PixelDiff[][],
  width: number,
  height: number
) {
  if (!diffs || diffs.length === 0) {
    return [];
  }

  const historyItems: HistoryItem[] = [];

  let mostRecentHistoryItem: HistoryItem | null = null;

  diffs.forEach((diff) => {
    const historyItem = convertDiffToHistoryItem(
      width,
      height,
      diff,
      mostRecentHistoryItem?.snapshot
    );
    historyItems.push(historyItem);
    mostRecentHistoryItem = historyItem;
  });

  return historyItems;
}

function convertDiffToHistoryItem(
  width: number,
  height: number,
  diffs: PixelDiff[],
  mostRecentImaeData?: ImageData
) {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');

  if (context) {
    canvas.width = width;
    canvas.height = height;

    if (mostRecentImaeData) {
      context.putImageData(mostRecentImaeData, 0, 0);
    }

    diffs.forEach(({ x, y, color }) => {
      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    });

    return {
      snapshot: context.getImageData(0, 0, width, height),
      brushOptions: {
        color: '#000000',
        size: 5,
      },
    };
  } else {
    throw new Error('Could not get 2D context');
  }
}

// saveUndoStack() {
//   const simplifiedUndoStack = this.undoStack.map(item => ({
//     brushOptions: item.brushOptions
//   }));

//   localStorage.setItem('undoStack', JSON.stringify(simplifiedUndoStack));
// }

// loadUndoStack() {
//   const savedUndoStack = localStorage.getItem('undoStack');

//   if (savedUndoStack) {
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');

//     canvas.width = this.canvas!.width;
//     canvas.height = this.canvas!.height;

//     this.undoStack = JSON.parse(savedUndoStack).map((item: any) => {
//       this.applyCanvasDiff(context!, item.diffs);

//       return {
//         canvas: CanvasHelper.copyCanvas(canvas),
//         diffs: item.diffs,
//         brushOptions: item.brushOptions
//       };
//     });

//     // Restore the canvas state to the last item in the undo stack
//     if (this.undoStack.length > 0) {
//       const lastItem = this.undoStack[this.undoStack.length - 1];
//       this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
//       this.context!.drawImage(lastItem.canvas, 0, 0);
//       this.brush = new Brush('Brush', lastItem.brushOptions);
//     }
//   }
// }
