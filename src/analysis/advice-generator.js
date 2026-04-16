import { detectArchetype, getArchetypeAdvice } from "./archetype-detector.js";
import {
  getDangerWeights,
  getDangerNormalization,
  loadConfig,
} from "../config/config-loader.js";
import {
  evaluateAttackStrength,
  evaluateDefenseStrength,
} from "./strength-evaluator.js";

// 策略建议生成（增强版）
export function generateAdvice(analysis, stats) {
  "use strict";

  var archetype = detectArchetype(stats);

  return {
    危险度: calculateDangerLevel(analysis, stats),
    原型: archetype,
    进攻强度: evaluateAttackStrength(stats),
    防守强度: evaluateDefenseStrength(stats),
    综合实力: assessOverallStrength(stats),
    进攻特征: analyzeOffensePattern(stats),
    防守能力: analyzeDefense(stats),
    立直质量: analyzeRiichiQuality(stats),
    副露质量: analyzeFuluQuality(stats),
    速度评估: analyzeSpeed(stats),
    隐蔽性: analyzeConcealment(stats),
    运气因子: analyzeLuckFactor(stats),
    防守弱点: analyzeDefenseWeakness(stats),
    策略建议: generateStrategies(analysis, stats, archetype),
  };
}

// 综合实力评估（基于净打点效率）
function assessOverallStrength(stats) {
  var netEfficiency = stats["净打点效率"] || 0;
  var level = "";
  if (netEfficiency > 500) level = "强劲";
  else if (netEfficiency > 0) level = "中等";
  else level = "较弱";

  return {
    净打点效率: netEfficiency,
    打点效率: stats["打点效率"] || 0,
    铳点损失: stats["铳点损失"] || 0,
    评价: level,
    说明: "净打点效率 = 打点效率 - 铳点损失，综合反映实力",
  };
}

// 隐蔽性评估（基于默听率）
function analyzeConcealment(stats) {
  var motenRate = stats["默听率"] || 0;
  var level = "";
  if (motenRate > 0.15) level = "高隐蔽";
  else if (motenRate > 0.08) level = "中等";
  else level = "低隐蔽";

  return {
    默听率: (motenRate * 100).toFixed(1) + "%",
    评价: level,
    危险性: motenRate > 0.12 ? "需警惕无征兆进攻" : "进攻意图明显",
  };
}

// 速度评估（基于和了巡数）
function analyzeSpeed(stats) {
  var avgTurn = stats["和了巡数"] || 12;
  var speed = "";
  if (avgTurn < 11) speed = "快速";
  else if (avgTurn < 13) speed = "中速";
  else speed = "慢速";

  return {
    和了巡数: avgTurn.toFixed(1),
    速度类型: speed,
    立直巡目: (stats["立直巡目"] || 0).toFixed(1),
    评价: speed === "快速" ? "抢先进攻压力大" : "有时间布局",
  };
}

// 立直质量评估（增强版）
function analyzeRiichiQuality(stats) {
  var riichiProfit = stats["立直收支"] || 0;
  var riichiWinRate = stats["立直后和牌率"] || 0;
  var riichiDealRate = stats["立直后放铳率"] || 0;

  var quality = "";
  if (riichiProfit > 2000 && riichiWinRate > 0.45) quality = "高质量";
  else if (riichiProfit > 0) quality = "中等";
  else quality = "低质量";

  return {
    立直收支: riichiProfit,
    立直后和牌率: (riichiWinRate * 100).toFixed(1) + "%",
    立直后放铳率: (riichiDealRate * 100).toFixed(1) + "%",
    质量评价: quality,
    建议: quality === "高质量" ? "立直后建议立即弃牌" : "可适度对抗",
  };
}

// 副露质量评估（新增）
function analyzeFuluQuality(stats) {
  var fuluWinRate = stats["副露后和牌率"] || 0;
  var fuluDealRate = stats["副露后放铳率"] || 0;

  var quality = "";
  if (fuluWinRate > 0.35 && fuluDealRate < 0.15) quality = "高效";
  else if (fuluWinRate > 0.28) quality = "中等";
  else quality = "低效";

  return {
    副露后和牌率: (fuluWinRate * 100).toFixed(1) + "%",
    副露后放铳率: (fuluDealRate * 100).toFixed(1) + "%",
    质量评价: quality,
    建议: quality === "高效" ? "副露后威胁大" : "副露后可施压",
  };
}

