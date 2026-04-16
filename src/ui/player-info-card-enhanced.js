import { getDeviationColor, getDealInRateColor } from "./color-utils.js";
import { escapeHtml } from "../utils/html-escape.js";
import { COLORS, BACKGROUNDS, LAYOUT, TYPOGRAPHY } from "./design-tokens.js";

// 获取称号对应的稀有度配置
function getRarity(称号) {
  return COLORS.rarity[称号] || COLORS.rarity["default"];
}

// 构建渐变边框容器样式（容器只负责 border gradient，不含背景填充）
function buildCardStyle(rarity) {
  return (
    [
      "position: fixed",
      "border: 1px solid transparent",
      "background: linear-gradient(135deg, " +
        rarity.from +
        ", " +
        rarity.to +
        ") border-box",
      "box-shadow: 0 0 10px " + rarity.glow + ", " + BACKGROUNDS.shadow,
      "color: " + COLORS.text,
      "padding: 0",
      "border-radius: " + LAYOUT.borderRadius,
      "font-size: " + TYPOGRAPHY.data.size,
      "z-index: " + LAYOUT.zIndex,
      "pointer-events: auto",
      "width: auto",
      "max-width: " + LAYOUT.maxWidthExpanded,
      "cursor: pointer",
      "transition: max-width 0.2s ease, box-shadow 0.2s ease",
    ].join("; ") + "; "
  );
}

// 创建无数据提示UI
export function createNoDataUI(index, nickname, isSelf) {
  var existingUI = document.getElementById("player-style-" + index);
  if (existingUI) {
    existingUI.remove();
  }

  var container = document.createElement("div");
  container.id = "player-style-" + index;
  container.className = "majsoul-style-info";
  container.style.cssText =
    [
      "position: fixed",
      "background: " + BACKGROUNDS.cardDim,
      "border: 1px solid rgba(255,255,255,0.08)",
      "color: " + COLORS.playerName,
      "padding: " + LAYOUT.padding,
      "border-radius: " + LAYOUT.borderRadius,
      "font-size: " + TYPOGRAPHY.tag.size,
      "z-index: " + LAYOUT.zIndex,
      "pointer-events: none",
      "white-space: nowrap",
    ].join("; ") + "; ";

  // 使用座位索引分配位置
  if (isSelf) {
    container.style.cssText += LAYOUT.positions.self;
  } else {
    // 计算对手位置索引：跳过自己的座位
    var opponentIndex = 0;
    if (
      typeof window.majstyleJS !== "undefined" &&
      typeof window.majstyleJS.selfSeatIndex === "number"
    ) {
      // 根据座位索引计算对手的显示位置
      var offset = index - window.majstyleJS.selfSeatIndex;
      if (offset < 0) offset += 4;
      opponentIndex = (offset - 1) % 3;
    } else {
      opponentIndex = index % 3;
    }
    container.style.cssText += LAYOUT.positions.opponents[opponentIndex];
  }

  container.innerHTML =
    '<span style="color: ' +
    COLORS.playerName +
    ';">' +
    escapeHtml(nickname) +
    (isSelf ? " [你]" : "") +
    "</span>" +
    '<span style="color: rgba(255,255,255,0.2); margin-left: 6px;">无数据</span>';
  document.body.appendChild(container);
}

