// ==UserScript==
// @name         雀魂数据分析面板 MVP v2
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  无外部依赖版本 - 纯 Canvas 绘图
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      5-data.amae-koromo.com
// ==/UserScript==

(function() {
    'use strict';

    var gameWindow = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    // ==================== 常量 ====================

    var DEFAULT_BASELINE = {
        name: '杰3',
        立直率: 19.58,
        副露率: 33.74,
        和牌率: 22.25,
        放铳率: 15.08,
        平均打点: 6651
    };

    var PLAYER_COLORS = [
        '#ff6384',
        '#36a2eb',
        '#4bc0c0',
        '#ffce56'
    ];

    // ==================== 全局状态 ====================

    var state = {
        isOpen: false,
        compareList: []
    };

    // ==================== API ====================

    function getPlayerStats(accountId) {
        return new Promise(function(resolve, reject) {
            var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_stats/' + accountId + '/1262304000000/' + Date.now() + '?mode=12.9&tag=492541';
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        resolve(JSON.parse(response.responseText));
                    } else {
                        reject('HTTP ' + response.status);
                    }
                },
                onerror: function() { reject('网络错误'); },
                ontimeout: function() { reject('请求超时'); }
            });
        });
    }

    function getPlayerExtendedStats(accountId) {
        return new Promise(function(resolve, reject) {
            var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_extended_stats/' + accountId + '/1262304000000/' + Date.now() + '?mode=12.9&tag=492541';
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        resolve(JSON.parse(response.responseText));
                    } else {
                        reject('HTTP ' + response.status);
                    }
                },
                onerror: function() { reject('网络错误'); },
                ontimeout: function() { reject('请求超时'); }
            });
        });
    }

    // ==================== UI ====================

    function createPanel() {
        var panel = document.createElement('div');
        panel.id = 'mvp-panel';
        panel.style.cssText =
            'position: fixed; top: 50px; right: 50px; width: 600px; height: 500px;' +
            'background: rgba(20, 20, 30, 0.95); border: 2px solid #ffd700;' +
            'border-radius: 8px; z-index: 9999; display: none; flex-direction: column;' +
            'color: #fff; font-family: Arial;';

        // 标题栏
        var header = document.createElement('div');
        header.style.cssText = 'padding: 10px; background: rgba(255, 215, 0, 0.1); border-bottom: 1px solid #ffd700; display: flex; justify-content: space-between;';
        header.innerHTML = '<span style="color: #ffd700; font-weight: bold;">数据分析面板 MVP v2</span>';

        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'background: none; border: 1px solid #ffd700; color: #ffd700; width: 24px; height: 24px; cursor: pointer; border-radius: 3px;';
        closeBtn.onclick = togglePanel;
        header.appendChild(closeBtn);

        // 搜索区
        var searchArea = document.createElement('div');
        searchArea.style.cssText = 'padding: 10px; border-bottom: 1px solid rgba(255, 215, 0, 0.3); display: flex; gap: 10px;';

        var searchInput = document.createElement('input');
        searchInput.id = 'mvp-search-input';
        searchInput.placeholder = '输入玩家ID';
        searchInput.style.cssText = 'flex: 1; padding: 5px; background: rgba(255, 255, 255, 0.1); border: 1px solid #ffd700; border-radius: 4px; color: #fff;';
        searchInput.onkeydown = function(e) {
            if (e.key === 'Enter') searchPlayer();
        };

        var searchBtn = document.createElement('button');
        searchBtn.textContent = '搜索';
        searchBtn.style.cssText = 'padding: 5px 15px; background: #ffd700; border: none; border-radius: 4px; color: #000; font-weight: bold; cursor: pointer;';
        searchBtn.onclick = searchPlayer;

        searchArea.appendChild(searchInput);
        searchArea.appendChild(searchBtn);

        // 对比列表
        var listArea = document.createElement('div');
        listArea.id = 'mvp-list';
        listArea.style.cssText = 'padding: 10px; border-bottom: 1px solid rgba(255, 215, 0, 0.3); max-height: 100px; overflow-y: auto;';
        listArea.innerHTML = '<div style="color: #888; font-size: 12px;">暂无玩家（最多4个）</div>';

        // 图表区
        var chartArea = document.createElement('div');
        chartArea.style.cssText = 'flex: 1; padding: 10px; display: flex; align-items: center; justify-content: center;';

        var canvas = document.createElement('canvas');
        canvas.id = 'mvp-chart';
        canvas.width = 500;
        canvas.height = 350;
        chartArea.appendChild(canvas);

        panel.appendChild(header);
        panel.appendChild(searchArea);
        panel.appendChild(listArea);
        panel.appendChild(chartArea);

        document.body.appendChild(panel);
        return panel;
    }

    function createFloatingButton() {
        var btn = document.createElement('button');
        btn.textContent = '📊';
        btn.style.cssText =
            'position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px;' +
            'background: #ffd700; border: 2px solid #ffd700; border-radius: 50%;' +
            'font-size: 24px; cursor: pointer; z-index: 9998; box-shadow: 0 2px 10px rgba(0,0,0,0.3);';
        btn.onclick = togglePanel;
        document.body.appendChild(btn);
    }

    function togglePanel() {
        var panel = document.getElementById('mvp-panel');
        if (state.isOpen) {
            panel.style.display = 'none';
            state.isOpen = false;
        } else {
            panel.style.display = 'flex';
            state.isOpen = true;
        }
    }

    // ==================== 搜索 ====================

    function searchPlayer() {
        var input = document.getElementById('mvp-search-input');
        var playerId = input.value.trim();

        if (!playerId || !/^\d+$/.test(playerId)) {
            alert('请输入有效的玩家ID（纯数字）');
            return;
        }

        console.log('[MVP] 搜索玩家:', playerId);

        getPlayerStats(playerId)
            .then(function(basicStats) {
                return getPlayerExtendedStats(playerId)
                    .then(function(extStats) {
                        if (extStats.count < 50) {
                            alert('玩家数据不足（少于50局）');
                            return;
                        }

                        addPlayer({
                            account_id: basicStats.account_id,
                            nickname: basicStats.nickname,
                            extendedStats: extStats
                        });

                        input.value = '';
                    });
            })
            .catch(function(error) {
                alert('搜索失败: ' + error);
            });
    }

    function addPlayer(player) {
        if (state.compareList.length >= 4) {
            alert('最多只能对比4个玩家');
            return;
        }

        var exists = state.compareList.some(function(p) {
            return p.account_id === player.account_id;
        });

        if (exists) {
            alert('该玩家已在列表中');
            return;
        }

        state.compareList.push(player);
        updateList();
        drawRadarChart();

        console.log('[MVP] 添加玩家:', player.nickname);
    }

    function removePlayer(accountId) {
        state.compareList = state.compareList.filter(function(p) {
            return p.account_id !== accountId;
        });
        updateList();
        drawRadarChart();
    }

    function updateList() {
        var listArea = document.getElementById('mvp-list');
        listArea.innerHTML = '';

        if (state.compareList.length === 0) {
            listArea.innerHTML = '<div style="color: #888; font-size: 12px;">暂无玩家（最多4个）</div>';
            return;
        }

        state.compareList.forEach(function(player, index) {
            var item = document.createElement('div');
            item.style.cssText = 'padding: 5px; margin-bottom: 5px; background: rgba(255, 215, 0, 0.05); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;';

            var info = document.createElement('div');
            info.style.cssText = 'display: flex; align-items: center; gap: 8px;';

            var colorDot = document.createElement('div');
            colorDot.style.cssText = 'width: 10px; height: 10px; border-radius: 50%; background: ' + PLAYER_COLORS[index] + ';';

            var name = document.createElement('span');
            name.textContent = player.nickname;
            name.style.cssText = 'color: ' + PLAYER_COLORS[index] + '; font-size: 13px;';

            info.appendChild(colorDot);
            info.appendChild(name);

            var removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.style.cssText = 'background: rgba(255, 107, 107, 0.2); border: 1px solid #ff6b6b; border-radius: 3px; color: #ff6b6b; cursor: pointer; padding: 2px 6px; font-size: 14px;';
            removeBtn.onclick = function() { removePlayer(player.account_id); };

            item.appendChild(info);
            item.appendChild(removeBtn);
            listArea.appendChild(item);
        });
    }

    // ==================== 纯 Canvas 雷达图 ====================

    function normalizeData(stats) {
        var baseline = DEFAULT_BASELINE;
        return {
            立直率: (stats.立直率 / baseline.立直率) * 50,
            副露率: (stats.副露率 / baseline.副露率) * 50,
            和牌率: (stats.和牌率 / baseline.和牌率) * 50,
            防守力: (1 - stats.放铳率 / baseline.放铳率) * 50 + 50,
            平均打点: (stats.平均打点 / baseline.平均打点) * 50,
            进攻意愿: ((stats.立直率 + stats.副露率) / (baseline.立直率 + baseline.副露率)) * 50
        };
    }

    function drawRadarChart() {
        var canvas = document.getElementById('mvp-chart');
        var ctx = canvas.getContext('2d');

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (state.compareList.length === 0) {
            ctx.fillStyle = '#888';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('请搜索并添加玩家', canvas.width / 2, canvas.height / 2);
            return;
        }

        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        var radius = 120;
        var labels = ['立直率', '副露率', '和牌率', '防守力', '平均打点', '进攻意愿'];
        var angleStep = (Math.PI * 2) / 6;

        // 绘制背景网格
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 1;
        for (var i = 1; i <= 5; i++) {
            var r = radius * (i / 5);
            ctx.beginPath();
            for (var j = 0; j < 6; j++) {
                var angle = angleStep * j - Math.PI / 2;
                var x = centerX + Math.cos(angle) * r;
                var y = centerY + Math.sin(angle) * r;
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }

        // 绘制轴线和标签
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillStyle = '#ffd700';
        ctx.font = '12px Arial';
        for (var i = 0; i < 6; i++) {
            var angle = angleStep * i - Math.PI / 2;
            var x = centerX + Math.cos(angle) * radius;
            var y = centerY + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();

            // 标签
            var labelX = centerX + Math.cos(angle) * (radius + 20);
            var labelY = centerY + Math.sin(angle) * (radius + 20);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[i], labelX, labelY);
        }

        // 绘制基准线（50分）
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
            var angle = angleStep * i - Math.PI / 2;
            var r = radius * 0.5; // 50分 = 50%
            var x = centerX + Math.cos(angle) * r;
            var y = centerY + Math.sin(angle) * r;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // 绘制玩家数据
        state.compareList.forEach(function(player, index) {
            var normalized = normalizeData(player.extendedStats);
            var values = [
                normalized.立直率,
                normalized.副露率,
                normalized.和牌率,
                normalized.防守力,
                normalized.平均打点,
                normalized.进攻意愿
            ];

            var color = PLAYER_COLORS[index];

            // 填充区域
            ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
            ctx.beginPath();
            for (var i = 0; i < 6; i++) {
                var angle = angleStep * i - Math.PI / 2;
                var value = Math.max(0, Math.min(100, values[i])); // 限制在0-100
                var r = radius * (value / 100);
                var x = centerX + Math.cos(angle) * r;
                var y = centerY + Math.sin(angle) * r;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();

            // 边框线
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // 数据点
            ctx.fillStyle = color;
            for (var i = 0; i < 6; i++) {
                var angle = angleStep * i - Math.PI / 2;
                var value = Math.max(0, Math.min(100, values[i]));
                var r = radius * (value / 100);
                var x = centerX + Math.cos(angle) * r;
                var y = centerY + Math.sin(angle) * r;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 绘制图例
        var legendY = 20;
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';

        // 基准线图例
        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.fillText('段位平均', 10, legendY);
        legendY += 20;

        // 玩家图例
        state.compareList.forEach(function(player, index) {
            ctx.fillStyle = PLAYER_COLORS[index];
            ctx.fillText(player.nickname, 10, legendY);
            legendY += 20;
        });

        console.log('[MVP] 图表绘制完成');
    }

    // ==================== 初始化 ====================

    console.log('[MVP v2] 初始化中...');
    createPanel();
    createFloatingButton();
    console.log('[MVP v2] 初始化完成，点击右下角按钮打开面板');

})();
