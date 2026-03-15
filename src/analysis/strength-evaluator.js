// 强度评估模块
// 负责计算进攻强度和防守强度，生成态度词和等级

import { loadConfig } from '../config/config-loader.js';

// 评估进攻强度
export function evaluateAttackStrength(stats) {
    'use strict';

    var config = loadConfig();
    var attackConfig = config.strength_calculation.attack;

    var scores = {};
    var totalWeight = 0;
    var weightedSum = 0;

    // 1. 立直进攻
    var riichiScore = calculateRiichiAttack(stats, attackConfig);
    scores.立直进攻 = riichiScore;
    weightedSum += riichiScore * attackConfig.weights.立直进攻;
    totalWeight += attackConfig.weights.立直进攻;

    // 2. 副露进攻
    var fuluScore = calculateFuluAttack(stats, attackConfig);
    scores.副露进攻 = fuluScore;
    weightedSum += fuluScore * attackConfig.weights.副露进攻;
    totalWeight += attackConfig.weights.副露进攻;

    // 3. 速度
    var speedScore = calculateSpeed(stats, attackConfig);
    scores.速度 = speedScore;
    weightedSum += speedScore * attackConfig.weights.速度;
    totalWeight += attackConfig.weights.速度;

    // 4. 打点
    var datenScore = calculateDaten(stats, attackConfig);
    scores.打点 = datenScore;
    weightedSum += datenScore * attackConfig.weights.打点;
    totalWeight += attackConfig.weights.打点;

    // 计算总分 (0-100)
    var totalScore = (weightedSum / totalWeight) * 10;

    // 生成态度词
    var attitude = generateAttackAttitude(stats, scores, attackConfig);

    // 获取等级
    var level = getStrengthLevel(totalScore, 'attack');

    return {
        总分: totalScore,
        等级: level.level,
        标签: level.label,
        颜色: level.color,
        态度词: attitude,
        子维度: scores
    };
}

// 评估防守强度
export function evaluateDefenseStrength(stats) {
    'use strict';

    var config = loadConfig();
    var defenseConfig = config.strength_calculation.defense;

    var scores = {};
    var totalWeight = 0;
    var weightedSum = 0;

    // 1. 放铳控制
    var dealScore = calculateDealControl(stats, defenseConfig);
    scores.放铳控制 = dealScore;
    weightedSum += dealScore * defenseConfig.weights.放铳控制;
    totalWeight += defenseConfig.weights.放铳控制;

    // 2. 大牌防守
    var bombScore = calculateBombDefense(stats, defenseConfig);
    scores.大牌防守 = bombScore;
    weightedSum += bombScore * defenseConfig.weights.大牌防守;
    totalWeight += defenseConfig.weights.大牌防守;

    // 3. 隐蔽性
    var concealScore = calculateConcealment(stats, defenseConfig);
    scores.隐蔽性 = concealScore;
    weightedSum += concealScore * defenseConfig.weights.隐蔽性;
    totalWeight += defenseConfig.weights.隐蔽性;

    // 4. 立直防守
    var riichiDefenseScore = calculateRiichiDefense(stats, defenseConfig);
    scores.立直防守 = riichiDefenseScore;
    weightedSum += riichiDefenseScore * defenseConfig.weights.立直防守;
    totalWeight += defenseConfig.weights.立直防守;

    // 计算总分 (0-100)
    var totalScore = (weightedSum / totalWeight) * 10;

    // 生成态度词
    var attitude = generateDefenseAttitude(stats, scores, defenseConfig);

    // 获取等级
    var level = getStrengthLevel(totalScore, 'defense');

    return {
        总分: totalScore,
        等级: level.level,
        标签: level.label,
        颜色: level.color,
        态度词: attitude,
        子维度: scores
    };
}

// ========== 进攻子维度计算 ==========

