import "server-only";
import QRCode from "qrcode";

/** A QR code for `text` as a PNG data URL (img-src already allows data:). Dark modules on white, with a quiet zone. */
export function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 320, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
}
