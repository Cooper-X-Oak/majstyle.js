import { getColor } from './color-utils.js';
import { escapeHtml } from '../utils/html-escape.js';

// 创建无数据提示UI
export function createNoDataUI(index, nickname, isSelf) {
    var existingUI = document.getElementById('player-style-' + index);
    if (existingUI) {
        existingUI.remove();
    }

    var container = document.createElement('div');
    container.id = 'player-style-' + index;
    container.className = 'majsoul-style-info';
    container.style.cssText = 'position: fixed; background: rgba(0,0,0,0.5); color: #888; padding: 6px 10px; border-radius: 8px; font-size: 10px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5); pointer-events: none; width: auto; white-space: nowrap;';

    // 根据是否是自己来决定位置
    if (isSelf) {
        container.style.cssText += 'bottom: 120px; left: 20px;';
    } else {
        var otherPositions = [
            'top: 120px; right: 20px;',
            'top: 20px; left: 75%; transform: translateX(-50%);',
            'top: 120px; left: 20px;'
        ];
        if (typeof window.majstyleJS === 'undefined') {
            window.majstyleJS = {};
        }
        if (typeof window.majstyleJS.playerUICounter === 'undefined') {
            window.majstyleJS.playerUICounter = 0;
        }
        container.style.cssText += otherPositions[window.majstyleJS.playerUICounter % 3];
        window.majstyleJS.playerUICounter++;
    }

    var html = '<div style="color: #aaa; font-size: 10px;">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</div>';
    html += '<div style="color: #666; font-size: 9px; margin-top: 2px;">无牌谱数据</div>';

    container.innerHTML = html;
    document.body.appendChild(container);
}

