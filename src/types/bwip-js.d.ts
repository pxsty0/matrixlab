declare module "bwip-js" {
  export interface ToCanvasOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: "left" | "center" | "right" | "off";
    textyalign?: "below" | "above" | "center" | "off";
    backgroundcolor?: string;
    paddingwidth?: number;
    paddingheight?: number;
    [key: string]: any;
  }

  export function toCanvas(
    canvas: HTMLCanvasElement | string,
    options: ToCanvasOptions,
  ): HTMLCanvasElement;

  export function toDataURL(options: ToCanvasOptions): string;
}