// 创建玩家风格信息UI
export function createPlayerInfoUI(
  index,
  主称号,
  标签,
  数据,
  偏差,
  baseline,
  nickname,
  isSelf,
  archetype,
  advice,
) {
  var existingUI = document.getElementById("player-style-" + index);
  if (existingUI) {
    existingUI.remove();
  }

  var rarity = getRarity(主称号);

  var container = document.createElement("div");
  container.id = "player-style-" + index;
  container.className = "majsoul-style-info";
  container.style.cssText = buildCardStyle(rarity);

  // 初始化全局状态
  if (typeof window.majstyleJS === "undefined") window.majstyleJS = {};
  if (typeof window.majstyleJS.cardsCollapsed === "undefined")
    window.majstyleJS.cardsCollapsed = false;
  if (typeof window.majstyleJS.cardsData === "undefined")
    window.majstyleJS.cardsData = {};

  // 保存卡片数据，用于折叠后恢复
  window.majstyleJS.cardsData[index] = {
    主称号: 主称号,
    标签: 标签,
    数据: 数据,
    偏差: 偏差,
    baseline: baseline,
    nickname: nickname,
    isSelf: isSelf,
    rarity: rarity,
  };

  var positionCss;
  if (isSelf) {
    positionCss = LAYOUT.positions.self;
    container.style.cssText += positionCss;
    // 记录自己的座位索引，供其他卡片计算位置
    window.majstyleJS.selfSeatIndex = index;
  } else {
    // 计算对手位置索引：跳过自己的座位
    var opponentIndex = 0;
    if (typeof window.majstyleJS.selfSeatIndex === "number") {
      var offset = index - window.majstyleJS.selfSeatIndex;
      if (offset < 0) offset += 4;
      opponentIndex = (offset - 1) % 3;
    } else {
      opponentIndex = index % 3;
    }
    positionCss = LAYOUT.positions.opponents[opponentIndex];
    container.style.cssText += positionCss;
  }

  // ── 标题行（始终可见，点击折叠/展开）──
  var titleHtml =
    '<div class="card-title" style="font-size: ' +
    TYPOGRAPHY.title.size +
    "; font-weight: " +
    TYPOGRAPHY.title.weight +
    '; white-space: nowrap;">';
  titleHtml += '<span style="margin-right: 4px;">' + rarity.icon + "</span>";
  titleHtml +=
    '<span style="background: linear-gradient(90deg, ' +
    rarity.from +
    ", " +
    rarity.to +
    '); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">' +
    escapeHtml(主称号) +
    "</span>";
  titleHtml +=
    '<span class="player-name" style="color: ' +
    COLORS.playerName +
    "; font-size: " +
    TYPOGRAPHY.tag.size +
    '; font-weight: normal; margin-left: 4px;">' +
    escapeHtml(nickname) +
    (isSelf ? " [你]" : "") +
    "</span>";
  titleHtml += "</div>";

  // ── 标签行 ──
  var tagHtml = "";
  if (标签.length > 0) {
    tagHtml =
      '<div style="color: ' +
      COLORS.tag +
      "; font-size: " +
      TYPOGRAPHY.tag.size +
      '; letter-spacing: 0.3px; margin-bottom: 4px;">' +
      标签.slice(0, 4).map(escapeHtml).join(" · ") +
      "</div>";
  }

  // ── 分隔线 ──
  var divider =
    '<div style="border-top: 1px solid ' +
    COLORS.divider +
    '; margin-bottom: 4px;"></div>';

  // ── 数据行 ──
  var 立直偏差 = (数据.立直率 - baseline.立直率).toFixed(1);
  var 副露偏差 = (数据.副露率 - baseline.副露率).toFixed(1);
  var 和牌偏差 = (数据.和牌率 - baseline.和牌率).toFixed(1);
  var 放铳偏差 = 偏差.放铳率.toFixed(1);
  var 打点偏差 = 偏差.打点.toFixed(0);

  function dataRow(label, value, deviationStr, color) {
    var sign = parseFloat(deviationStr) > 0 ? "+" : "";
    return (
      '<div style="display: flex; justify-content: space-between; line-height: ' +
      TYPOGRAPHY.lineHeight +
      ';">' +
      '<span style="color: rgba(255,255,255,0.45); margin-right: 8px;">' +
      label +
      "</span>" +
      '<span style="color: ' +
      color +
      ';">' +
      value +
      ' <span style="font-size: 8px; opacity: 0.8;">(' +
      sign +
      deviationStr +
      ")</span></span>" +
      "</div>"
    );
  }

  var dataHtml =
    '<div style="font-size: ' +
    TYPOGRAPHY.data.size +
    ';">' +
    dataRow(
      "立直",
      数据.立直率.toFixed(1) + "%",
      立直偏差 + "%",
      getDeviationColor(parseFloat(立直偏差), 2),
    ) +
    dataRow(
      "副露",
      数据.副露率.toFixed(1) + "%",
      副露偏差 + "%",
      getDeviationColor(parseFloat(副露偏差), 3),
    ) +
    dataRow(
      "和牌",
      数据.和牌率.toFixed(1) + "%",
      和牌偏差 + "%",
      getDeviationColor(parseFloat(和牌偏差), 1.5),
    ) +
    dataRow(
      "放铳",
      数据.放铳率.toFixed(1) + "%",
      放铳偏差 + "%",
      getDealInRateColor(parseFloat(放铳偏差), 1.5),
    ) +
    dataRow(
      "打点",
      String(数据.平均打点),
      打点偏差,
      getDeviationColor(parseFloat(打点偏差), 300),
    ) +
    "</div>";

  // ── 卡片主体（可折叠，带滑动动画）──
  var bodyHtml =
    '<div class="card-body" style="overflow: hidden; max-height: 400px; opacity: 1; margin-top: 3px; transition: max-height 0.25s ease, opacity 0.18s ease;">' +
    tagHtml +
    divider +
    dataHtml +
    "</div>";

  // card-bg 负责背景填充（独立于 border gradient，方便 JS 直接改色）
  var innerBgStyle =
    "background: " +
    BACKGROUNDS.card +
    "; border-radius: 9px; padding: " +
    LAYOUT.padding +
    "; transition: background 0.2s ease;";
  container.innerHTML =
    '<div class="card-bg" style="' +
    innerBgStyle +
    '">' +
    titleHtml +
    bodyHtml +
    "</div>";
  document.body.appendChild(container);

  // 折叠态：用独立 div 替换整个 innerHTML，彻底抛弃渐变边框
  var collapsedCssText =
    [
      "position: fixed",
      "background: transparent",
      "border: 1px solid rgba(255,255,255,0.35)",
      "color: #fff",
      "padding: 4px 8px",
      "border-radius: " + LAYOUT.borderRadius,
      "font-size: " + TYPOGRAPHY.title.size,
      "font-weight: " + TYPOGRAPHY.title.weight,
      "z-index: " + LAYOUT.zIndex,
      "pointer-events: auto",
      "cursor: pointer",
      "white-space: nowrap",
    ].join("; ") + "; ";

  // 点击：全局同步展开 ↔ 折叠
  container.addEventListener("click", function (e) {
    e.stopPropagation();
    // 切换全局折叠状态
    window.majstyleJS.cardsCollapsed = !window.majstyleJS.cardsCollapsed;
    var globalCollapsed = window.majstyleJS.cardsCollapsed;

    // 同步所有信息卡
    var allCards = document.querySelectorAll(".majsoul-style-info");
    allCards.forEach(function (card) {
      var cardId = card.id;
      var cardIndex = parseInt(cardId.replace("player-style-", ""));
      var cardData = window.majstyleJS.cardsData[cardIndex];

      // 如果没有保存的数据，跳过
      if (!cardData) return;

      var cardIsSelf =
        typeof window.majstyleJS.selfSeatIndex === "number" &&
        cardIndex === window.majstyleJS.selfSeatIndex;

      // 计算该卡片的位置
      var cardPositionCss;
      if (cardIsSelf) {
        cardPositionCss = LAYOUT.positions.self;
      } else {
        var cardOpponentIndex = 0;
        if (typeof window.majstyleJS.selfSeatIndex === "number") {
          var cardOffset = cardIndex - window.majstyleJS.selfSeatIndex;
          if (cardOffset < 0) cardOffset += 4;
          cardOpponentIndex = (cardOffset - 1) % 3;
        } else {
          cardOpponentIndex = cardIndex % 3;
        }
        cardPositionCss = LAYOUT.positions.opponents[cardOpponentIndex];
      }

      if (globalCollapsed) {
        // 折叠：只显示图标
        card.style.cssText = collapsedCssText + cardPositionCss;
        card.innerHTML = "<span>" + cardData.rarity.icon + "</span>";
      } else {
        // 展开：从保存的数据恢复完整卡片
        var cardRarity = cardData.rarity;

        // 重建标题
        var cardTitleHtml =
          '<div class="card-title" style="font-size: ' +
          TYPOGRAPHY.title.size +
          "; font-weight: " +
          TYPOGRAPHY.title.weight +
          '; white-space: nowrap;">';
        cardTitleHtml +=
          '<span style="margin-right: 4px;">' + cardRarity.icon + "</span>";
        cardTitleHtml +=
          '<span style="background: linear-gradient(90deg, ' +
          cardRarity.from +
          ", " +
          cardRarity.to +
          '); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">' +
          escapeHtml(cardData.主称号) +
          "</span>";
        cardTitleHtml +=
          '<span class="player-name" style="color: ' +
          COLORS.playerName +
          "; font-size: " +
          TYPOGRAPHY.tag.size +
          '; font-weight: normal; margin-left: 4px;">' +
          escapeHtml(cardData.nickname) +
          (cardData.isSelf ? " [你]" : "") +
          "</span>";
        cardTitleHtml += "</div>";

        // 重建标签
        var cardTagHtml = "";
        if (cardData.标签.length > 0) {
          cardTagHtml =
            '<div style="color: ' +
            COLORS.tag +
            "; font-size: " +
            TYPOGRAPHY.tag.size +
            '; letter-spacing: 0.3px; margin-bottom: 4px;">' +
            cardData.标签.slice(0, 4).map(escapeHtml).join(" · ") +
            "</div>";
        }

        // 重建数据行
        var 立直偏差 = (
          cardData.数据.立直率 - cardData.baseline.立直率
        ).toFixed(1);
        var 副露偏差 = (
          cardData.数据.副露率 - cardData.baseline.副露率
        ).toFixed(1);
        var 和牌偏差 = (
          cardData.数据.和牌率 - cardData.baseline.和牌率
        ).toFixed(1);
        var 放铳偏差 = cardData.偏差.放铳率.toFixed(1);
        var 打点偏差 = cardData.偏差.打点.toFixed(0);

        function cardDataRow(label, value, deviationStr, color) {
          var sign = parseFloat(deviationStr) > 0 ? "+" : "";
          return (
            '<div style="display: flex; justify-content: space-between; line-height: ' +
            TYPOGRAPHY.lineHeight +
            ';">' +
            '<span style="color: rgba(255,255,255,0.45); margin-right: 8px;">' +
            label +
            "</span>" +
            '<span style="color: ' +
            color +
            ';">' +
            value +
            ' <span style="font-size: 8px; opacity: 0.8;">(' +
            sign +
            deviationStr +
            ")</span></span>" +
            "</div>"
          );
        }

        var cardDataHtml =
          '<div style="font-size: ' +
          TYPOGRAPHY.data.size +
          ';">' +
          cardDataRow(
            "立直",
            cardData.数据.立直率.toFixed(1) + "%",
            立直偏差 + "%",
            getDeviationColor(parseFloat(立直偏差), 2),
          ) +
          cardDataRow(
            "副露",
            cardData.数据.副露率.toFixed(1) + "%",
            副露偏差 + "%",
            getDeviationColor(parseFloat(副露偏差), 3),
          ) +
          cardDataRow(
            "和牌",
            cardData.数据.和牌率.toFixed(1) + "%",
            和牌偏差 + "%",
            getDeviationColor(parseFloat(和牌偏差), 1.5),
          ) +
          cardDataRow(
            "放铳",
            cardData.数据.放铳率.toFixed(1) + "%",
            放铳偏差 + "%",
            getDealInRateColor(parseFloat(放铳偏差), 1.5),
          ) +
          cardDataRow(
            "打点",
            String(cardData.数据.平均打点),
            打点偏差,
            getDeviationColor(parseFloat(打点偏差), 300),
          ) +
          "</div>";

        var cardDivider =
          '<div style="border-top: 1px solid ' +
          COLORS.divider +
          '; margin-bottom: 4px;"></div>';

        var cardBodyHtml =
          '<div class="card-body" style="overflow: hidden; max-height: 400px; opacity: 1; margin-top: 3px; transition: max-height 0.25s ease, opacity 0.18s ease;">' +
          cardTagHtml +
          cardDivider +
          cardDataHtml +
          "</div>";

        var cardInnerBgStyle =
          "background: " +
          BACKGROUNDS.card +
          "; border-radius: 9px; padding: " +
          LAYOUT.padding +
          "; transition: background 0.2s ease;";

        card.style.cssText = buildCardStyle(cardRarity) + cardPositionCss;
        card.innerHTML =
          '<div class="card-bg" style="' +
          cardInnerBgStyle +
          '">' +
          cardTitleHtml +
          cardBodyHtml +
          "</div>";
      }
    });
  });

  // 应用初始折叠状态
  if (window.majstyleJS.cardsCollapsed) {
    container.style.cssText = collapsedCssText + positionCss;
    container.innerHTML = "<span>" + rarity.icon + "</span>";
  }
}