// 立直进攻得分
function calculateRiichiAttack(stats, config) {
    'use strict';

    var norm = config.normalization;
    var subWeights = config.sub_weights.立直进攻;

    var riichiRate = (stats['立直率'] || 0) * 100;
    var riichiProfit = stats['立直收支'] || 0;
    var riichiWinRate = (stats['立直后和牌率'] || 0) * 100;

    // 立直率得分 (0-10)
    var rateScore = normalizeScore(riichiRate, norm.立直率.min, norm.立直率.max, 0, 10);

    // 立直收支得分 (0-10)
    var profitScore = normalizeScore(riichiProfit, norm.立直收支.min, norm.立直收支.max, 0, 10);

    // 立直后和牌率得分 (0-10)
    var winScore = normalizeScore(riichiWinRate, norm.立直后和牌率.min, norm.立直后和牌率.max, 0, 10);

    // 综合得分
    return (rateScore * subWeights.立直率 + profitScore * subWeights.立直收支 + winScore * subWeights.立直后和牌率);
}

// 副露进攻得分
function calculateFuluAttack(stats, config) {
    'use strict';

    var norm = config.normalization;
    var subWeights = config.sub_weights.副露进攻;

    var fuluRate = (stats['副露率'] || 0) * 100;
    var fuluWinRate = (stats['副露后和牌率'] || 0) * 100;

    // 副露率得分 (0-10)
    var rateScore = normalizeScore(fuluRate, norm.副露率.min, norm.副露率.max, 0, 10);

    // 副露后和牌率得分 (0-10)
    var winScore = normalizeScore(fuluWinRate, norm.副露后和牌率.min, norm.副露后和牌率.max, 0, 10);

    // 综合得分
    return (rateScore * subWeights.副露率 + winScore * subWeights.副露后和牌率);
}

// 速度得分
function calculateSpeed(stats, config) {
    'use strict';

    var norm = config.normalization;
    var avgTurn = stats['和了巡数'] || 12;

    // 和了巡数得分 (0-10)，巡数越小得分越高
    return normalizeScore(avgTurn, norm.和了巡数.min, norm.和了巡数.max, 0, 10);
}

// 打点得分
function calculateDaten(stats, config) {
    'use strict';

    var norm = config.normalization;
    var subWeights = config.sub_weights.打点;

    var avgDaten = stats['平均打点'] || 6500;
    var avgZimo = (stats['自摸率'] || 0) * 100;

    // 平均打点得分 (0-10)
    var datenScore = normalizeScore(avgDaten, norm.平均打点.min, norm.平均打点.max, 0, 10);

    // 自摸率得分 (0-10)
    var zimoScore = normalizeScore(avgZimo, norm.自摸率.min, norm.自摸率.max, 0, 10);

    // 综合得分
    return (datenScore * subWeights.平均打点 + zimoScore * subWeights.自摸率);
}

// ========== 防守子维度计算 ==========

// 放铳控制得分
function calculateDealControl(stats, config) {
    'use strict';

    var norm = config.normalization;
    var subWeights = config.sub_weights.放铳控制;

    var dealRate = (stats['放铳率'] || 0) * 100;
    var avgDealPoint = stats['平均铳点'] || 5000;

    // 放铳率得分 (0-10)，放铳率越低得分越高
    var rateScore = normalizeScore(dealRate, norm.放铳率.min, norm.放铳率.max, 0, 10);

    // 平均铳点得分 (0-10)，铳点越低得分越高
    var pointScore = normalizeScore(avgDealPoint, norm.平均铳点.min, norm.平均铳点.max, 0, 10);

    // 综合得分
    return (rateScore * subWeights.放铳率 + pointScore * subWeights.平均铳点);
}

// 大牌防守得分
function calculateBombDefense(stats, config) {
    'use strict';

    var norm = config.normalization;
    var bombRate = (stats['被炸率'] || 0) * 100;

    // 被炸率得分 (0-10)，被炸率越低得分越高
    return normalizeScore(bombRate, norm.被炸率.min, norm.被炸率.max, 0, 10);
}

// 隐蔽性得分
function calculateConcealment(stats, config) {
    'use strict';

    var norm = config.normalization;
    var motenRate = (stats['默听率'] || 0) * 100;

    // 默听率得分 (0-10)
    return normalizeScore(motenRate, norm.默听率.min, norm.默听率.max, 0, 10);
}

