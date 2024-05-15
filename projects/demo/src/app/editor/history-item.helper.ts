import { BrushOptions, HistoryItem } from 'lib';
import { PixelDiff, PixelDiffHelper } from './pixel-diff.helper';

interface CompressedHistoryItem {
  timestamp: Date;
  brushOptions: BrushOptions;
  pixelDiff: PixelDiff[];
}

export class HistoryItemHelper {
  private static previousImage: ImageData | undefined = undefined;

  static buildHistoryKey(prefix: string, timestamp: Date) {
    return `${prefix}-${timestamp.getTime()}`;
  }

  static createCompressedHistoryItem(item: HistoryItem): CompressedHistoryItem {
    const compressedItem: CompressedHistoryItem = {
      timestamp: item.timestamp,
      brushOptions: item.brushOptions,
      pixelDiff: PixelDiffHelper.computePixelDiffs(
        this.previousImage,
        item.snapshot
      ),
    };

    this.previousImage = item.snapshot;

    return compressedItem;
  }

  static createHistoryItem(
    compressedItem: CompressedHistoryItem,
    canvasWidth: number,
    canvasHeight: number
  ): HistoryItem {
    this.previousImage = PixelDiffHelper.convertPixelDiffsToImageData(
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
}
