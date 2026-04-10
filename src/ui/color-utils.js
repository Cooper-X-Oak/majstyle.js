import { COLORS } from './design-tokens.js';

// 根据偏差值计算颜色深浅
export function getColor(deviation, threshold) {
    var absValue = Math.abs(deviation);
    if (deviation > 0) {
        if (absValue > threshold * 2) return COLORS.deviation.posStrong;
        if (absValue > threshold)     return COLORS.deviation.posMid;
        return COLORS.deviation.posWeak;
    } else if (deviation < 0) {
        if (absValue > threshold * 2) return COLORS.deviation.negStrong;
        if (absValue > threshold)     return COLORS.deviation.negMid;
        return COLORS.deviation.negWeak;
    } else {
        return COLORS.deviation.neutral;
    }
}
