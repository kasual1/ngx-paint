/// <reference lib="webworker" />

import { IndexedDbHelper } from '../helpers/indexeddb.helper';
import { PaintingCompletion } from '../enums/painting-completion.enum copy';
import { PaintingAction } from '../enums/painting-action.enum copy';


const messageHandlers: {[key in PaintingAction]: (data: any) => void} = {
  [PaintingAction.Initialize]: initialize,
  [PaintingAction.SavePainting]: savePainting,
  [PaintingAction.RestorePainting]: restorePainting,
};

const defaultHandler = (data: any) => console.error(`No handler for message type "${data.type}"`);

addEventListener('message', ({data}) => {
  const handler = messageHandlers[data.type as PaintingAction] || defaultHandler;
  handler(data);
});

function initialize() {
  IndexedDbHelper.initialize().then(() => {
    postMessage({ type: PaintingCompletion.Initialized });
  });
}

function savePainting(data: {
  painting: Painting;
}) {
  IndexedDbHelper
    .saveObject('painting', data.painting.id, data.painting)
    .then((id) => {
      postMessage({
        type: PaintingCompletion.SavedPainting,
        id
      });
    });
}

function restorePainting(data: {
  id: string;
}) {
  IndexedDbHelper.getObject('painting', data.id).then((painting) => {
    postMessage({ type: PaintingCompletion.RestoredPainting, painting });
  });
}
