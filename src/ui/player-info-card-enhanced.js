import { getColor, getDealRateColor } from './color-utils.js';
import { escapeHtml } from '../utils/html-escape.js';
import { COLORS, BACKGROUNDS, LAYOUT, TYPOGRAPHY } from './design-tokens.js';

// 获取称号对应的稀有度配置
function getRarity(称号) {
    return COLORS.rarity[称号] || COLORS.rarity['default'];
}

// 构建渐变边框容器样式
function buildCardStyle(rarity) {
    var bg = BACKGROUNDS.card;
    return [
        'position: fixed',
        'border: 1px solid transparent',
        'background: linear-gradient(' + bg + ', ' + bg + ') padding-box, linear-gradient(135deg, ' + rarity.from + ', ' + rarity.to + ') border-box',
        'box-shadow: 0 0 10px ' + rarity.glow + ', ' + BACKGROUNDS.shadow,
        'color: ' + COLORS.text,
        'padding: ' + LAYOUT.padding,
        'border-radius: ' + LAYOUT.borderRadius,
        'font-size: ' + TYPOGRAPHY.data.size,
        'z-index: ' + LAYOUT.zIndex,
        'pointer-events: auto',
        'width: auto',
        'max-width: ' + LAYOUT.maxWidthCompact,
        'cursor: pointer',
        'transition: box-shadow 0.2s ease'
    ].join('; ') + '; ';
}

// 创建无数据提示UI
export function createNoDataUI(index, nickname, isSelf) {
    var existingUI = document.getElementById('player-style-' + index);
    if (existingUI) { existingUI.remove(); }

    var container = document.createElement('div');
    container.id = 'player-style-' + index;
    container.className = 'majsoul-style-info';
    container.style.cssText = [
        'position: fixed',
        'background: ' + BACKGROUNDS.cardDim,
        'border: 1px solid rgba(255,255,255,0.08)',
        'color: ' + COLORS.playerName,
        'padding: ' + LAYOUT.padding,
        'border-radius: ' + LAYOUT.borderRadius,
        'font-size: ' + TYPOGRAPHY.tag.size,
        'z-index: ' + LAYOUT.zIndex,
        'pointer-events: none',
        'white-space: nowrap'
    ].join('; ') + '; ';

    if (isSelf) {
        container.style.cssText += LAYOUT.positions.self;
    } else {
        if (typeof window.majstyleJS === 'undefined') window.majstyleJS = {};
        if (typeof window.majstyleJS.playerUICounter === 'undefined') window.majstyleJS.playerUICounter = 0;
        container.style.cssText += LAYOUT.positions.opponents[window.majstyleJS.playerUICounter % 3];
        window.majstyleJS.playerUICounter++;
    }

    container.innerHTML = '<span style="color: ' + COLORS.playerName + ';">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</span>'
        + '<span style="color: rgba(255,255,255,0.2); margin-left: 6px;">无数据</span>';
    document.body.appendChild(container);
}

