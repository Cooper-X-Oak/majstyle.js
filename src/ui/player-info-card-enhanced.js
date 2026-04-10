import { getColor } from './color-utils.js';
import { escapeHtml } from '../utils/html-escape.js';
import { COLORS, BACKGROUNDS, LAYOUT, TYPOGRAPHY } from './design-tokens.js';

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
        'color: ' + COLORS.playerName,
        'padding: ' + LAYOUT.padding,
        'border-radius: ' + LAYOUT.borderRadius,
        'font-size: ' + TYPOGRAPHY.body.size,
        'z-index: ' + LAYOUT.zIndex,
        'box-shadow: ' + BACKGROUNDS.shadow,
        'pointer-events: none',
        'width: auto',
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

    var html = '<div style="color: ' + COLORS.playerName + '; font-size: ' + TYPOGRAPHY.body.size + ';">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</div>';
    html += '<div style="color: ' + COLORS.hint + '; font-size: ' + TYPOGRAPHY.aux.size + '; margin-top: 2px;">无牌谱数据</div>';
    container.innerHTML = html;
    document.body.appendChild(container);
}

// 创建玩家风格信息UI（增强版）
export function createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, nickname, isSelf, archetype, advice) {
    var existingUI = document.getElementById('player-style-' + index);
    if (existingUI) { existingUI.remove(); }

    var container = document.createElement('div');
    container.id = 'player-style-' + index;
    container.className = 'majsoul-style-info';
    container.style.cssText = [
        'position: fixed',
        'background: ' + BACKGROUNDS.card,
        'color: ' + COLORS.text,
        'padding: ' + LAYOUT.padding,
        'border-radius: ' + LAYOUT.borderRadius,
        'font-size: ' + TYPOGRAPHY.body.size,
        'z-index: ' + LAYOUT.zIndex,
        'box-shadow: ' + BACKGROUNDS.shadow,
        'pointer-events: auto',
        'width: auto',
        'max-width: ' + LAYOUT.maxWidthCompact,
        'cursor: pointer',
        'transition: all 0.2s ease'
    ].join('; ') + '; ';

    if (isSelf) {
        container.style.cssText += LAYOUT.positions.self;
    } else {
        if (typeof window.majstyleJS === 'undefined') window.majstyleJS = {};
        if (typeof window.majstyleJS.playerUICounter === 'undefined') window.majstyleJS.playerUICounter = 0;
        container.style.cssText += LAYOUT.positions.opponents[window.majstyleJS.playerUICounter % 3];
        window.majstyleJS.playerUICounter++;
    }

    var titleText = archetype ? (archetype.icon + ' ' + archetype.name) : 主称号;
    var playerNameHtml = '<span style="color: ' + COLORS.playerName + '; font-size: ' + TYPOGRAPHY.aux.size + ';">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</span>';
    var titleStyle = 'font-weight: ' + TYPOGRAPHY.title.weight + '; font-size: ' + TYPOGRAPHY.title.size + '; color: ' + COLORS.title + '; margin-bottom: 4px;';
    var dividerStyle = 'border-top: 1px solid ' + COLORS.divider + '; padding-top: 4px; margin-top: 4px;';

    // ── 精简视图 ──
    var compactHtml = '<div style="' + titleStyle + '">【' + escapeHtml(titleText) + '】' + playerNameHtml + '</div>';

    if (advice && advice.进攻强度 && advice.防守强度) {
        compactHtml += '<div style="font-size: ' + TYPOGRAPHY.body.size + '; line-height: ' + TYPOGRAPHY.lineHeight + ';">';
        compactHtml += '⚔️ <span style="color: ' + advice.进攻强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.进攻强度.标签) + '</span> ';
        compactHtml += '🛡️ <span style="color: ' + advice.防守强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.防守强度.标签) + '</span>';
        compactHtml += '</div>';
    }

    if (advice && advice.危险度) {
        compactHtml += '<div style="font-size: ' + TYPOGRAPHY.body.size + '; color: ' + getDangerColor(advice.危险度.分数) + '; margin-top: 2px;">';
        compactHtml += advice.危险度.图标 + ' ' + advice.危险度.分数 + '/10';
        compactHtml += '</div>';
    }

    compactHtml += '<div style="font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.hint + '; margin-top: 4px; text-align: center;">▼ 点击展开</div>';

    // ── 详细视图 ──
    var detailHtml = '<div style="' + titleStyle + '">【' + escapeHtml(titleText) + '】' + playerNameHtml + '</div>';

    if (advice && advice.进攻强度 && advice.防守强度) {
        detailHtml += '<div style="margin-bottom: 4px; font-size: ' + TYPOGRAPHY.body.size + '; line-height: ' + TYPOGRAPHY.lineHeight + ';">';
        detailHtml += '⚔️ <span style="color: ' + advice.进攻强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.进攻强度.标签) + '</span>';
        if (advice.进攻强度.态度词) {
            detailHtml += ' <span style="color: ' + COLORS.secondary + ';">(' + escapeHtml(advice.进攻强度.态度词) + ')</span>';
        }
        detailHtml += '<br>';
        detailHtml += '🛡️ <span style="color: ' + advice.防守强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.防守强度.标签) + '</span>';
        if (advice.防守强度.态度词) {
            detailHtml += ' <span style="color: ' + COLORS.secondary + ';">(' + escapeHtml(advice.防守强度.态度词) + ')</span>';
        }
        detailHtml += '</div>';
    }

    if (advice && advice.危险度) {
        detailHtml += '<div style="font-size: ' + TYPOGRAPHY.body.size + '; color: ' + getDangerColor(advice.危险度.分数) + '; margin-bottom: 4px;">';
        detailHtml += advice.危险度.图标 + ' 危险度: ' + advice.危险度.分数 + '/10 - ' + escapeHtml(advice.危险度.标签);
        detailHtml += '</div>';
    }

    detailHtml += '<div style="line-height: ' + TYPOGRAPHY.lineHeight + '; font-size: ' + TYPOGRAPHY.body.size + '; ' + dividerStyle + '">';

    var 立直偏差 = (数据.立直率 - baseline.立直率).toFixed(1);
    var 副露偏差 = (数据.副露率 - baseline.副露率).toFixed(1);
    var 和牌偏差 = (数据.和牌率 - baseline.和牌率).toFixed(1);
    var 放铳偏差 = 偏差.放铳率.toFixed(1);
    var 打点偏差 = 偏差.打点.toFixed(0);

    detailHtml += '<div>立直: <span style="color: ' + getColor(parseFloat(立直偏差), 2) + '">' + 数据.立直率.toFixed(1) + '% (' + (立直偏差 > 0 ? '+' : '') + 立直偏差 + '%)</span></div>';
    detailHtml += '<div>副露: <span style="color: ' + getColor(parseFloat(副露偏差), 3) + '">' + 数据.副露率.toFixed(1) + '% (' + (副露偏差 > 0 ? '+' : '') + 副露偏差 + '%)</span></div>';
    detailHtml += '<div>和牌: <span style="color: ' + getColor(parseFloat(和牌偏差), 1.5) + '">' + 数据.和牌率.toFixed(1) + '% (' + (和牌偏差 > 0 ? '+' : '') + 和牌偏差 + '%)</span></div>';
    detailHtml += '<div>放铳: <span style="color: ' + getColor(parseFloat(放铳偏差), 1.5) + '">' + 数据.放铳率.toFixed(1) + '% (' + (放铳偏差 > 0 ? '+' : '') + 放铳偏差 + '%)</span></div>';
    detailHtml += '<div>打点: <span style="color: ' + getColor(parseFloat(打点偏差), 300) + '">' + 数据.平均打点 + ' (' + (打点偏差 > 0 ? '+' : '') + 打点偏差 + ')</span></div>';
    detailHtml += '</div>';

    if (advice && advice.策略建议 && advice.策略建议.length > 0) {
        detailHtml += '<div style="' + dividerStyle + '">';
        detailHtml += '<div style="font-weight: bold; font-size: ' + TYPOGRAPHY.body.size + '; color: ' + COLORS.strategyTitle + '; margin-bottom: 4px;">策略建议:</div>';

        for (var i = 0; i < Math.min(advice.策略建议.length, 3); i++) {
            var strategy = advice.策略建议[i];
            if (typeof strategy === 'string') {
                detailHtml += '<div style="margin-bottom: 4px; font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.textMuted + ';">• ' + escapeHtml(strategy) + '</div>';
            } else {
                var priorityColor = getPriorityColor(strategy.优先级);
                detailHtml += '<div style="margin-bottom: 4px; font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.textMuted + '; border-left: 2px solid ' + priorityColor + '; padding-left: 4px;">';
                detailHtml += '• ' + escapeHtml(strategy.建议);
                detailHtml += '</div>';
            }
        }

        detailHtml += '</div>';
    }

    detailHtml += '<div style="font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.hint + '; margin-top: 4px; text-align: center;">▲ 点击收起</div>';

    var html = '<div class="compact-view">' + compactHtml + '</div>';
    html += '<div class="detail-view" style="display: none;">' + detailHtml + '</div>';

    container.innerHTML = html;
    document.body.appendChild(container);

    container.addEventListener('click', function(e) {
        e.stopPropagation();
        var compactView = container.querySelector('.compact-view');
        var detailView = container.querySelector('.detail-view');

        if (compactView.style.display === 'none') {
            compactView.style.display = 'block';
            detailView.style.display = 'none';
            container.style.maxWidth = LAYOUT.maxWidthCompact;
        } else {
            compactView.style.display = 'none';
            detailView.style.display = 'block';
            container.style.maxWidth = LAYOUT.maxWidthExpanded;
        }
    });
}

// 危险度颜色（使用设计令牌）
function getDangerColor(score) {
    if (score >= 9) return COLORS.danger.critical;
    if (score >= 7) return COLORS.danger.high;
    if (score >= 5) return COLORS.danger.medium;
    if (score >= 3) return COLORS.danger.low;
    return COLORS.danger.safe;
}

// 优先级颜色（复用危险度色阶）
function getPriorityColor(priority) {
    if (priority >= 8) return COLORS.danger.critical;
    if (priority >= 6) return COLORS.danger.high;
    if (priority >= 4) return COLORS.danger.medium;
    if (priority >= 2) return COLORS.danger.low;
    return COLORS.danger.safe;
}
