import { QRCodeCanvas } from 'qrcode.react';
import React from 'react';

// Dark-on-light in both themes: reading an inverted symbol is an optional extra
// that many decoders (ZXing, behind most Android scanners) never attempt.
const QR_FOREGROUND_COLOR = '#000000';
const QR_BACKGROUND_COLOR = '#FFFFFF';

// Quiet zone, in modules. `qrcode.react` omits it, and the container's padding is a
// fixed pixel count that drops below the spec's 4 modules as they grow.
const QR_MARGIN_SIZE = 4;

// Nothing to recover from on a screen, and `H` only buys density — which is what
// breaks scanning in a small popup. `boostLevel` still upgrades it where it fits.
const QR_ERROR_CORRECTION_LEVEL = 'M';

interface QrCodeProps {
  value: string;
  size: number;
}

export const QrCode = ({ value, size }: QrCodeProps) => (
  <QRCodeCanvas
    value={value}
    size={size}
    fgColor={QR_FOREGROUND_COLOR}
    bgColor={QR_BACKGROUND_COLOR}
    marginSize={QR_MARGIN_SIZE}
    level={QR_ERROR_CORRECTION_LEVEL}
  />
);
