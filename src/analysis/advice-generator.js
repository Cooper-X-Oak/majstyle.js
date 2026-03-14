// 策略建议生成（增强版）
export function generateAdvice(analysis, stats) {
    return {
        危险度: calculateDangerLevel(analysis, stats),
        综合实力: assessOverallStrength(stats),
        进攻特征: analyzeOffensePattern(stats),
        防守能力: analyzeDefense(stats),
        立直质量: analyzeRiichiQuality(stats),
        副露质量: analyzeFuluQuality(stats),
        速度评估: analyzeSpeed(stats),
        隐蔽性: analyzeConcealment(stats),
        策略建议: generateStrategies(analysis, stats)
    };
}

// 综合实力评估（基于净打点效率）
function assessOverallStrength(stats) {
    var netEfficiency = stats['净打点效率'] || 0;
    var level = '';
    if (netEfficiency > 500) level = '强劲';
    else if (netEfficiency > 0) level = '中等';
    else level = '较弱';

    return {
        净打点效率: netEfficiency,
        打点效率: stats['打点效率'] || 0,
        铳点损失: stats['铳点损失'] || 0,
        评价: level,
        说明: '净打点效率 = 打点效率 - 铳点损失，综合反映实力'
    };
}

// 隐蔽性评估（基于默听率）
function analyzeConcealment(stats) {
    var motenRate = stats['默听率'] || 0;
    var level = '';
    if (motenRate > 0.15) level = '高隐蔽';
    else if (motenRate > 0.08) level = '中等';
    else level = '低隐蔽';

    return {
        默听率: (motenRate * 100).toFixed(1) + '%',
        评价: level,
        危险性: motenRate > 0.12 ? '需警惕无征兆进攻' : '进攻意图明显'
    };
}

// 速度评估（基于和了巡数）
function analyzeSpeed(stats) {
    var avgTurn = stats['和了巡数'] || 12;
    var speed = '';
    if (avgTurn < 11) speed = '快速';
    else if (avgTurn < 13) speed = '中速';
    else speed = '慢速';

    return {
        和了巡数: avgTurn.toFixed(1),
        速度类型: speed,
        立直巡目: (stats['立直巡目'] || 0).toFixed(1),
        评价: speed === '快速' ? '抢先进攻压力大' : '有时间布局'
    };
}

// 立直质量评估（增强版）
function analyzeRiichiQuality(stats) {
    var riichiProfit = stats['立直收支'] || 0;
    var riichiWinRate = stats['立直后和牌率'] || 0;
    var riichiDealRate = stats['立直后放铳率'] || 0;

    var quality = '';
    if (riichiProfit > 2000 && riichiWinRate > 0.45) quality = '高质量';
    else if (riichiProfit > 0) quality = '中等';
    else quality = '低质量';

    return {
        立直收支: riichiProfit,
        立直后和牌率: (riichiWinRate * 100).toFixed(1) + '%',
        立直后放铳率: (riichiDealRate * 100).toFixed(1) + '%',
        质量评价: quality,
        建议: quality === '高质量' ? '立直后建议立即弃牌' : '可适度对抗'
    };
}

// 副露质量评估（新增）
function analyzeFuluQuality(stats) {
    var fuluWinRate = stats['副露后和牌率'] || 0;
    var fuluDealRate = stats['副露后放铳率'] || 0;

    var quality = '';
    if (fuluWinRate > 0.35 && fuluDealRate < 0.15) quality = '高效';
    else if (fuluWinRate > 0.28) quality = '中等';
    else quality = '低效';

    return {
        副露后和牌率: (fuluWinRate * 100).toFixed(1) + '%',
        副露后放铳率: (fuluDealRate * 100).toFixed(1) + '%',
        质量评价: quality,
        建议: quality === '高效' ? '副露后威胁大' : '副露后可施压'
    };
}

// 进攻特征分析
function analyzeOffensePattern(stats) {
    var 立直率 = (stats['立直率'] || 0) * 100;
    var 副露率 = (stats['副露率'] || 0) * 100;
    var 自摸率 = (stats['自摸率'] || 0) * 100;

    var pattern = '';
    if (立直率 > 25 && 副露率 < 30) pattern = '立直主导';
    else if (副露率 > 38 && 立直率 < 20) pattern = '副露主导';
    else if (立直率 > 20 && 副露率 > 30) pattern = '混合进攻';
    else pattern = '保守进攻';

    return {
        立直率: 立直率.toFixed(1) + '%',
        副露率: 副露率.toFixed(1) + '%',
        自摸率: 自摸率.toFixed(1) + '%',
        进攻模式: pattern
    };
}

