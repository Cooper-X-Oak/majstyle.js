// 标准化数据提取模块
// 职责：从 API 原始响应中提取、验证、转换所有字段，生成统一的 stats 对象

/**
 * 从 player_stats 和 player_extended_stats 提取完整数据
 * @param {Object} basicStats - player_stats API 响应
 * @param {Object} extStats - player_extended_stats API 响应
 * @returns {Object} 标准化的 stats 对象
 */
export function extractStats(basicStats, extStats) {
    'use strict';

    var stats = {};

    // ==================== 元数据 ====================
    stats['对局数'] = safeNumber(extStats.count, 0);
    stats['账号ID'] = safeNumber(basicStats.id || extStats.id, 0);

    // ==================== player_stats 字段 ====================

    // 段位信息
    stats['当前段位ID'] = basicStats.level ? safeNumber(basicStats.level.id, null) : null;
    stats['当前段位分'] = basicStats.level ? safeNumber(basicStats.level.score, null) : null;
    stats['最高段位ID'] = basicStats.max_level ? safeNumber(basicStats.max_level.id, null) : null;
    stats['最高段位分'] = basicStats.max_level ? safeNumber(basicStats.max_level.score, null) : null;

    // 顺位数据
    stats['平均顺位'] = safeNumber(basicStats.avg_rank, null);
    stats['负分率'] = safeNumber(basicStats.negative_rate, null);

    // 各顺位率和得点
    if (Array.isArray(basicStats.rank_rates) && basicStats.rank_rates.length === 4) {
        stats['1位率'] = safeNumber(basicStats.rank_rates[0], 0);
        stats['2位率'] = safeNumber(basicStats.rank_rates[1], 0);
        stats['3位率'] = safeNumber(basicStats.rank_rates[2], 0);
        stats['4位率'] = safeNumber(basicStats.rank_rates[3], 0);
    } else {
        stats['1位率'] = 0;
        stats['2位率'] = 0;
        stats['3位率'] = 0;
        stats['4位率'] = 0;
    }

    if (Array.isArray(basicStats.rank_avg_score) && basicStats.rank_avg_score.length === 4) {
        stats['1位平均得点'] = safeNumber(basicStats.rank_avg_score[0], 0);
        stats['2位平均得点'] = safeNumber(basicStats.rank_avg_score[1], 0);
        stats['3位平均得点'] = safeNumber(basicStats.rank_avg_score[2], 0);
        stats['4位平均得点'] = safeNumber(basicStats.rank_avg_score[3], 0);

        // 计算平均得点（加权平均）
        stats['平均得点'] = Math.round(
            stats['1位率'] * stats['1位平均得点'] +
            stats['2位率'] * stats['2位平均得点'] +
            stats['3位率'] * stats['3位平均得点'] +
            stats['4位率'] * stats['4位平均得点']
        );
    } else {
        stats['1位平均得点'] = 0;
        stats['2位平均得点'] = 0;
        stats['3位平均得点'] = 0;
        stats['4位平均得点'] = 0;
        stats['平均得点'] = 0;
    }

    // ==================== player_extended_stats 字段 ====================

    // 基础率类指标（小数 → 保持小数）
    stats['和牌率'] = safeNumber(extStats['和牌率'], 0);
    stats['自摸率'] = safeNumber(extStats['自摸率'], 0);
    stats['默听率'] = safeNumber(extStats['默听率'], 0);
    stats['放铳率'] = safeNumber(extStats['放铳率'], 0);
    stats['副露率'] = safeNumber(extStats['副露率'], 0);
    stats['立直率'] = safeNumber(extStats['立直率'], 0);
    stats['流局率'] = safeNumber(extStats['流局率'], 0);
    stats['流听率'] = safeNumber(extStats['流听率'], 0);
    stats['一发率'] = safeNumber(extStats['一发率'], 0);
    stats['里宝率'] = safeNumber(extStats['里宝率'], 0);
    stats['被炸率'] = safeNumber(extStats['被炸率'], 0);

    // 打点相关
    stats['平均打点'] = safeNumber(extStats['平均打点'], 0);
    stats['平均铳点'] = safeNumber(extStats['平均铳点'], 0);
    stats['平均被炸点数'] = safeNumber(extStats['平均被炸点数'], 0);

    // 巡数相关
    stats['和了巡数'] = safeNumber(extStats['和了巡数'], 0);
    stats['立直巡目'] = safeNumber(extStats['立直巡目'], 0);

    // 立直相关
    stats['立直收支'] = safeNumber(extStats['立直收支'], 0);
    stats['立直收入'] = safeNumber(extStats['立直收入'], 0);
    stats['立直支出'] = safeNumber(extStats['立直支出'], 0);
    stats['立直后和牌率'] = safeNumber(extStats['立直后和牌率'], 0);
    stats['立直后放铳率'] = safeNumber(extStats['立直后放铳率'], 0);
    stats['立直后非瞬间放铳率'] = safeNumber(extStats['立直后非瞬间放铳率'], 0);
    stats['立直后流局率'] = safeNumber(extStats['立直后流局率'], 0);
    stats['立直好型'] = safeNumber(extStats['立直好型'], 0);
    stats['立直好型2'] = safeNumber(extStats['立直好型2'], 0);
    stats['立直多面'] = safeNumber(extStats['立直多面'], 0);
    stats['振听立直率'] = safeNumber(extStats['振听立直率'], 0);

    // 副露相关
    stats['副露后和牌率'] = safeNumber(extStats['副露后和牌率'], 0);
    stats['副露后放铳率'] = safeNumber(extStats['副露后放铳率'], 0);
    stats['副露后流局率'] = safeNumber(extStats['副露后流局率'], 0);

    // 放铳相关
    stats['放铳时立直率'] = safeNumber(extStats['放铳时立直率'], 0);
    stats['放铳时副露率'] = safeNumber(extStats['放铳时副露率'], 0);

    // 立直应对
    stats['先制率'] = safeNumber(extStats['先制率'], 0);
    stats['追立率'] = safeNumber(extStats['追立率'], 0);
    stats['被追率'] = safeNumber(extStats['被追率'], 0);

    // 效率指标
    stats['打点效率'] = safeNumber(extStats['打点效率'], 0);
    stats['铳点损失'] = safeNumber(extStats['铳点损失'], 0);
    stats['净打点效率'] = safeNumber(extStats['净打点效率'], 0);

    // 起手向听（运气因子）
    stats['平均起手向听'] = safeNumber(extStats['平均起手向听'], null);
    stats['平均起手向听亲'] = safeNumber(extStats['平均起手向听亲'], null);
    stats['平均起手向听子'] = safeNumber(extStats['平均起手向听子'], null);

    // 其他统计
    stats['最大连庄'] = safeNumber(extStats['最大连庄'], 0);
    stats['役满'] = safeNumber(extStats['役满'], 0);
    stats['最大累计番数'] = safeNumber(extStats['最大累计番数'], 0);
    stats['W立直'] = safeNumber(extStats['W立直'], 0);

    // 绝对次数字段（保留但不用于分析）
    stats['放铳至立直'] = safeNumber(extStats['放铳至立直'], 0);
    stats['放铳至副露'] = safeNumber(extStats['放铳至副露'], 0);
    stats['放铳至默听'] = safeNumber(extStats['放铳至默听'], 0);
    stats['立直和了'] = safeNumber(extStats['立直和了'], 0);
    stats['副露和了'] = safeNumber(extStats['副露和了'], 0);
    stats['默听和了'] = safeNumber(extStats['默听和了'], 0);

    // ==================== 派生字段 ====================

    // 掉段检测
    if (stats['最高段位ID'] !== null && stats['当前段位ID'] !== null) {
        stats['掉段幅度'] = calculateRankDrop(stats['最高段位ID'], stats['当前段位ID']);
        stats['是否掉段'] = stats['掉段幅度'] >= 2; // 掉了2个大段以上
    } else {
        stats['掉段幅度'] = 0;
        stats['是否掉段'] = false;
    }

    // 顺位稳定性（基于顺位率方差）
    if (stats['1位率'] !== 0 || stats['2位率'] !== 0 || stats['3位率'] !== 0 || stats['4位率'] !== 0) {
        stats['顺位稳定性'] = calculateRankStability(
            stats['1位率'],
            stats['2位率'],
            stats['3位率'],
            stats['4位率']
        );
    } else {
        stats['顺位稳定性'] = null;
    }

    return stats;
}

