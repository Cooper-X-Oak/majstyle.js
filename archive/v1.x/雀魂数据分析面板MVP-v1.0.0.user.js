// ==UserScript==
// @name         雀魂数据分析面板 MVP
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  最小可行版本 - 核心功能测试
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      5-data.amae-koromo.com
// @connect      cdn.jsdelivr.net
// @require      https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js
// ==/UserScript==

(function() {
    'use strict';

    var gameWindow = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    // ==================== 常量 ====================

    var LEVEL_BASELINE = {
        10403: { name: '杰3', 立直率: 19.58, 副露率: 33.74, 和牌率: 22.25, 放铳率: 15.08, 平均打点: 6651 }
    };

    var DEFAULT_BASELINE = LEVEL_BASELINE[10403];

    var PLAYER_COLORS = [
        { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.2)' },
        { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.2)' },
        { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.2)' },
        { border: 'rgb(255, 206, 86)', bg: 'rgba(255, 206, 86, 0.2)' }
    ];

    // ==================== 全局状态 ====================

    var state = {
        isOpen: false,
        compareList: [],
        radarChart: null
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
        header.innerHTML = '<span style="color: #ffd700; font-weight: bold;">数据分析面板 MVP</span>';

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
        listArea.innerHTML = '<div style="color: #888;">暂无玩家</div>';

        // 图表区
        var chartArea = document.createElement('div');
        chartArea.style.cssText = 'flex: 1; padding: 10px; display: flex; align-items: center; justify-content: center;';

        var canvas = document.createElement('canvas');
        canvas.id = 'mvp-chart';
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
            'font-size: 24px; cursor: pointer; z-index: 9998;';
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
        updateChart();

        console.log('[MVP] 添加玩家:', player.nickname);
    }

    function removePlayer(accountId) {
        state.compareList = state.compareList.filter(function(p) {
            return p.account_id !== accountId;
        });
        updateList();
        updateChart();
    }

    function updateList() {
        var listArea = document.getElementById('mvp-list');
        listArea.innerHTML = '';

        if (state.compareList.length === 0) {
            listArea.innerHTML = '<div style="color: #888;">暂无玩家</div>';
            return;
        }

        state.compareList.forEach(function(player, index) {
            var item = document.createElement('div');
            item.style.cssText = 'padding: 5px; margin-bottom: 5px; background: rgba(255, 215, 0, 0.05); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;';

            var name = document.createElement('span');
            name.textContent = player.nickname;
            name.style.color = PLAYER_COLORS[index].border;

            var removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.style.cssText = 'background: rgba(255, 107, 107, 0.2); border: 1px solid #ff6b6b; border-radius: 3px; color: #ff6b6b; cursor: pointer; padding: 2px 6px;';
            removeBtn.onclick = function() { removePlayer(player.account_id); };

            item.appendChild(name);
            item.appendChild(removeBtn);
            listArea.appendChild(item);
        });
    }

    // ==================== 图表 ====================

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

    function updateChart() {
        var canvas = document.getElementById('mvp-chart');
        var ctx = canvas.getContext('2d');

        if (state.radarChart) {
            state.radarChart.destroy();
        }

        if (state.compareList.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#888';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('请搜索并添加玩家', canvas.width / 2, canvas.height / 2);
            return;
        }

        var datasets = [{
            label: '段位平均',
            data: [50, 50, 50, 50, 50, 50],
            borderColor: 'rgb(200, 200, 200)',
            backgroundColor: 'rgba(200, 200, 200, 0.1)',
            borderDash: [5, 5],
            borderWidth: 2
        }];

        state.compareList.forEach(function(player, index) {
            var normalized = normalizeData(player.extendedStats);
            var color = PLAYER_COLORS[index];

            datasets.push({
                label: player.nickname,
                data: [
                    normalized.立直率,
                    normalized.副露率,
                    normalized.和牌率,
                    normalized.防守力,
                    normalized.平均打点,
                    normalized.进攻意愿
                ],
                borderColor: color.border,
                backgroundColor: color.bg,
                borderWidth: 2
            });
        });

        state.radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['立直率', '副露率', '和牌率', '防守力', '平均打点', '进攻意愿'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        ticks: { stepSize: 20, color: '#888' },
                        grid: { color: 'rgba(255, 215, 0, 0.2)' },
                        pointLabels: { color: '#ffd700', font: { size: 12 } }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#fff', padding: 10, font: { size: 12 } }
                    }
                },
                animation: false
            }
        });

        console.log('[MVP] 图表更新完成');
    }

    // ==================== 初始化 ====================

    function init() {
        if (typeof Chart === 'undefined') {
            console.error('[MVP] Chart.js 未加载');
            alert('图表库加载失败，请刷新页面重试');
            return;
        }

        console.log('[MVP] 初始化中...');
        createPanel();
        createFloatingButton();
        console.log('[MVP] 初始化完成，点击右下角按钮打开面板');
    }

    // 等待 Chart.js 加载
    var checkInterval = setInterval(function() {
        if (typeof Chart !== 'undefined') {
            clearInterval(checkInterval);
            init();
        }
    }, 100);

    setTimeout(function() {
        clearInterval(checkInterval);
        if (typeof Chart === 'undefined') {
            console.error('[MVP] Chart.js 加载超时');
        }
    }, 10000);

})();
