import { COLORS } from './design-tokens.js';

// 放铳率专用颜色（危险导向：高于基准=红）
export function getDealRateColor(deviation, threshold) {
    if (deviation > threshold * 2) return COLORS.dealRate.strong;
    if (deviation > threshold)     return COLORS.dealRate.mid;
    if (deviation > 0)             return COLORS.dealRate.weak;
    if (deviation < 0)             return COLORS.dealRate.good;
    return COLORS.dealRate.neutral;
}

// 其他指标通用颜色（中性亮度：偏差越大越亮，无好坏含义）
export function getColor(deviation, threshold) {
    var absValue = Math.abs(deviation);
    if (absValue > threshold * 2) return COLORS.deviation.bright;
    if (absValue > threshold)     return COLORS.deviation.mid;
    if (absValue > 0)             return COLORS.deviation.dim;
    return COLORS.deviation.neutral;
}
