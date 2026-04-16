import { COLORS } from "./design-tokens.js";

// 通用偏差颜色：越高越红，越低越绿
export function getDeviationColor(deviation, threshold) {
  if (deviation > threshold * 2) return COLORS.deviation.highStrong;
  if (deviation > threshold) return COLORS.deviation.highMid;
  if (deviation > 0) return COLORS.deviation.highWeak;
  if (deviation < -threshold * 2) return COLORS.deviation.lowStrong;
  if (deviation < -threshold) return COLORS.deviation.lowMid;
  if (deviation < 0) return COLORS.deviation.lowWeak;
  return COLORS.deviation.neutral;
}

// 放铳率专用：越低越好（防守强），所以取反
export function getDealInRateColor(deviation, threshold) {
  return getDeviationColor(-deviation, threshold);
}
