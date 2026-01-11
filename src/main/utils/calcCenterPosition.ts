import type { Size } from "../../shared/types/Size";

export function calcCenterPosition(
  workAreaSize: Size,
  windowSize: Size
): [number, number] {
  const x = Math.floor((workAreaSize.width - windowSize.width) / 2);
  const y = Math.floor((workAreaSize.height - windowSize.height) / 2);
  return [x, y];
}
