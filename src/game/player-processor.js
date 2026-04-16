import { getPlayerStats, getPlayerExtendedStats } from "../api/amae-koromo.js";
import { getBaseline } from "../config/constants.js";
import { analyzeStyle } from "../analysis/style-analyzer.js";
import { generateAdvice } from "../analysis/advice-generator.js";
import {
  createPlayerInfoUI,
  createNoDataUI,
} from "../ui/player-info-card-enhanced.js";
import {
  extractStats,
  validateStats,
  printStatsSummary,
} from "./stats-extractor.js";

// 控制台输出详细分析
export function printAnalysis(
  playerData,
  analysis,
  advice,
  baseline,
  index,
  isSelf,
  stats,
) {
  "use strict";

  var 主称号 = analysis.主称号;
  var 标签 = analysis.标签;
  var 数据 = analysis.数据;
  var 偏差 = analysis.偏差;

  // 创建 UI（传入 advice 对象）
  createPlayerInfoUI(
    index,
    主称号,
    标签,
    数据,
    偏差,
    baseline,
    playerData.nickname,
    isSelf,
    advice,
    stats,
  );

  var 标签文本 = 标签.length > 0 ? " [" + 标签.join(", ") + "]" : "";
  console.log("  段位: " + baseline.name + " | 称号: " + 主称号 + 标签文本);
  console.log("  【进攻】");
  console.log(
    "    立直率: " +
      数据.立直率.toFixed(1) +
      "% (" +
      (数据.立直率 - baseline.立直率).toFixed(1) +
      "%)",
  );
  console.log(
    "    副露率: " +
      数据.副露率.toFixed(1) +
      "% (" +
      (数据.副露率 - baseline.副露率).toFixed(1) +
      "%)",
  );
  console.log(
    "    和牌率: " +
      数据.和牌率.toFixed(1) +
      "% (" +
      (数据.和牌率 - baseline.和牌率).toFixed(1) +
      "%)",
  );
  console.log(
    "    平均打点: " + 数据.平均打点 + " (" + 偏差.打点.toFixed(0) + ")",
  );
  console.log("  【防守】");
  console.log(
    "    放铳率: " +
      数据.放铳率.toFixed(1) +
      "% (" +
      偏差.放铳率.toFixed(1) +
      "%)",
  );

  // 输出建议系统信息
  if (advice) {
    console.log("  【危险度】");
    console.log(
      "    评分: " +
        advice.危险度.分数 +
        "/10 " +
        advice.危险度.图标 +
        " " +
        advice.危险度.标签,
    );
    console.log("    置信度: " + advice.危险度.置信度);

    if (advice.原型) {
      console.log("  【玩家原型】");
      console.log("    " + advice.原型.icon + " " + advice.原型.name);
    }

    console.log("  【综合实力】");
    console.log(
      "    进攻强度: Lv." +
        advice.进攻强度.等级 +
        " (" +
        advice.进攻强度.总分 +
        "/100)",
    );
    console.log(
      "    防守强度: Lv." +
        advice.防守强度.等级 +
        " (" +
        advice.防守强度.总分 +
        "/100)",
    );

    if (advice.策略建议 && advice.策略建议.length > 0) {
      console.log("  【策略建议】(前3条)");
      for (var i = 0; i < Math.min(3, advice.策略建议.length); i++) {
        var suggestion = advice.策略建议[i];
        console.log(
          "    " +
            (i + 1) +
            ". [P" +
            suggestion.优先级 +
            "] " +
            suggestion.建议,
        );
      }
    }
  }
}

// 处理单个玩家的完整流程
export function processPlayer(p, myId, index) {
  "use strict";

  var isSelf = p.account_id === myId;

  console.log("");
  console.log(
    "座位" +
      index +
      ": " +
      p.nickname +
      " (ID:" +
      p.account_id +
      ")" +
      (isSelf ? " [你]" : ""),
  );

  if (p.account_id <= 10) {
    console.log("  [电脑]");
    return Promise.resolve();
  }

  // level.id 直接从游戏窗口取，无需等 API
  var levelId = p.level ? p.level.id : null;
  var baseline = getBaseline(levelId);

  console.log("  [开始] 并行请求 player_stats + player_extended_stats...");

  return Promise.all([
    getPlayerStats(p.account_id),
    getPlayerExtendedStats(p.account_id),
  ])
    .then(function (results) {
      var basicStats = results[0];
      var extStats = results[1];

      // 验证响应结构
      if (!basicStats || typeof basicStats !== "object") {
        throw { type: "validation", message: "无效的基础数据响应" };
      }
      if (
        !extStats ||
        typeof extStats !== "object" ||
        typeof extStats.count !== "number"
      ) {
        throw { type: "validation", message: "无效的扩展数据响应" };
      }

      console.log("  [成功] 获取数据完成");

      if (extStats.count < 50) {
        console.log("  数据不足（仅" + extStats.count + "局），无法分析");
        createNoDataUI(index, p.nickname, isSelf);
        return;
      }

      // ==================== 使用标准化数据提取层 ====================
      console.log("  [开始] 提取标准化数据...");
      var stats = extractStats(basicStats, extStats);

      // 验证数据完整性
      var validation = validateStats(stats);
      if (!validation.valid) {
        console.log(
          "  [警告] 数据不完整，缺失字段:",
          validation.missing.join(", "),
        );
      }

      // 打印数据摘要
      printStatsSummary(stats);

      console.log("  [开始] 风格分析...");
      var analysis = analyzeStyle(stats, baseline);

      console.log("  [开始] 生成建议...");
      var advice = generateAdvice(analysis, stats);

      console.log("  [完成] 分析完成");

      printAnalysis(p, analysis, advice, baseline, index, isSelf, stats);
    })
    .catch(function (e) {
      var errorMsg = "  数据获取失败: ";
      if (e && typeof e === "object") {
        if (e.type === "rate_limit") {
          errorMsg += "API速率限制，请稍后重试";
        } else if (e.type === "timeout") {
          errorMsg += "请求超时（已重试）";
          console.log("  [调试] 超时URL:", e.url);
        } else if (e.type === "network") {
          errorMsg += "网络连接失败";
        } else if (e.type === "validation") {
          errorMsg += e.message;
        } else {
          errorMsg += e.message || String(e);
        }
      } else {
        errorMsg += String(e);
      }
      console.log(errorMsg);
      createNoDataUI(index, p.nickname, isSelf);
    });
}
