// 玩家原型检测模块
import { loadConfig } from '../config/config-loader.js';

// 检测玩家原型
export function detectArchetype(stats) {
    'use strict';

    // 从配置加载原型定义
    var config = loadConfig();
    var ARCHETYPES = config.archetypes;

    var matches = [];

    // 遍历所有原型定义
    for (var key in ARCHETYPES) {
        if (ARCHETYPES.hasOwnProperty(key)) {
            var archetype = ARCHETYPES[key];
            var score = calculateArchetypeMatch(stats, archetype.conditions);

            if (score > 0) {
                matches.push({
                    name: archetype.name,
                    icon: archetype.icon,
                    score: score,
                    key: key
                });
            }
        }
    }

    // 按匹配度排序
    matches.sort(function(a, b) {
        return b.score - a.score;
    });

    // 返回最匹配的原型，如果没有匹配则返回null
    return matches.length > 0 ? matches[0] : null;
}

// 计算原型匹配度（支持新的条件格式）
function calculateArchetypeMatch(stats, conditions) {
    'use strict';

    var totalConditions = conditions.length;
    var metConditions = 0;
    var overallScore = 0;

    for (var i = 0; i < conditions.length; i++) {
        var condition = conditions[i];
        var field = condition.field;
        var operator = condition.operator;
        var threshold = condition.value;
        var value = stats[field];

        // 处理百分比字段（需要转换）
        if (field === '立直率' || field === '副露率' || field === '放铳率' || field === '和牌率') {
            value = value * 100;
        }

        var met = false;
        var deviation = 0;

        // 根据操作符检查条件
        if (operator === '>=') {
            if (value >= threshold) {
                met = true;
                deviation = (value - threshold) / threshold;
            } else {
                deviation = (threshold - value) / threshold;
            }
        } else if (operator === '<=') {
            if (value <= threshold) {
                met = true;
                deviation = (threshold - value) / threshold;
            } else {
                deviation = (value - threshold) / threshold;
            }
        } else if (operator === '>') {
            if (value > threshold) {
                met = true;
                deviation = (value - threshold) / threshold;
            } else {
                deviation = (threshold - value) / threshold;
            }
        } else if (operator === '<') {
            if (value < threshold) {
                met = true;
                deviation = (threshold - value) / threshold;
            } else {
                deviation = (value - threshold) / threshold;
            }
        }

        if (met) {
            metConditions++;
            // 超出条件越多，得分越高
            overallScore += 1 + Math.min(deviation, 0.5);
        } else {
            // 未满足条件，扣分
            overallScore -= deviation;
        }
    }

    // 必须满足所有条件才算匹配
    if (metConditions < totalConditions) {
        return 0;
    }

    return overallScore;
}

// 获取原型的战术建议
export function getArchetypeAdvice(archetypeKey) {
    'use strict';

    // 从配置加载原型建议
    var config = loadConfig();
    var archetype = config.archetypes[archetypeKey];

    if (archetype && archetype.advice) {
        return archetype.advice;
    }

    return [];
}
