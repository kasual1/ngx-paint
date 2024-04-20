import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  hsvToRgb(h: number, s: number, v: number) {
    s /= 100;
    v /= 100;

    const i = ~~(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));
    const index = i % 6;

    const r = Math.trunc([v, q, p, p, t, v][index] * 255);
    const g = Math.trunc([t, v, v, q, p, p][index] * 255);
    const b = Math.trunc([p, p, t, v, v, q][index] * 255);
    return { r, g, b };
  }

  rgbToHex(r: number, g: number, b: number, a: number = 1) {
    const [rr, gg, bb, aa] = [r, g, b, Math.round(a * 255)].map((v) => v.toString(16).padStart(2, "0"));
    return ["#", rr, gg, bb, aa === "ff" ? "" : aa].join("");
  }

  hexToRgb(hex: string) {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16),
    };
  }

  rgbToHsv(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }

    return { h, s: s * 100, v: v * 100 };
  }

  hexToHsv(hex: string) {
    const { r, g, b } = this.hexToRgb(hex);
    return this.rgbToHsv(r, g, b);
  }

}
