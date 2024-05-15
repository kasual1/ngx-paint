/// <reference lib="webworker" />

import { BrushOptions, HistoryItem } from 'lib';
import { HistoryItemHelper } from '../helpers/history-item.helper';
import { IndexedDbHelper } from '../helpers/indexeddb.helper';
import { HistoryAction } from '../enums/history-action.enum';
import { HistoryCompletion } from '../enums/history-completion.enum';

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

interface Painting {
  id: string;
  title: string;
  canvas: {
    resolution: string;
    width: number;
    height: number;
  };
}

const messageHandlers: {[key in HistoryAction]: (data: any) => void} = {
  [HistoryAction.Initialize]: initialize,
  [HistoryAction.PushToHistory]: pushToHistory,
  [HistoryAction.PopFromHistoryUntilHistoryItem]: popFromHistoryUntilHistoryItem,
  [HistoryAction.RestoreHistory]: restoreHistory,
};

const defaultHandler = (data: any) => console.error(`No handler for message type "${data.type}"`);

addEventListener('message', ({data}) => {
  const handler = messageHandlers[data.type as HistoryAction] || defaultHandler;
  handler(data);
});

function initialize() {
  IndexedDbHelper.initialize().then(() => {
    postMessage({ type: HistoryCompletion.Initialized });
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
    postMessage({ type: HistoryCompletion.PushedToHistory, item: historyItem });
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
    postMessage({ type: HistoryCompletion.PoppedFromHistoryUntilHistoryItem, item: data.item });
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

      postMessage({ type: HistoryCompletion.RestoredHistory, historyItems });
    });
}
