import bwipjs from "bwip-js";
import { toast } from "react-toastify";

export const renderDataMatrixToCanvas = (
  canvas: HTMLCanvasElement,
  text: string,
): void => {
  if (!canvas || !text) return;

  try {
    bwipjs.toCanvas(canvas, {
      bcid: "datamatrix",
      text,
      scale: 3,
      height: 10,
      width: 10,
      includetext: false,
      textxalign: "center",
      backgroundcolor: "ffffff",
    });
  } catch (e) {
    toast.error("DataMatrix karekod oluşturulamadı: " + (e instanceof Error ? e.message : ""));
  }
};
