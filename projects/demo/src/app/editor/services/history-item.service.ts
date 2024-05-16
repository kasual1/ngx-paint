import { HistoryItem } from 'lib';
import { PixelDiffService } from './pixel-diff.service';
import { Injectable } from '@angular/core';
import { CompressedHistoryItem } from '../models/compressed-history-item.model';

@Injectable({
  providedIn: 'root',
})
export class HistoryItemService {
  private previousImage: ImageData | undefined = undefined;

  constructor(private pixelDiffService: PixelDiffService) {}

  buildHistoryKey(prefix: string, timestamp: Date) {
    return `${prefix}-${timestamp.getTime()}`;
  }

  createCompressedHistoryItem(item: HistoryItem): CompressedHistoryItem {
    const compressedItem: CompressedHistoryItem = {
      timestamp: item.timestamp,
      brushOptions: item.brushOptions,
      pixelDiff: this.pixelDiffService.computePixelDiffs(
        this.previousImage,
        item.snapshot
      ),
    };

    this.previousImage = item.snapshot;

    return compressedItem;
  }

  createHistoryItem(
    compressedItem: CompressedHistoryItem,
    canvasWidth: number,
    canvasHeight: number
  ): HistoryItem {
    this.previousImage = this.pixelDiffService.convertPixelDiffsToImageData(
      compressedItem.pixelDiff,
      this.previousImage,
      canvasWidth,
      canvasHeight
    );

    const item: HistoryItem = {
      timestamp: compressedItem.timestamp,
      brushOptions: compressedItem.brushOptions,
      snapshot: this.previousImage!,
    };

    return item;
  }

  convertCompressedHistoryItemsToHistoryItems(
    compressedItems: CompressedHistoryItem[],
    canvasWidth: number,
    canvasHeight: number
  ): HistoryItem[] {
    return compressedItems.map((compressedItem) =>
      this.createHistoryItem(compressedItem, canvasWidth, canvasHeight)
    );
  }
}