/**
 * 安全数值提取（处理 null/undefined/NaN）
 * @param {*} value - 原始值
 * @param {*} defaultValue - 默认值
 * @returns {number|null} 安全的数值或默认值
 */
function safeNumber(value, defaultValue) {
    'use strict';

    if (value === null || value === undefined) {
        return defaultValue;
    }

    var num = Number(value);
    if (isNaN(num)) {
        return defaultValue;
    }

    return num;
}

/**
 * 计算掉段幅度（大段数）
 * @param {number} maxLevelId - 历史最高段位ID
 * @param {number} currentLevelId - 当前段位ID
 * @returns {number} 掉段幅度（0 = 未掉段，1 = 掉1个大段，2 = 掉2个大段...）
 */
function calculateRankDrop(maxLevelId, currentLevelId) {
    'use strict';

    // 段位ID格式：10301 = 士3, 10401 = 杰1, 10501 = 豪1, 10601 = 圣1, 10701 = 魂1
    // 大段 = Math.floor(id / 100) % 10
    var maxMajorRank = Math.floor(maxLevelId / 100) % 10;
    var currentMajorRank = Math.floor(currentLevelId / 100) % 10;

    return Math.max(0, maxMajorRank - currentMajorRank);
}

/**
 * 计算顺位稳定性（基于方差，越低越稳定）
 * @param {number} rate1 - 1位率
 * @param {number} rate2 - 2位率
 * @param {number} rate3 - 3位率
 * @param {number} rate4 - 4位率
 * @returns {number} 稳定性分数（0-10，10 = 最稳定）
 */