// 立直防守得分
function calculateRiichiDefense(stats, config) {
    'use strict';

    var norm = config.normalization;
    var riichiDealRate = (stats['立直后放铳率'] || 0) * 100;

    // 立直后放铳率得分 (0-10)，放铳率越低得分越高
    return normalizeScore(riichiDealRate, norm.立直后放铳率.min, norm.立直后放铳率.max, 0, 10);
}

// ========== 态度词生成 ==========

// 生成进攻态度词
function generateAttackAttitude(stats, scores, config) {
    'use strict';

    var attitudes = [];
    var thresholds = config.attitude_thresholds;

    var riichiRate = (stats['立直率'] || 0) * 100;
    var fuluRate = (stats['副露率'] || 0) * 100;
    var avgTurn = stats['和了巡数'] || 12;

    // 立直倾向
    if (riichiRate > thresholds.立直狂.立直率 && scores.立直进攻 > thresholds.立直狂.立直进攻) {
        attitudes.push('立直狂');
    } else if (riichiRate > thresholds.立直型.立直率 && scores.立直进攻 > thresholds.立直型.立直进攻) {
        attitudes.push('立直型');
    }

    // 副露倾向
    if (fuluRate > thresholds.副露狂.副露率 && scores.副露进攻 > thresholds.副露狂.副露进攻) {
        attitudes.push('副露狂');
    } else if (fuluRate > thresholds.副露型.副露率 && scores.副露进攻 > thresholds.副露型.副露进攻) {
        attitudes.push('副露型');
    }

    // 速度倾向
    if (avgTurn < thresholds.速攻狂.和了巡数 && scores.速度 > thresholds.速攻狂.速度) {
        attitudes.push('速攻狂');
    } else if (avgTurn < thresholds.速攻型.和了巡数 && scores.速度 > thresholds.速攻型.速度) {
        attitudes.push('速攻型');
    }

    // 打点倾向
    if (scores.打点 > thresholds.大牌型.打点) {
        attitudes.push('大牌型');
    }

    // 如果没有明显倾向
    if (attitudes.length === 0) {
        if (scores.立直进攻 > scores.副露进攻) {
            attitudes.push('立直型');
        } else {
            attitudes.push('副露型');
        }
    }

    return attitudes.join(' + ');
}

// 生成防守态度词
function generateDefenseAttitude(stats, scores, config) {
    'use strict';

    var thresholds = config.attitude_thresholds;

    var dealRate = (stats['放铳率'] || 0) * 100;
    var bombRate = (stats['被炸率'] || 0) * 100;
    var motenRate = (stats['默听率'] || 0) * 100;

    // 防守强度
    if (dealRate < thresholds.铁壁.放铳率 && scores.放铳控制 > thresholds.铁壁.放铳控制) {
        return '铁壁';
    } else if (dealRate < thresholds.防守稳健.放铳率 && scores.放铳控制 > thresholds.防守稳健.放铳控制) {
        return '防守稳健';
    } else if (dealRate > thresholds.防守弱.放铳率) {
        return '防守弱';
    }

    // 隐蔽性
    if (motenRate > thresholds.隐蔽高手.默听率 && scores.隐蔽性 > thresholds.隐蔽高手.隐蔽性) {
        return '隐蔽高手';
    }

    // 大牌防守
    if (bombRate > thresholds.大牌防守差.被炸率 && scores.大牌防守 < thresholds.大牌防守差.大牌防守) {
        return '大牌防守差';
    }

    return '防守正常';
}

// ========== 工具函数 ==========

// 归一化分数
function normalizeScore(value, min, max, outMin, outMax) {
    'use strict';

    var normalized = (value - min) / (max - min);
    normalized = Math.min(1, Math.max(0, normalized));
    return outMin + normalized * (outMax - outMin);
}

// 获取强度等级
function getStrengthLevel(score, type) {
    'use strict';

    var config = loadConfig();
    var levels = config.strength_levels[type];

    // 从高到低查找匹配的等级
    for (var i = 0; i < levels.length; i++) {
        if (score >= levels[i].threshold) {
            return levels[i];
        }
    }

    // 默认返回最低等级
    return levels[levels.length - 1];
}