// 进攻特征分析
function analyzeOffensePattern(stats) {
  var 立直率 = (stats["立直率"] || 0) * 100;
  var 副露率 = (stats["副露率"] || 0) * 100;
  var 自摸率 = (stats["自摸率"] || 0) * 100;

  var pattern = "";
  if (立直率 > 25 && 副露率 < 30) pattern = "立直主导";
  else if (副露率 > 38 && 立直率 < 20) pattern = "副露主导";
  else if (立直率 > 20 && 副露率 > 30) pattern = "混合进攻";
  else pattern = "保守进攻";

  return {
    立直率: 立直率.toFixed(1) + "%",
    副露率: 副露率.toFixed(1) + "%",
    自摸率: 自摸率.toFixed(1) + "%",
    进攻模式: pattern,
  };
}

// 防守能力分析
function analyzeDefense(stats) {
  var 放铳率 = (stats["放铳率"] || 0) * 100;
  var 平均铳点 = stats["平均铳点"] || 5000;
  var 被炸率 = stats["被炸率"] || 0;

  var level = "";
  if (放铳率 < 13 && 平均铳点 < 5000) level = "强";
  else if (放铳率 < 15) level = "中等";
  else level = "弱";

  return {
    放铳率: 放铳率.toFixed(1) + "%",
    平均铳点: 平均铳点,
    被炸率: (被炸率 * 100).toFixed(1) + "%",
    防守等级: level,
    大牌防守: 被炸率 > 0.1 ? "差" : "好",
  };
}

// 运气因子评估（基于平均起手向听）
function analyzeLuckFactor(stats) {
  "use strict";

  var 平均起手向听 = stats["平均起手向听"];

  // 如果没有数据，返回未知
  if (平均起手向听 === null || 平均起手向听 === undefined) {
    return {
      平均起手向听: "未知",
      运气评价: "数据不足",
      运气因子: 5,
      说明: "缺少起手向听数据，无法评估运气因子",
    };
  }

  // 段位基准：通常在 3.4-3.6 之间
  var 基准向听 = 3.5;
  var 向听偏差 = 平均起手向听 - 基准向听;

  // 运气因子：0-10 分，5 为中性
  // 起手向听越小（配牌越好）= 运气越好 = 分数越高
  // 偏差范围：-0.3 到 +0.3
  var 运气因子 = 5 - 向听偏差 * 10;
  运气因子 = Math.round(Math.min(10, Math.max(0, 运气因子)));

  var 运气评价 = "";
  if (运气因子 >= 7) 运气评价 = "运气较好";
  else if (运气因子 >= 4) 运气评价 = "运气正常";
  else 运气评价 = "运气较差";

  return {
    平均起手向听: 平均起手向听.toFixed(2),
    基准向听: 基准向听.toFixed(2),
    向听偏差: 向听偏差.toFixed(2),
    运气因子: 运气因子,
    运气评价: 运气评价,
    说明:
      运气因子 >= 7
        ? "起手配牌好于平均，运气成分较高，实力可能被高估"
        : 运气因子 <= 3
          ? "起手配牌差于平均，运气成分较低，实力可能被低估"
          : "起手配牌接近平均，运气因子正常",
  };
}

// 防守弱点识别（基于放铳时立直率、放铳时副露率）
function analyzeDefenseWeakness(stats) {
  "use strict";

  var 放铳时立直率 = stats["放铳时立直率"];
  var 放铳时副露率 = stats["放铳时副露率"];
  var 放铳率 = (stats["放铳率"] || 0) * 100;

  // 如果没有数据，返回未知
  if (
    放铳时立直率 === null ||
    放铳时立直率 === undefined ||
    放铳时副露率 === null ||
    放铳时副露率 === undefined
  ) {
    return {
      放铳时立直率: "未知",
      放铳时副露率: "未知",
      主要弱点: "数据不足",
      弱点评价: "无法评估",
      说明: "缺少放铳场景数据，无法识别防守弱点",
    };
  }

  var 立直率百分比 = (放铳时立直率 * 100).toFixed(1);
  var 副露率百分比 = (放铳时副露率 * 100).toFixed(1);

  // 识别主要弱点
  var 主要弱点 = "";
  var 弱点评价 = "";
  var 建议 = "";

  if (放铳时立直率 > 0.25) {
    主要弱点 = "立直后防守";
    弱点评价 = "对手立直后容易放铳";
    建议 = "立直施压有效，对手立直后防守能力弱";
  } else if (放铳时副露率 > 0.45) {
    主要弱点 = "副露后防守";
    弱点评价 = "对手副露后容易放铳";
    建议 = "副露施压有效，对手副露后防守能力弱";
  } else if (放铳时立直率 < 0.15 && 放铳时副露率 < 0.35) {
    主要弱点 = "默听防守";
    弱点评价 = "对手主要在默听时放铳";
    建议 = "默听施压有效，对手对隐蔽进攻防守能力弱";
  } else {
    主要弱点 = "无明显弱点";
    弱点评价 = "放铳场景分布均衡";
    建议 = "对手防守能力均衡，无明显弱点可针对";
  }

  return {
    放铳时立直率: 立直率百分比 + "%",
    放铳时副露率: 副露率百分比 + "%",
    放铳率: 放铳率.toFixed(1) + "%",
    主要弱点: 主要弱点,
    弱点评价: 弱点评价,
    战术建议: 建议,
    说明:
      "放铳时立直率 = 放铳至立直 / 总放铳次数，" +
      "放铳时副露率 = 放铳至副露 / 总放铳次数，" +
      "可识别对手在哪种场景下防守能力最弱",
  };
}

