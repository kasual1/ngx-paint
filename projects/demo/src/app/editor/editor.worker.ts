/// <reference lib="webworker" />

import { BrushOptions, HistoryItem } from 'lib';
import { IndexedDb } from './indexeddb';
import { HistoryItemHelper } from './history-item.helper';

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

let indexedDb: IndexedDb;

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
  indexedDb = new IndexedDb();
  indexedDb.initialize().then(() => {
    postMessage({ type: 'initializeIndexedDB' });
  });
}

function pushToHistory(data: PushToHistoryData) {
  const compressedItem: CompressedHistoryItem =
    HistoryItemHelper.createCompressedHistoryItem(data.item);
  const key = HistoryItemHelper.buildHistoryKey(
    data.painting.id,
    compressedItem.timestamp
  );

  indexedDb.saveObject('history', key, compressedItem).then((historyItem) => {
    postMessage({ type: 'pushToHistory', item: historyItem });
  });
}

function popFromHistoryUntilHistoryItem(
  data: PopFromHistoryUntilHistoryItemData
) {
  const key = HistoryItemHelper.buildHistoryKey(
    data.painting.id,
    data.item.timestamp
  );

  indexedDb.deleteUntilKey('history', key).then(() => {
    postMessage({ type: 'popFromHistoryUntilHistoryItem', item: data.item });
  });
}

function restoreHistory(data: RestoreHistoryData) {
  const lowerBound = HistoryItemHelper.buildHistoryKey(
    data.painting.id,
    new Date(0)
  );
  const upperBound = HistoryItemHelper.buildHistoryKey(
    data.painting.id,
    new Date()
  );

  indexedDb
    .getObjectsWithinRange('history', lowerBound, upperBound)
    .then((compressedHistoryItems) => {
      const historyItems: HistoryItem[] = [];

      for (let i = 0; i < compressedHistoryItems.length; i++) {
        const item = HistoryItemHelper.createHistoryItem(
          compressedHistoryItems[i],
          data.painting.canvas.width,
          data.painting.canvas.height
        );
        historyItems.push(item);
      }

      postMessage({ type: 'restoreHistory', historyItems });
    });
}

function savePainting(data: SavePaintingData) {
  indexedDb
    .saveObject('painting', data.painting.id, data.painting)
    .then((id) => {
      postMessage({
        type: 'savePainting',
        id
      });
    });
}

function restorePainting(data: RestorePaintingData) {
  indexedDb.getObject('painting', data.id).then((painting) => {
    postMessage({ type: 'restorePainting', painting });
  });
}
