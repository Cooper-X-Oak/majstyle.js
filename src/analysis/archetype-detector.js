// 玩家原型检测模块
import { ARCHETYPES } from '../config/constants.js';

// 检测玩家原型
export function detectArchetype(stats) {
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

// 计算原型匹配度
function calculateArchetypeMatch(stats, conditions) {
    var totalConditions = 0;
    var metConditions = 0;
    var overallScore = 0;

    for (var field in conditions) {
        if (conditions.hasOwnProperty(field)) {
            totalConditions++;
            var condition = conditions[field];
            var value = stats[field];

            // 处理百分比字段（需要转换）
            if (field === '立直率' || field === '副露率' || field === '放铳率' || field === '和牌率') {
                value = value * 100;
            }

            var met = true;
            var deviation = 0;

            // 检查最小值条件
            if (condition.min !== undefined) {
                if (value >= condition.min) {
                    deviation = (value - condition.min) / condition.min;
                } else {
                    met = false;
                    deviation = (condition.min - value) / condition.min;
                }
            }

            // 检查最大值条件
            if (condition.max !== undefined) {
                if (value <= condition.max) {
                    deviation = (condition.max - value) / condition.max;
                } else {
                    met = false;
                    deviation = (value - condition.max) / condition.max;
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
    }

    // 必须满足所有条件才算匹配
    if (metConditions < totalConditions) {
        return 0;
    }

    return overallScore;
}

// 获取原型的战术建议
export function getArchetypeAdvice(archetypeKey) {
    var adviceMap = {
        RIICHI_SPECIALIST: [
            '对手立直质量高，立直后建议立即弃牌',
            '警惕对手的好型立直，避免放铳大牌',
            '对手不擅长副露，可以通过鸣牌抢先'
        ],
        FULU_SPECIALIST: [
            '对手副露效率高，副露后威胁大',
            '注意对手的速攻倾向，需要抢先进攻',
            '对手立直较少，可以通过立直施压'
        ],
        SILENT_HUNTER: [
            '对手有高默听倾向，警惕无征兆进攻',
            '对手防守能力强，需要更高牌型质量',
            '难以通过立直/副露判断对手听牌状态'
        ],
        SPEED_DEMON: [
            '对手速度极快，需要抢先进攻',
            '对手倾向速和小牌，可以做大牌反制',
            '警惕对手的快速副露进攻'
        ],
        VALUE_MAXIMIZER: [
            '对手倾向做大牌，防守时要特别小心',
            '对手速度较慢，有时间布局和抢先',
            '对手立直质量高，立直后建议弃牌'
        ],
        DEFENSIVE_FORTRESS: [
            '对手防守能力极强，难以放铳',
            '对手倾向默听，进攻意图不明显',
            '需要更高的牌型质量才能有效施压'
        ]
    };

    return adviceMap[archetypeKey] || [];
}
