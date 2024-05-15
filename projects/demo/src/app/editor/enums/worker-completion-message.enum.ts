export enum WorkerCompletionMessage {
  InitializedIndexedDB = 'initializedIndexedDB',
  PushedToHistory = 'pushedToHistory',
  PoppedFromHistoryUntilHistoryItem = 'poppedFromHistoryUntilHistoryItem',
  RestoredHistory = 'restoredHistory',
  SavedPainting = 'savedPainting',
  RestoredPainting = 'restoredPainting',
}
