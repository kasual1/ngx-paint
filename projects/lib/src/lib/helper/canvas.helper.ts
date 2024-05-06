export class CanvasHelper {

  static drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  static createTintedImage(image: HTMLImageElement, color: string): HTMLImageElement {
    let canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    let ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let tintedImage = new Image();
    tintedImage.src = canvas.toDataURL();

    return tintedImage;
  }

  static emptyCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const offScreenCanvas = document.createElement('canvas');
    offScreenCanvas.width = canvas.width;
    offScreenCanvas.height = canvas.height;

    return offScreenCanvas;
  }

  static copyCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const offScreenCanvas = document.createElement('canvas');
    const offScreenContext = offScreenCanvas.getContext('2d')!;

    offScreenCanvas.width = canvas.width;
    offScreenCanvas.height = canvas.height;
    offScreenContext.drawImage(canvas, 0, 0);

    return offScreenCanvas
  }

}
