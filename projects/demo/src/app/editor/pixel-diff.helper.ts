export interface PixelDiff {
  x: number;
  y: number;
  color: string;
}

export class PixelDiffHelper {
  static computePixelDiffs(
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

  static convertPixelDiffsToImageData(
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
}