// 防守能力分析
function analyzeDefense(stats) {
    var 放铳率 = (stats['放铳率'] || 0) * 100;
    var 平均铳点 = stats['平均铳点'] || 5000;
    var 被炸率 = stats['被炸率'] || 0;

    var level = '';
    if (放铳率 < 13 && 平均铳点 < 5000) level = '强';
    else if (放铳率 < 15) level = '中等';
    else level = '弱';

    return {
        放铳率: 放铳率.toFixed(1) + '%',
        平均铳点: 平均铳点,
        被炸率: (被炸率 * 100).toFixed(1) + '%',
        防守等级: level,
        大牌防守: 被炸率 > 0.1 ? '差' : '好'
    };
}

// 危险度计算（增强版）
function calculateDangerLevel(analysis, stats) {
    var netEfficiency = stats['净打点效率'] || 0;
    var motenRate = stats['默听率'] || 0;
    var riichiProfit = stats['立直收支'] || 0;
    var avgDealPoint = stats['平均铳点'] || 5000;

    // 归一化到 0-10 分
    var efficiencyScore = Math.min(10, Math.max(0, (netEfficiency + 1000) / 200));
    var motenScore = motenRate * 50;
    var riichiScore = Math.min(10, Math.max(0, riichiProfit / 500));
    var dealScore = 10 - (avgDealPoint / 1000);

    var dangerLevel = (
        efficiencyScore * 0.4 +
        motenScore * 0.2 +
        riichiScore * 0.3 +
        dealScore * 0.1
    );

    dangerLevel = Math.round(Math.min(10, Math.max(0, dangerLevel)));

    var icon = '';
    var label = '';
    if (dangerLevel >= 9) { icon = '⚠️'; label = '极度危险'; }
    else if (dangerLevel >= 7) { icon = '⚡'; label = '较为危险'; }
    else if (dangerLevel >= 5) { icon = '➡️'; label = '正常水平'; }
    else if (dangerLevel >= 3) { icon = '✓'; label = '威胁较小'; }
    else { icon = '🎯'; label = '送分目标'; }

    return {
        分数: dangerLevel,
        图标: icon,
        标签: label
    };
}

// 综合策略建议生成
function generateStrategies(analysis, stats) {
    var strategies = [];

    // 基于综合实力
    var netEff = stats['净打点效率'] || 0;
    if (netEff > 500) {
        strategies.push('对手综合实力强，不建议正面硬刚');
    } else if (netEff < 0) {
        strategies.push('对手综合实力弱，可以积极施压');
    }

    // 基于隐蔽性
    var motenRate = stats['默听率'] || 0;
    if (motenRate > 0.12) {
        strategies.push('对手有较高默听倾向，警惕无征兆进攻');
    }

    // 基于速度
    var avgTurn = stats['和了巡数'] || 12;
    if (avgTurn < 11) {
        strategies.push('对手速度快，需要抢先进攻');
    } else if (avgTurn > 13) {
        strategies.push('对手速度慢，有时间布局');
    }

    // 基于立直质量
    var riichiProfit = stats['立直收支'] || 0;
    if (riichiProfit > 2000) {
        strategies.push('对手立直质量高，立直后建议立即弃牌');
    } else if (riichiProfit < 0) {
        strategies.push('对手立直质量不佳，可适度对抗');
    }

    // 基于副露质量
    var fuluWinRate = stats['副露后和牌率'] || 0;
    if (fuluWinRate > 0.35) {
        strategies.push('对手副露效率高，副露后威胁大');
    } else if (fuluWinRate < 0.25) {
        strategies.push('对手副露效率低，副露后可施压');
    }

    // 基于防守能力
    var avgDealPoint = stats['平均铳点'] || 5000;
    var dealRate = (stats['放铳率'] || 0) * 100;
    if (avgDealPoint < 5000 && dealRate < 13) {
        strategies.push('对手防守能力强，需要更高牌型质量');
    } else if (dealRate > 16) {
        strategies.push('对手容易放铳，积极施压可行');
    }

    // 基于被炸率
    var bombRate = stats['被炸率'] || 0;
    if (bombRate > 0.1) {
        strategies.push('对手被炸率高，大牌防守差，可以做大牌');
    }

    // 限制建议数量（最多8条）
    return strategies.slice(0, 8);
}
