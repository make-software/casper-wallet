import { QRCodeCanvas } from 'qrcode.react';
import React from 'react';

/**
 * QR symbols are always rendered dark-on-light, in both themes.
 *
 * ISO/IEC 18004 defines a symbol as dark modules on a light background.
 * Reading an inverted (light-on-dark) symbol is an optional extra that many
 * decoders never attempt — ZXing, which backs most Android scanners, gives up
 * on them — so painting the code with the dark palette made it unscannable on
 * some phones (WALLET-1347). A mostly-dark screen also pushes the phone camera
 * into a longer exposure, which blooms the bright modules into their darker
 * neighbours.
 */
const QR_FOREGROUND_COLOR = '#000000';
const QR_BACKGROUND_COLOR = '#FFFFFF';

/**
 * Quiet zone, in modules. `qrcode.react` leaves it out by default, which left
 * us relying on the container's padding — and that padding is a fixed number
 * of pixels, so it silently drops below the 4 modules the spec requires as
 * soon as the modules get bigger.
 */
const QR_MARGIN_SIZE = 4;

/**
 * On a screen there is nothing to recover from: no print damage, no smudges.
 * The extra error correction of level `H` only buys density — a 200-char sync
 * chunk needs 77x77 modules at `H` against 57x57 at `M` — and density is what
 * actually breaks scanning on a small popup. `boostLevel` (on by default) still
 * upgrades the level for free whenever it fits in the same version.
 */
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
