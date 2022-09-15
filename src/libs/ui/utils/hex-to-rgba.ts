// https://css-tricks.com/converting-color-spaces-in-javascript/#aa-hex-to-rgb
export function hexToRGBA(hex: string, alpha: string) {
  let red = null;
  let green = null;
  let blue = null;

  // 3 digits
  if (hex.length === 4) {
    red = '0x' + hex[1] + hex[1];
    green = '0x' + hex[2] + hex[2];
    blue = '0x' + hex[3] + hex[3];

    // 6 digits
  } else if (hex.length === 7) {
    red = '0x' + hex[1] + hex[2];
    green = '0x' + hex[3] + hex[4];
    blue = '0x' + hex[5] + hex[6];
  }

  return `rgba(${Number(red)}, ${Number(green)}, ${Number(blue)}, ${alpha})`;
}
