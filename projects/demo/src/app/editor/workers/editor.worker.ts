/// <reference lib="webworker" />

import { BrushOptions, HistoryItem } from 'lib';
import { HistoryItemHelper } from '../helpers/history-item.helper';
import { IndexedDbHelper } from '../helpers/indexeddb.helper';
import { WorkerActionMessage } from '../enums/worker-action-message.enum';
import { WorkerCompletionMessage } from '../enums/worker-completion-message.enum';

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

const messageHandlers: {[key in WorkerActionMessage]: (data: any) => void} = {
  [WorkerActionMessage.InitializeIndexedDB]: initializeIndexedDB,
  [WorkerActionMessage.PushToHistory]: pushToHistory,
  [WorkerActionMessage.PopFromHistoryUntilHistoryItem]: popFromHistoryUntilHistoryItem,
  [WorkerActionMessage.RestoreHistory]: restoreHistory,
  [WorkerActionMessage.SavePainting]: savePainting,
  [WorkerActionMessage.RestorePainting]: restorePainting,
};

const defaultHandler = (data: any) => console.error(`No handler for message type "${data.type}"`);

addEventListener('message', ({data}) => {
  const handler = messageHandlers[data.type as WorkerActionMessage] || defaultHandler;
  handler(data);
});

function initializeIndexedDB() {
  IndexedDbHelper.initialize().then(() => {
    postMessage({ type: WorkerCompletionMessage.InitializedIndexedDB });
  });
}

function pushToHistory(data: PushToHistoryData) {
  const compressedItem: CompressedHistoryItem =
    HistoryItemHelper.createCompressedHistoryItem(data.item);
  const key = HistoryItemHelper.buildHistoryKey(
    data.painting.id,
    compressedItem.timestamp
  );

  IndexedDbHelper.saveObject('history', key, compressedItem).then((historyItem) => {
    postMessage({ type: WorkerCompletionMessage.PushedToHistory, item: historyItem });
  });
}

function popFromHistoryUntilHistoryItem(
  data: PopFromHistoryUntilHistoryItemData
) {
  const key = HistoryItemHelper.buildHistoryKey(
    data.painting.id,
    data.item.timestamp
  );

  IndexedDbHelper.deleteUntilKey('history', key).then(() => {
    postMessage({ type: WorkerCompletionMessage.PoppedFromHistoryUntilHistoryItem, item: data.item });
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

  IndexedDbHelper
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

      postMessage({ type: WorkerCompletionMessage.RestoredHistory, historyItems });
    });
}

function savePainting(data: SavePaintingData) {
  IndexedDbHelper
    .saveObject('painting', data.painting.id, data.painting)
    .then((id) => {
      postMessage({
        type: WorkerCompletionMessage.SavedPainting,
        id
      });
    });
}

function restorePainting(data: RestorePaintingData) {
  IndexedDbHelper.getObject('painting', data.id).then((painting) => {
    postMessage({ type: WorkerCompletionMessage.RestoredPainting, painting });
  });
}