// 危险度计算（config 驱动 - 所有归一化范围来自 danger_normalization）
function calculateDangerLevel(analysis, stats) {
  "use strict";

  var DANGER_WEIGHTS = getDangerWeights();
  var DANGER_NORM = getDangerNormalization();

  var weightedSum = 0;
  var totalWeight = 0;
  var scores = {};

  for (var field in DANGER_WEIGHTS) {
    if (!DANGER_WEIGHTS.hasOwnProperty(field)) continue;

    var norm = DANGER_NORM[field];
    var weight = DANGER_WEIGHTS[field];
    var value = stats[field] || 0;

    var score = normalizeScore(value, norm.min, norm.max, norm.inverted);
    scores[field] = score;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  var rawScore = weightedSum / totalWeight;

  // 置信度：向中性值 5 收缩，而非直接缩放
  var sampleSize = stats["count"] || 0;
  var confidence = calculateConfidence(sampleSize);
  var dangerLevel = 5 + (rawScore - 5) * confidence;
  dangerLevel = Math.round(Math.min(10, Math.max(0, dangerLevel)));

  var icon = "";
  var label = "";
  if (dangerLevel >= 9) {
    icon = "⚠️";
    label = "极度危险";
  } else if (dangerLevel >= 7) {
    icon = "⚡";
    label = "较为危险";
  } else if (dangerLevel >= 5) {
    icon = "➡️";
    label = "正常水平";
  } else if (dangerLevel >= 3) {
    icon = "✓";
    label = "威胁较小";
  } else {
    icon = "🎯";
    label = "送分目标";
  }

  return {
    分数: dangerLevel,
    图标: icon,
    标签: label,
    置信度: (confidence * 100).toFixed(0) + "%",
    维度得分: scores,
  };
}

// 归一化分数到 0-10，inverted=true 时反向（值越小得分越高）
function normalizeScore(value, min, max, inverted) {
  var normalized = (value - min) / (max - min);
  normalized = Math.min(1, Math.max(0, normalized));
  if (inverted) normalized = 1 - normalized;
  return normalized * 10;
}

// 计算样本量置信度
function calculateConfidence(sampleSize) {
  if (sampleSize >= 400) return 1.0;
  if (sampleSize >= 200) return 0.95;
  if (sampleSize >= 100) return 0.9;
  if (sampleSize >= 50) return 0.8;
  return 0.7;
}

// 综合策略建议生成（增强版 - 结构化建议）
function generateStrategies(analysis, stats, archetype) {
  var strategies = [];

  // 优先添加原型特定建议
  if (archetype) {
    var archetypeAdvice = getArchetypeAdvice(archetype.key);
    for (var i = 0; i < archetypeAdvice.length; i++) {
      strategies.push({
        建议: archetypeAdvice[i],
        理由: explainArchetypeAdvice(archetype, stats),
        置信度: calculateAdviceConfidence(stats),
        优先级: 1,
        来源: "玩家原型",
      });
    }
  }

  // 优先级 P0：运气因子评估
  var 平均起手向听 = stats["平均起手向听"];
  if (平均起手向听 !== null && 平均起手向听 !== undefined) {
    var 基准向听 = 3.5;
    var 向听偏差 = 平均起手向听 - 基准向听;

    if (向听偏差 < -0.15) {
      // 起手配牌好于平均
      strategies.push({
        建议: "对手起手配牌好于平均，运气成分较高，实力可能被高估",
        理由: explainLuckFactor(stats, 平均起手向听, 向听偏差, true),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(Math.abs(向听偏差), 0.15, 0.3),
        来源: "运气因子",
      });
    } else if (向听偏差 > 0.15) {
      // 起手配牌差于平均
      strategies.push({
        建议: "对手起手配牌差于平均，运气成分较低，实力可能被低估",
        理由: explainLuckFactor(stats, 平均起手向听, 向听偏差, false),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(Math.abs(向听偏差), 0.15, 0.3),
        来源: "运气因子",
      });
    }
  }

  // 优先级 P0：防守弱点识别
  var 放铳时立直率 = stats["放铳时立直率"];
  var 放铳时副露率 = stats["放铳时副露率"];
  if (
    放铳时立直率 !== null &&
    放铳时立直率 !== undefined &&
    放铳时副露率 !== null &&
    放铳时副露率 !== undefined
  ) {
    if (放铳时立直率 > 0.25) {
      strategies.push({
        建议:
          "对手立直后容易放铳（放铳时立直率 " +
          (放铳时立直率 * 100).toFixed(1) +
          "%），立直施压有效",
        理由: explainDefenseWeakness(stats, 放铳时立直率, 放铳时副露率, "立直"),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(放铳时立直率, 0.25, 0.4),
        来源: "防守弱点",
      });
    } else if (放铳时副露率 > 0.45) {
      strategies.push({
        建议:
          "对手副露后容易放铳（放铳时副露率 " +
          (放铳时副露率 * 100).toFixed(1) +
          "%），副露施压有效",
        理由: explainDefenseWeakness(stats, 放铳时立直率, 放铳时副露率, "副露"),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(放铳时副露率, 0.45, 0.6),
        来源: "防守弱点",
      });
    } else if (放铳时立直率 < 0.15 && 放铳时副露率 < 0.35) {
      strategies.push({
        建议: "对手主要在默听时放铳，默听施压有效",
        理由: explainDefenseWeakness(stats, 放铳时立直率, 放铳时副露率, "默听"),
        置信度: calculateAdviceConfidence(stats),
        优先级: 6,
        来源: "防守弱点",
      });
    }
  }

  // 基于综合实力
  var netEff = stats["净打点效率"] || 0;
  if (netEff > 500) {
    strategies.push({
      建议: "对手综合实力强，不建议正面硬刚",
      理由: explainOverallStrength(stats, netEff, true),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(netEff, 500, 2000),
      来源: "综合实力",
    });
  } else if (netEff < 0) {
    strategies.push({
      建议: "对手综合实力弱，可以积极施压",
      理由: explainOverallStrength(stats, netEff, false),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(Math.abs(netEff), 0, 1000),
      来源: "综合实力",
    });
  }

  // 基于隐蔽性
  var motenRate = stats["默听率"] || 0;
  if (motenRate > 0.12 && !archetype) {
    strategies.push({
      建议: "对手有较高默听倾向，警惕无征兆进攻",
      理由: explainConcealment(stats, motenRate),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(motenRate, 0.12, 0.2),
      来源: "隐蔽性",
    });
  }

  // 基于速度
  var avgTurn = stats["和了巡数"] || 12;
  if (avgTurn < 11 && !archetype) {
    strategies.push({
      建议: "对手速度快，需要抢先进攻",
      理由: explainSpeed(stats, avgTurn, true),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(11 - avgTurn, 0, 3),
      来源: "速度评估",
    });
  } else if (avgTurn > 13) {
    strategies.push({
      建议: "对手速度慢，有时间布局",
      理由: explainSpeed(stats, avgTurn, false),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(avgTurn - 13, 0, 3),
      来源: "速度评估",
    });
  }

  // 基于立直质量
  var riichiProfit = stats["立直收支"] || 0;
  if (riichiProfit > 2000 && !archetype) {
    strategies.push({
      建议: "对手立直质量高，立直后建议立即弃牌",
      理由: explainRiichiQuality(stats, riichiProfit, true),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(riichiProfit, 2000, 4000),
      来源: "立直质量",
    });
  } else if (riichiProfit < 0) {
    strategies.push({
      建议: "对手立直质量不佳，可适度对抗",
      理由: explainRiichiQuality(stats, riichiProfit, false),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(Math.abs(riichiProfit), 0, 1000),
      来源: "立直质量",
    });
  }

  // 基于副露质量
  var fuluWinRate = stats["副露后和牌率"] || 0;
  if (fuluWinRate > 0.35 && !archetype) {
    strategies.push({
      建议: "对手副露效率高，副露后威胁大",
      理由: explainFuluQuality(stats, fuluWinRate, true),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(fuluWinRate, 0.35, 0.45),
      来源: "副露质量",
    });
  } else if (fuluWinRate < 0.25) {
    strategies.push({
      建议: "对手副露效率低，副露后可施压",
      理由: explainFuluQuality(stats, fuluWinRate, false),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(0.25 - fuluWinRate, 0, 0.1),
      来源: "副露质量",
    });
  }

  // 基于防守能力
  var avgDealPoint = stats["平均铳点"] || 5000;
  var dealRate = (stats["放铳率"] || 0) * 100;
  if (avgDealPoint < 5000 && dealRate < 13 && !archetype) {
    strategies.push({
      建议: "对手防守能力强，需要更高牌型质量",
      理由: explainDefense(stats, dealRate, avgDealPoint, true),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(13 - dealRate, 0, 5),
      来源: "防守能力",
    });
  } else if (dealRate > 16) {
    strategies.push({
      建议: "对手容易放铳，积极施压可行",
      理由: explainDefense(stats, dealRate, avgDealPoint, false),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(dealRate - 16, 0, 5),
      来源: "防守能力",
    });
  }

  // 基于被炸率
  var bombRate = stats["被炸率"] || 0;
  if (bombRate > 0.1) {
    strategies.push({
      建议: "对手被炸率高，大牌防守差，可以做大牌",
      理由: explainBombRate(stats, bombRate),
      置信度: calculateAdviceConfidence(stats),
      优先级: calculatePriority(bombRate, 0.1, 0.15),
      来源: "大牌防守",
    });
  }

  // 按优先级排序并去重
  strategies.sort(function (a, b) {
    return b.优先级 - a.优先级;
  });

  var uniqueStrategies = [];
  var seenAdvice = {};
  for (var i = 0; i < strategies.length && uniqueStrategies.length < 8; i++) {
    if (!seenAdvice[strategies[i].建议]) {
      uniqueStrategies.push(strategies[i]);
      seenAdvice[strategies[i].建议] = true;
    }
  }

  return uniqueStrategies;
}

// ========== 建议解释函数 ==========

// 计算建议优先级（基于偏差程度）
function calculatePriority(deviation, minThreshold, maxThreshold) {
  var normalized = (deviation - minThreshold) / (maxThreshold - minThreshold);
  normalized = Math.min(1, Math.max(0, normalized));
  return Math.round(normalized * 10);
}

// 计算建议置信度
function calculateAdviceConfidence(stats) {
  var sampleSize = stats["count"] || 0;
  var confidence = calculateConfidence(sampleSize);
  var label = "";
  if (confidence >= 0.95) label = "高";
  else if (confidence >= 0.85) label = "中";
  else label = "低";
  return label + "（" + sampleSize + "局）";
}

// 解释综合实力评估
function explainOverallStrength(stats, netEff, isStrong) {
  var 打点效率 = stats["打点效率"] || 0;
  var 铳点损失 = stats["铳点损失"] || 0;
  var 和牌率 = ((stats["和牌率"] || 0) * 100).toFixed(1);
  var 放铳率 = ((stats["放铳率"] || 0) * 100).toFixed(1);

  var explanation = {
    触发条件: isStrong
      ? "净打点效率 " + netEff + " > 阈值 500"
      : "净打点效率 " + netEff + " < 阈值 0",
    数据支撑:
      "打点效率 " +
      打点效率 +
      " - 铳点损失 " +
      铳点损失 +
      " = 净打点效率 " +
      netEff +
      "；和牌率 " +
      和牌率 +
      "%，放铳率 " +
      放铳率 +
      "%",
    推理逻辑: isStrong
      ? "净打点效率显著为正，说明对手每局平均得点远超失点，综合实力强劲"
      : "净打点效率为负，说明对手每局平均失点大于得点，综合实力较弱",
    战术含义: isStrong
      ? "对手在进攻和防守上都有优势，正面对抗期望值不利，建议采取保守策略"
      : "对手在进攻或防守上存在明显弱点，可以通过积极施压获取优势",
  };

  return explanation;
}

// 解释隐蔽性评估
function explainConcealment(stats, motenRate) {
  var 立直率 = ((stats["立直率"] || 0) * 100).toFixed(1);
  var 副露率 = ((stats["副露率"] || 0) * 100).toFixed(1);
  var 和牌率 = ((stats["和牌率"] || 0) * 100).toFixed(1);

  return {
    触发条件: "默听率 " + (motenRate * 100).toFixed(1) + "% > 阈值 12%",
    数据支撑:
      "默听率 " +
      (motenRate * 100).toFixed(1) +
      "%，立直率 " +
      立直率 +
      "%，副露率 " +
      副露率 +
      "%，和牌率 " +
      和牌率 +
      "%",
    推理逻辑:
      "默听率 = (和牌率 - 立直率 - 副露率)，高默听率说明对手经常不鸣牌、不立直而直接和牌",
    战术含义:
      "对手擅长隐蔽听牌，可能在无明显征兆时突然和牌，需要全程保持警惕，不能因为对手未立直就放松防守",
  };
}

// 解释速度评估
function explainSpeed(stats, avgTurn, isFast) {
  var 副露率 = ((stats["副露率"] || 0) * 100).toFixed(1);
  var 副露巡目 = (stats["副露巡目"] || 0).toFixed(1);
  var 立直巡目 = (stats["立直巡目"] || 0).toFixed(1);

  return {
    触发条件: isFast
      ? "和了巡数 " + avgTurn.toFixed(1) + " < 阈值 11"
      : "和了巡数 " + avgTurn.toFixed(1) + " > 阈值 13",
    数据支撑:
      "和了巡数 " +
      avgTurn.toFixed(1) +
      "，副露率 " +
      副露率 +
      "%，副露巡目 " +
      副露巡目 +
      "，立直巡目 " +
      立直巡目,
    推理逻辑: isFast
      ? "和了巡数显著低于平均（12巡），说明对手能快速完成听牌和和牌"
      : "和了巡数显著高于平均（12巡），说明对手倾向于慢速布局或追求高打点",
    战术含义: isFast
      ? "对手速攻压力大，需要在前期就做好防守准备，或者通过更快的速度抢先和牌"
      : "对手速度慢，给我方留出了充足的布局时间，可以追求更高的牌型价值",
  };
}

// 解释立直质量
function explainRiichiQuality(stats, riichiProfit, isHigh) {
  var 立直后和牌率 = ((stats["立直后和牌率"] || 0) * 100).toFixed(1);
  var 立直后放铳率 = ((stats["立直后放铳率"] || 0) * 100).toFixed(1);
  var 立直率 = ((stats["立直率"] || 0) * 100).toFixed(1);
  var 平均打点 = stats["平均打点"] || 0;

  return {
    触发条件: isHigh
      ? "立直收支 " + riichiProfit + " > 阈值 2000"
      : "立直收支 " + riichiProfit + " < 阈值 0",
    数据支撑:
      "立直收支 " +
      riichiProfit +
      "，立直后和牌率 " +
      立直后和牌率 +
      "%，立直后放铳率 " +
      立直后放铳率 +
      "%，立直率 " +
      立直率 +
      "%，平均打点 " +
      平均打点,
    推理逻辑: isHigh
      ? "立直收支 = 立直后和牌得点 - 立直后放铳失点，高收支意味着立直后和牌率高、放铳率低、打点可能较大"
      : "立直收支为负，说明对手立直后失点大于得点，可能存在过度立直或立直时机判断不佳的问题",
    战术含义: isHigh
      ? "对手立直质量优秀，立直后威胁极大，放铳期望损失约 7000-8000 点，建议立即切换到防守模式"
      : "对手立直质量不佳，立直后威胁有限，可以适度对抗，不必过度防守",
  };
}

// 解释副露质量
function explainFuluQuality(stats, fuluWinRate, isHigh) {
  var 副露后放铳率 = ((stats["副露后放铳率"] || 0) * 100).toFixed(1);
  var 副露率 = ((stats["副露率"] || 0) * 100).toFixed(1);
  var 副露巡目 = (stats["副露巡目"] || 0).toFixed(1);

  return {
    触发条件: isHigh
      ? "副露后和牌率 " + (fuluWinRate * 100).toFixed(1) + "% > 阈值 35%"
      : "副露后和牌率 " + (fuluWinRate * 100).toFixed(1) + "% < 阈值 25%",
    数据支撑:
      "副露后和牌率 " +
      (fuluWinRate * 100).toFixed(1) +
      "%，副露后放铳率 " +
      副露后放铳率 +
      "%，副露率 " +
      副露率 +
      "%，副露巡目 " +
      副露巡目,
    推理逻辑: isHigh
      ? "副露后和牌率显著高于平均（28-30%），说明对手擅长判断副露时机，副露后能高效完成和牌"
      : "副露后和牌率显著低于平均（28-30%），说明对手副露判断不佳，副露后容易陷入困境",
    战术含义: isHigh
      ? "对手副露后威胁大，需要警惕对手通过副露抢先和牌，可以通过立直施压"
      : "对手副露效率低，副露后可以积极施压，迫使对手陷入不利局面",
  };
}

// 解释防守能力
function explainDefense(stats, dealRate, avgDealPoint, isStrong) {
  var 被炸率 = ((stats["被炸率"] || 0) * 100).toFixed(1);
  var 默听率 = ((stats["默听率"] || 0) * 100).toFixed(1);

  return {
    触发条件: isStrong
      ? "放铳率 " +
        dealRate.toFixed(1) +
        "% < 13% 且 平均铳点 " +
        avgDealPoint +
        " < 5000"
      : "放铳率 " + dealRate.toFixed(1) + "% > 16%",
    数据支撑:
      "放铳率 " +
      dealRate.toFixed(1) +
      "%，平均铳点 " +
      avgDealPoint +
      "，被炸率 " +
      被炸率 +
      "%，默听率 " +
      默听率 +
      "%",
    推理逻辑: isStrong
      ? "放铳率低且平均铳点小，说明对手防守意识强，能有效避免放铳，即使放铳也多为小牌"
      : "放铳率显著高于平均（14-15%），说明对手防守能力弱，容易放铳",
    战术含义: isStrong
      ? "对手防守能力强，难以通过普通牌型让对手放铳，需要更高的牌型质量才能获利"
      : "对手容易放铳，可以通过积极进攻施压，增加对手放铳概率",
  };
}

// 解释被炸率
function explainBombRate(stats, bombRate) {
  var 平均铳点 = stats["平均铳点"] || 0;
  var 放铳率 = ((stats["放铳率"] || 0) * 100).toFixed(1);

  return {
    触发条件: "被炸率 " + (bombRate * 100).toFixed(1) + "% > 阈值 10%",
    数据支撑:
      "被炸率 " +
      (bombRate * 100).toFixed(1) +
      "%，平均铳点 " +
      平均铳点 +
      "，放铳率 " +
      放铳率 +
      "%",
    推理逻辑:
      "被炸率 = 满贯以上放铳次数 / 总放铳次数，高被炸率说明对手对大牌的防守能力差",
    战术含义:
      "对手对大牌防守差，可以追求高打点牌型（满贯、跳满、倍满），对手放铳概率较高",
  };
}

// 解释运气因子
function explainLuckFactor(stats, 平均起手向听, 向听偏差, isGood) {
  "use strict";

  var 基准向听 = 3.5;
  var 和牌率 = ((stats["和牌率"] || 0) * 100).toFixed(1);
  var 净打点效率 = stats["净打点效率"] || 0;

  return {
    触发条件: isGood
      ? "平均起手向听 " +
        平均起手向听.toFixed(2) +
        " < 基准 " +
        基准向听.toFixed(2) +
        "（偏差 " +
        向听偏差.toFixed(2) +
        "）"
      : "平均起手向听 " +
        平均起手向听.toFixed(2) +
        " > 基准 " +
        基准向听.toFixed(2) +
        "（偏差 " +
        向听偏差.toFixed(2) +
        "）",
    数据支撑:
      "平均起手向听 " +
      平均起手向听.toFixed(2) +
      "，基准 " +
      基准向听.toFixed(2) +
      "，和牌率 " +
      和牌率 +
      "%，净打点效率 " +
      净打点效率,
    推理逻辑: isGood
      ? "起手向听数越小，配牌越好。对手起手配牌显著好于平均水平，说明运气成分较高"
      : "起手向听数越小，配牌越好。对手起手配牌显著差于平均水平，说明运气成分较低",
    战术含义: isGood
      ? "对手的成绩可能部分归功于运气，实际实力可能被高估。如果和牌率高但起手好，说明运气占比大"
      : "对手在配牌不利的情况下仍能维持成绩，实际实力可能被低估。如果和牌率正常但起手差，说明技术扎实",
  };
}

// 解释防守弱点
function explainDefenseWeakness(stats, 放铳时立直率, 放铳时副露率, 弱点类型) {
  "use strict";

  var 放铳率 = ((stats["放铳率"] || 0) * 100).toFixed(1);
  var 立直率百分比 = (放铳时立直率 * 100).toFixed(1);
  var 副露率百分比 = (放铳时副露率 * 100).toFixed(1);

  var 触发条件 = "";
  var 推理逻辑 = "";
  var 战术含义 = "";

  if (弱点类型 === "立直") {
    触发条件 = "放铳时立直率 " + 立直率百分比 + "% > 阈值 25%";
    推理逻辑 =
      "放铳时立直率 = 放铳至立直 / 总放铳次数。高比例说明对手在面对立直时防守能力弱，容易放铳";
    战术含义 =
      "对手对立直的防守能力差，立直施压非常有效。可以通过立直迫使对手弃牌或放铳";
  } else if (弱点类型 === "副露") {
    触发条件 = "放铳时副露率 " + 副露率百分比 + "% > 阈值 45%";
    推理逻辑 =
      "放铳时副露率 = 放铳至副露 / 总放铳次数。高比例说明对手在面对副露时防守能力弱，容易放铳";
    战术含义 =
      "对手对副露的防守能力差，副露施压非常有效。可以通过副露抢先进攻，迫使对手放铳";
  } else {
    触发条件 =
      "放铳时立直率 " +
      立直率百分比 +
      "% < 15% 且 放铳时副露率 " +
      副露率百分比 +
      "% < 35%";
    推理逻辑 =
      "放铳时立直率和副露率都较低，说明对手主要在默听（无明显征兆）时放铳，对隐蔽进攻防守能力弱";
    战术含义 =
      "对手对默听的防守能力差，默听施压有效。可以通过不立直、不副露的方式隐蔽听牌，增加对手放铳概率";
  }

  return {
    触发条件: 触发条件,
    数据支撑:
      "放铳率 " +
      放铳率 +
      "%，放铳时立直率 " +
      立直率百分比 +
      "%，放铳时副露率 " +
      副露率百分比 +
      "%",
    推理逻辑: 推理逻辑,
    战术含义: 战术含义,
  };
}

// 解释玩家原型建议
function explainArchetypeAdvice(archetype, stats) {
  "use strict";

  var conditions = [];

  // 从 config 读取原型定义
  var config = loadConfig();
  var archetypeData = config.archetypes[archetype.key];

  if (!archetypeData || !archetypeData.conditions) {
    return {
      触发条件: "匹配玩家原型: " + archetype.name,
      数据支撑: "基于多维度数据综合判断",
      推理逻辑: "玩家行为模式符合该原型特征",
      战术含义: "针对该原型采取专门策略",
    };
  }

  // 构建触发条件说明（使用新格式 {field, operator, value}）
  for (var i = 0; i < archetypeData.conditions.length; i++) {
    var condition = archetypeData.conditions[i];
    var field = condition.field;
    var operator = condition.operator;
    var threshold = condition.value;
    var value = stats[field];

    // 格式化显示值
    var displayValue = value;
    var displayThreshold = threshold;

    // 百分比字段需要转换
    if (
      field === "立直率" ||
      field === "副露率" ||
      field === "和牌率" ||
      field === "放铳率" ||
      field === "默听率" ||
      field === "被炸率" ||
      field === "副露后和牌率"
    ) {
      displayValue = (value * 100).toFixed(1) + "%";
      // 如果阈值是小数（0-1），也转换为百分比
      if (threshold < 1) {
        displayThreshold = (threshold * 100).toFixed(1) + "%";
      } else {
        displayThreshold = threshold + "%";
      }
    } else {
      displayValue = value.toFixed(1);
    }

    // 根据操作符构建条件文本
    var operatorText = "";
    if (operator === ">=") operatorText = " ≥ ";
    else if (operator === "<=") operatorText = " ≤ ";
    else if (operator === ">") operatorText = " > ";
    else if (operator === "<") operatorText = " < ";

    conditions.push(
      field + " " + displayValue + operatorText + displayThreshold,
    );
  }

  return {
    触发条件:
      "匹配玩家原型: " + archetype.name + "（" + conditions.join("，") + "）",
    数据支撑: "基于玩家的行为模式和统计数据综合判断",
    推理逻辑: "玩家的多项关键指标符合该原型的典型特征，说明其打法风格明确",
    战术含义: "针对该原型的特点采取专门的对抗策略，可以更有效地应对",
  };
}
