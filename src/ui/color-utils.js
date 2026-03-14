// 根据偏差值计算颜色深浅
export function getColor(deviation, threshold) {
    var absValue = Math.abs(deviation);
    if (deviation > 0) {
        // 正偏差：红色，越大越红
        if (absValue > threshold * 2) return '#ff4444';
        if (absValue > threshold) return '#ff6b6b';
        return '#ff9999';
    } else if (deviation < 0) {
        // 负偏差：绿色，越大越绿
        if (absValue > threshold * 2) return '#44ff44';
        if (absValue > threshold) return '#51cf66';
        return '#99ff99';
    } else {
        return '#aaa';
    }
}