// 创建玩家风格信息UI
export function createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, nickname, isSelf, archetype, advice) {
    var existingUI = document.getElementById('player-style-' + index);
    if (existingUI) { existingUI.remove(); }

    var rarity = getRarity(主称号);

    var container = document.createElement('div');
    container.id = 'player-style-' + index;
    container.className = 'majsoul-style-info';
    container.style.cssText = buildCardStyle(rarity);

    if (isSelf) {
        container.style.cssText += LAYOUT.positions.self;
    } else {
        if (typeof window.majstyleJS === 'undefined') window.majstyleJS = {};
        if (typeof window.majstyleJS.playerUICounter === 'undefined') window.majstyleJS.playerUICounter = 0;
        container.style.cssText += LAYOUT.positions.opponents[window.majstyleJS.playerUICounter % 3];
        window.majstyleJS.playerUICounter++;
    }

    // ── 标题行：图标 + 【称号】+ 昵称 ──
    var titleHtml = '<div style="font-size: ' + TYPOGRAPHY.title.size + '; font-weight: ' + TYPOGRAPHY.title.weight + '; margin-bottom: 3px; white-space: nowrap;">';
    titleHtml += '<span style="margin-right: 4px;">' + rarity.icon + '</span>';
    titleHtml += '<span style="background: linear-gradient(90deg, ' + rarity.from + ', ' + rarity.to + '); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">【' + escapeHtml(主称号) + '】</span>';
    titleHtml += '<span style="color: ' + COLORS.playerName + '; font-size: ' + TYPOGRAPHY.tag.size + '; font-weight: normal; margin-left: 4px;">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</span>';
    titleHtml += '</div>';

    // ── 标签行 ──
    var tagHtml = '';
    if (标签.length > 0) {
        tagHtml = '<div style="color: ' + COLORS.tag + '; font-size: ' + TYPOGRAPHY.tag.size + '; margin-bottom: 5px; letter-spacing: 0.3px;">'
            + 标签.slice(0, 4).map(escapeHtml).join(' · ')
            + '</div>';
    }

    // ── 分隔线 ──
    var divider = '<div style="border-top: 1px solid ' + COLORS.divider + '; margin-bottom: 4px;"></div>';

    // ── 数据行 ──
    var 立直偏差 = (数据.立直率 - baseline.立直率).toFixed(1);
    var 副露偏差 = (数据.副露率 - baseline.副露率).toFixed(1);
    var 和牌偏差 = (数据.和牌率 - baseline.和牌率).toFixed(1);
    var 放铳偏差 = 偏差.放铳率.toFixed(1);
    var 打点偏差 = 偏差.打点.toFixed(0);

    function dataRow(label, value, deviationStr, color) {
        var sign = parseFloat(deviationStr) > 0 ? '+' : '';
        return '<div style="display: flex; justify-content: space-between; line-height: ' + TYPOGRAPHY.lineHeight + ';">'
            + '<span style="color: rgba(255,255,255,0.45); margin-right: 8px;">' + label + '</span>'
            + '<span style="color: ' + color + ';">' + value + ' <span style="font-size: 8px; opacity: 0.8;">(' + sign + deviationStr + ')</span></span>'
            + '</div>';
    }

    var dataHtml = '<div style="font-size: ' + TYPOGRAPHY.data.size + ';">'
        + dataRow('立直', 数据.立直率.toFixed(1) + '%', 立直偏差 + '%', getColor(parseFloat(立直偏差), 2))
        + dataRow('副露', 数据.副露率.toFixed(1) + '%', 副露偏差 + '%', getColor(parseFloat(副露偏差), 3))
        + dataRow('和牌', 数据.和牌率.toFixed(1) + '%', 和牌偏差 + '%', getColor(parseFloat(和牌偏差), 1.5))
        + dataRow('放铳', 数据.放铳率.toFixed(1) + '%', 放铳偏差 + '%', getDealRateColor(parseFloat(放铳偏差), 1.5))
        + dataRow('打点', String(数据.平均打点), 打点偏差, getColor(parseFloat(打点偏差), 300))
        + '</div>';

    // ── 精简视图 ──
    var compactHtml = titleHtml + tagHtml + divider + dataHtml;

    // ── 展开视图（+策略建议）──
    var detailExtra = '';
    if (advice && advice.策略建议 && advice.策略建议.length > 0) {
        detailExtra += '<div style="border-top: 1px solid ' + COLORS.divider + '; margin-top: 5px; padding-top: 4px;">';
        detailExtra += '<div style="font-size: ' + TYPOGRAPHY.tag.size + '; color: ' + COLORS.strategyTitle + '; margin-bottom: 3px; font-weight: bold;">策略</div>';
        for (var i = 0; i < Math.min(advice.策略建议.length, 3); i++) {
            var s = advice.策略建议[i];
            var text = typeof s === 'string' ? s : s.建议;
            var pColor = s.优先级 >= 7 ? COLORS.priority.high : s.优先级 >= 4 ? COLORS.priority.mid : COLORS.priority.low;
            detailExtra += '<div style="font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.textMuted + '; border-left: 2px solid ' + pColor + '; padding-left: 5px; margin-bottom: 3px;">• ' + escapeHtml(text) + '</div>';
        }
        detailExtra += '</div>';
    }

    var hintStyle = 'font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.hint + '; text-align: right; margin-top: 3px;';
    var html = '<div class="compact-view">' + compactHtml + '<div style="' + hintStyle + '">▾</div></div>';
    html += '<div class="detail-view" style="display:none;">' + compactHtml + detailExtra + '<div style="' + hintStyle + '">▴</div></div>';

    container.innerHTML = html;
    document.body.appendChild(container);

    container.addEventListener('click', function(e) {
        e.stopPropagation();
        var cv = container.querySelector('.compact-view');
        var dv = container.querySelector('.detail-view');
        if (cv.style.display === 'none') {
            cv.style.display = 'block';
            dv.style.display = 'none';
            container.style.maxWidth = LAYOUT.maxWidthCompact;
        } else {
            cv.style.display = 'none';
            dv.style.display = 'block';
            container.style.maxWidth = LAYOUT.maxWidthExpanded;
        }
    });
}
