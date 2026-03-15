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
    container.style.cssText = 'position: fixed; background: rgba(0,0,0,0.85); color: #fff; padding: 10px 14px; border-radius: 10px; font-size: 11px; z-index: 10000; box-shadow: 0 0 15px rgba(0,0,0,0.7); pointer-events: auto; width: 320px; max-height: 80vh; overflow-y: auto;';

    // 根据是否是自己来决定位置
    var positions;
    if (isSelf) {
        // 自己固定在左下角
        positions = ['bottom: 120px; left: 20px;'];
        container.style.cssText += positions[0];
    } else {
        // 其他玩家按顺序分配到其他三个位置
        var otherPositions = [
            'top: 120px; right: 20px;',     // 右上角
            'top: 20px; left: 75%; transform: translateX(-50%);',  // 顶部右侧3/4位置
            'top: 120px; left: 20px;'       // 左上角
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

    var 标签文本 = 标签.length > 0 ? '<br><span style="color: #ffa500; font-size: 9px;">' + 标签.slice(0, 3).map(escapeHtml).join(' | ') + '</span>' : '';
    var 玩家名 = '<span style="color: #aaa; font-size: 9px; margin-left: 5px;">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</span>';

    var html = '<div style="font-weight: bold; font-size: 13px; color: #ffd700; margin-bottom: 6px;">【' + escapeHtml(titleText) + '】' + 玩家名 + 标签文本 + '</div>';

    // 危险度评分（如果有）
    if (advice && advice.危险度) {
        var dangerLevel = advice.危险度;
        html += '<div style="background: rgba(255,0,0,0.15); padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid ' + getDangerColor(dangerLevel.分数) + ';">';
        html += '<div style="font-size: 11px; font-weight: bold; color: ' + getDangerColor(dangerLevel.分数) + ';">' + dangerLevel.图标 + ' 危险度: ' + dangerLevel.分数 + '/10 - ' + escapeHtml(dangerLevel.标签) + '</div>';
        html += '<div style="font-size: 9px; color: #bbb; margin-top: 2px;">置信度: ' + escapeHtml(dangerLevel.置信度) + '</div>';
        html += '</div>';
    }

    // 基础数据
    html += '<div style="line-height: 1.6; font-size: 10px; margin-bottom: 8px;">';

    var 立直偏差 = (数据.立直率 - baseline.立直率).toFixed(1);
    var 副露偏差 = (数据.副露率 - baseline.副露率).toFixed(1);
    var 和牌偏差 = (数据.和牌率 - baseline.和牌率).toFixed(1);
    var 放铳偏差 = 偏差.放铳率.toFixed(1);
    var 打点偏差 = 偏差.打点.toFixed(0);

    html += '<div>立直: <span style="color: ' + getColor(parseFloat(立直偏差), 2) + '">' + 数据.立直率.toFixed(1) + '% (' + (立直偏差 > 0 ? '+' : '') + 立直偏差 + '%)</span></div>';
    html += '<div>副露: <span style="color: ' + getColor(parseFloat(副露偏差), 3) + '">' + 数据.副露率.toFixed(1) + '% (' + (副露偏差 > 0 ? '+' : '') + 副露偏差 + '%)</span></div>';
    html += '<div>和牌: <span style="color: ' + getColor(parseFloat(和牌偏差), 1.5) + '">' + 数据.和牌率.toFixed(1) + '% (' + (和牌偏差 > 0 ? '+' : '') + 和牌偏差 + '%)</span></div>';
    html += '<div>放铳: <span style="color: ' + getColor(parseFloat(放铳偏差), 1.5) + '">' + 数据.放铳率.toFixed(1) + '% (' + (放铳偏差 > 0 ? '+' : '') + 放铳偏差 + '%)</span></div>';
    html += '<div>打点: <span style="color: ' + getColor(parseFloat(打点偏差), 300) + '">' + 数据.平均打点 + ' (' + (打点偏差 > 0 ? '+' : '') + 打点偏差 + ')</span></div>';
    html += '</div>';

    // 策略建议（增强版 - 包含解释）
    if (advice && advice.策略建议 && advice.策略建议.length > 0) {
        html += '<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px;">';
        html += '<div style="font-weight: bold; font-size: 11px; color: #4fc3f7; margin-bottom: 6px;">策略建议:</div>';

        for (var i = 0; i < Math.min(advice.策略建议.length, 5); i++) {
            var strategy = advice.策略建议[i];

            // 如果是旧格式（字符串），直接显示
            if (typeof strategy === 'string') {
                html += '<div style="margin-bottom: 6px; padding: 6px 8px; background: rgba(79,195,247,0.1); border-radius: 6px; font-size: 10px;">';
                html += '<div style="color: #fff;">• ' + escapeHtml(strategy) + '</div>';
                html += '</div>';
                continue;
            }

            // 新格式（结构化建议）
            var priorityColor = getPriorityColor(strategy.优先级);
            var priorityLabel = getPriorityLabel(strategy.优先级);

            html += '<div style="margin-bottom: 8px; padding: 8px 10px; background: rgba(79,195,247,0.1); border-radius: 6px; border-left: 3px solid ' + priorityColor + ';">';

            // 建议标题
            html += '<div style="font-size: 10px; color: #fff; font-weight: bold; margin-bottom: 4px;">';
            html += '<span style="color: ' + priorityColor + ';">[' + priorityLabel + ']</span> ' + escapeHtml(strategy.建议);
            html += '</div>';

            // 置信度和来源
            html += '<div style="font-size: 8px; color: #999; margin-bottom: 4px;">';
            html += '置信度: ' + escapeHtml(strategy.置信度) + ' | 来源: ' + escapeHtml(strategy.来源);
            html += '</div>';

            // 详细理由（可折叠）
            if (strategy.理由) {
                var detailId = 'detail-' + index + '-' + i;
                html += '<div style="font-size: 9px; color: #bbb; margin-top: 4px; cursor: pointer;" onclick="toggleDetail(\'' + detailId + '\')">';
                html += '▶ 点击查看详细分析';
                html += '</div>';

                html += '<div id="' + detailId + '" style="display: none; font-size: 8px; color: #aaa; margin-top: 6px; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 4px; line-height: 1.5;">';

                if (strategy.理由.触发条件) {
                    html += '<div style="margin-bottom: 3px;"><span style="color: #4fc3f7;">触发条件:</span> ' + escapeHtml(strategy.理由.触发条件) + '</div>';
                }
                if (strategy.理由.数据支撑) {
                    html += '<div style="margin-bottom: 3px;"><span style="color: #4fc3f7;">数据支撑:</span> ' + escapeHtml(strategy.理由.数据支撑) + '</div>';
                }
                if (strategy.理由.推理逻辑) {
                    html += '<div style="margin-bottom: 3px;"><span style="color: #4fc3f7;">推理逻辑:</span> ' + escapeHtml(strategy.理由.推理逻辑) + '</div>';
                }
                if (strategy.理由.战术含义) {
                    html += '<div><span style="color: #4fc3f7;">战术含义:</span> ' + escapeHtml(strategy.理由.战术含义) + '</div>';
                }

                html += '</div>';
            }

            html += '</div>';
        }

        html += '</div>';
    }

    container.innerHTML = html;
    document.body.appendChild(container);

    // 添加折叠/展开功能
    if (!window.toggleDetail) {
        window.toggleDetail = function(id) {
            var element = document.getElementById(id);
            if (element) {
                if (element.style.display === 'none') {
                    element.style.display = 'block';
                    element.previousElementSibling.innerHTML = '▼ 点击隐藏详细分析';
                } else {
                    element.style.display = 'none';
                    element.previousElementSibling.innerHTML = '▶ 点击查看详细分析';
                }
            }
        };
    }
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