// 创建玩家风格信息UI（增强版 - 包含建议解释）
export function createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, nickname, isSelf, archetype, advice) {
    var existingUI = document.getElementById('player-style-' + index);
    if (existingUI) {
        existingUI.remove();
    }

    var container = document.createElement('div');
    container.id = 'player-style-' + index;
    container.className = 'majsoul-style-info';
    container.style.cssText = 'position: fixed; background: rgba(0,0,0,0.75); color: #fff; padding: 6px 10px; border-radius: 8px; font-size: 10px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5); pointer-events: auto; width: auto; max-width: 200px; cursor: pointer; transition: all 0.2s ease;';

    // 根据是否是自己来决定位置
    var positions;
    if (isSelf) {
        // 自己固定在左下角
        positions = ['bottom: 140px; left: 10px;'];
        container.style.cssText += positions[0];
    } else {
        // 其他玩家按顺序分配到其他三个位置
        var otherPositions = [
            'top: 140px; right: 10px;',     // 右上角
            'top: 10px; right: 10px;',      // 右上角（更靠上）
            'top: 140px; left: 10px;'       // 左上角
        ];
        // 使用一个全局计数器来分配位置
        if (typeof window.majstyleJS === 'undefined') {
            window.majstyleJS = {};
        }
        if (typeof window.majstyleJS.playerUICounter === 'undefined') {
            window.majstyleJS.playerUICounter = 0;
        }
        container.style.cssText += otherPositions[window.majstyleJS.playerUICounter % 3];
        window.majstyleJS.playerUICounter++;
    }

    // 构建标题行（包含原型信息和危险度）
    var titleText = 主称号;
    if (archetype) {
        titleText = archetype.icon + ' ' + archetype.name;
    }

    var 玩家名 = '<span style="color: #aaa; font-size: 9px;">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</span>';

    // 精简版内容（默认显示）
    var compactHtml = '<div style="font-weight: bold; font-size: 11px; color: #ffd700; margin-bottom: 4px;">【' + escapeHtml(titleText) + '】' + 玩家名 + '</div>';

    // 强度评估（精简版）
    if (advice && advice.进攻强度 && advice.防守强度) {
        compactHtml += '<div style="font-size: 9px; line-height: 1.4;">';
        compactHtml += '⚔️ <span style="color: ' + advice.进攻强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.进攻强度.标签) + '</span> ';
        compactHtml += '🛡️ <span style="color: ' + advice.防守强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.防守强度.标签) + '</span>';
        compactHtml += '</div>';
    }

    // 危险度（精简版）
    if (advice && advice.危险度) {
        var dangerLevel = advice.危险度;
        compactHtml += '<div style="font-size: 9px; color: ' + getDangerColor(dangerLevel.分数) + '; margin-top: 2px;">';
        compactHtml += dangerLevel.图标 + ' ' + dangerLevel.分数 + '/10';
        compactHtml += '</div>';
    }

    compactHtml += '<div style="font-size: 8px; color: #666; margin-top: 4px; text-align: center;">▼ 点击展开</div>';

    // 详细版内容（点击后显示）
    var detailHtml = '<div style="font-weight: bold; font-size: 11px; color: #ffd700; margin-bottom: 4px;">【' + escapeHtml(titleText) + '】' + 玩家名 + '</div>';

    // 强度评估（详细版）
    if (advice && advice.进攻强度 && advice.防守强度) {
        detailHtml += '<div style="margin-bottom: 4px; font-size: 9px; line-height: 1.4;">';
        detailHtml += '⚔️ <span style="color: ' + advice.进攻强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.进攻强度.标签) + '</span>';
        if (advice.进攻强度.态度词) {
            detailHtml += ' <span style="color: #999;">(' + escapeHtml(advice.进攻强度.态度词) + ')</span>';
        }
        detailHtml += '<br>';
        detailHtml += '🛡️ <span style="color: ' + advice.防守强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.防守强度.标签) + '</span>';
        if (advice.防守强度.态度词) {
            detailHtml += ' <span style="color: #999;">(' + escapeHtml(advice.防守强度.态度词) + ')</span>';
        }
        detailHtml += '</div>';
    }

    // 危险度评分（详细版）
    if (advice && advice.危险度) {
        var dangerLevel = advice.危险度;
        detailHtml += '<div style="font-size: 9px; color: ' + getDangerColor(dangerLevel.分数) + '; margin-bottom: 4px;">';
        detailHtml += dangerLevel.图标 + ' 危险度: ' + dangerLevel.分数 + '/10 - ' + escapeHtml(dangerLevel.标签);
        detailHtml += '</div>';
    }

    // 基础数据
    detailHtml += '<div style="line-height: 1.4; font-size: 9px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 4px; margin-top: 4px;">';

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

    // 策略建议（前3条）
    if (advice && advice.策略建议 && advice.策略建议.length > 0) {
        detailHtml += '<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 4px; margin-top: 4px;">';
        detailHtml += '<div style="font-weight: bold; font-size: 9px; color: #4fc3f7; margin-bottom: 4px;">策略建议:</div>';

        for (var i = 0; i < Math.min(advice.策略建议.length, 3); i++) {
            var strategy = advice.策略建议[i];

            if (typeof strategy === 'string') {
                detailHtml += '<div style="margin-bottom: 4px; font-size: 8px; color: #ddd;">• ' + escapeHtml(strategy) + '</div>';
            } else {
                var priorityColor = getPriorityColor(strategy.优先级);
                detailHtml += '<div style="margin-bottom: 4px; font-size: 8px; color: #ddd; border-left: 2px solid ' + priorityColor + '; padding-left: 4px;">';
                detailHtml += '• ' + escapeHtml(strategy.建议);
                detailHtml += '</div>';
            }
        }

        detailHtml += '</div>';
    }

    detailHtml += '<div style="font-size: 8px; color: #666; margin-top: 4px; text-align: center;">▲ 点击收起</div>';

    // 默认显示精简版
    var html = '<div class="compact-view">' + compactHtml + '</div>';
    html += '<div class="detail-view" style="display: none;">' + detailHtml + '</div>';

    container.innerHTML = html;
    document.body.appendChild(container);

    // 添加点击切换功能
    container.addEventListener('click', function(e) {
        e.stopPropagation();
        var compactView = container.querySelector('.compact-view');
        var detailView = container.querySelector('.detail-view');

        if (compactView.style.display === 'none') {
            // 当前是详细视图，切换到精简视图
            compactView.style.display = 'block';
            detailView.style.display = 'none';
            container.style.maxWidth = '200px';
        } else {
            // 当前是精简视图，切换到详细视图
            compactView.style.display = 'none';
            detailView.style.display = 'block';
            container.style.maxWidth = '280px';
        }
    });
}

// 获取危险度颜色
function getDangerColor(score) {
    if (score >= 9) return '#ff1744';
    if (score >= 7) return '#ff9800';
    if (score >= 5) return '#ffc107';
    if (score >= 3) return '#8bc34a';
    return '#4caf50';
}

// 获取优先级颜色
function getPriorityColor(priority) {
    if (priority >= 8) return '#ff1744';
    if (priority >= 6) return '#ff9800';
    if (priority >= 4) return '#ffc107';
    if (priority >= 2) return '#8bc34a';
    return '#4caf50';
}

// 获取优先级标签
function getPriorityLabel(priority) {
    if (priority >= 8) return '高优先级';
    if (priority >= 5) return '中优先级';
    return '低优先级';
}