function calculateRankStability(rate1, rate2, rate3, rate4) {
    'use strict';

    // 理想分布：均匀分布 [0.25, 0.25, 0.25, 0.25]
    var mean = 0.25;
    var variance = (
        Math.pow(rate1 - mean, 2) +
        Math.pow(rate2 - mean, 2) +
        Math.pow(rate3 - mean, 2) +
        Math.pow(rate4 - mean, 2)
    ) / 4;

    // 方差范围：0（完全均匀）到 0.1875（极端分布如 [1,0,0,0]）
    // 归一化到 0-10，方差越小分数越高
    var stability = 10 * (1 - Math.min(variance / 0.1875, 1));

    return Math.round(stability * 10) / 10; // 保留1位小数
}

/**
 * 验证 stats 对象完整性
 * @param {Object} stats - 提取后的 stats 对象
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export function validateStats(stats) {
    'use strict';

    var requiredFields = [
        '对局数',
        '立直率',
        '副露率',
        '和牌率',
        '放铳率',
        '平均打点',
        '净打点效率',
        '默听率',
        '立直收支',
        '和了巡数'
    ];

    var missing = [];

    for (var i = 0; i < requiredFields.length; i++) {
        var field = requiredFields[i];
        if (stats[field] === undefined || stats[field] === null) {
            missing.push(field);
        }
    }

    return {
        valid: missing.length === 0,
        missing: missing
    };
}

/**
 * 打印 stats 对象摘要（用于调试）
 * @param {Object} stats - stats 对象
 */
export function printStatsSummary(stats) {
    'use strict';

    console.log('  [Stats 摘要]');
    console.log('    对局数:', stats['对局数']);
    console.log('    平均顺位:', stats['平均顺位']);
    console.log('    平均得点:', stats['平均得点']);
    console.log('    净打点效率:', stats['净打点效率']);
    console.log('    立直率:', (stats['立直率'] * 100).toFixed(1) + '%');
    console.log('    副露率:', (stats['副露率'] * 100).toFixed(1) + '%');
    console.log('    和牌率:', (stats['和牌率'] * 100).toFixed(1) + '%');
    console.log('    放铳率:', (stats['放铳率'] * 100).toFixed(1) + '%');
    console.log('    默听率:', (stats['默听率'] * 100).toFixed(1) + '%');
    console.log('    平均起手向听:', stats['平均起手向听']);
    console.log('    是否掉段:', stats['是否掉段'] ? '是（掉' + stats['掉段幅度'] + '段）' : '否');
    console.log('    顺位稳定性:', stats['顺位稳定性']);
}
