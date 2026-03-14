import { getColor } from './color-utils.js';

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
        if (typeof window.playerUICounter === 'undefined') {
            window.playerUICounter = 0;
        }
        container.style.cssText += otherPositions[window.playerUICounter % 3];
        window.playerUICounter++;
    }

    var html = '<div style="color: #aaa; font-size: 10px;">' + nickname + (isSelf ? ' [你]' : '') + '</div>';
    html += '<div style="color: #666; font-size: 9px; margin-top: 2px;">无牌谱数据</div>';

    container.innerHTML = html;
    document.body.appendChild(container);
}

// 创建玩家风格信息UI
export function createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, nickname, isSelf) {
    var existingUI = document.getElementById('player-style-' + index);
    if (existingUI) {
        existingUI.remove();
    }

    var container = document.createElement('div');
    container.id = 'player-style-' + index;
    container.className = 'majsoul-style-info';
    container.style.cssText = 'position: fixed; background: rgba(0,0,0,0.6); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 11px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5); pointer-events: none; width: auto;';

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
        if (typeof window.playerUICounter === 'undefined') {
            window.playerUICounter = 0;
        }
        container.style.cssText += otherPositions[window.playerUICounter % 3];
        window.playerUICounter++;
    }

    var 标签文本 = 标签.length > 0 ? '<br><span style="color: #ffa500; font-size: 9px;">' + 标签.slice(0, 3).join(' | ') + '</span>' : '';
    var 玩家名 = '<span style="color: #aaa; font-size: 9px; margin-left: 5px;">' + nickname + (isSelf ? ' [你]' : '') + '</span>';

    var html = '<div style="font-weight: bold; font-size: 13px; color: #ffd700; margin-bottom: 4px;">【' + 主称号 + '】' + 玩家名 + 标签文本 + '</div>';
    html += '<div style="line-height: 1.5; font-size: 10px;">';

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

    container.innerHTML = html;
    document.body.appendChild(container);
}
