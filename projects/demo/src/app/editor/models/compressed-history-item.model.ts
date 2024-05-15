import { BrushOptions } from "lib";
import { PixelDiff } from "./pixel-diff.model";

export interface CompressedHistoryItem {
  timestamp: Date;
  brushOptions: BrushOptions;
  pixelDiff: PixelDiff[];
}
