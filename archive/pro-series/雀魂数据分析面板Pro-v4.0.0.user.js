// ==UserScript==
// @name         雀魂数据分析面板 Pro
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  金之间/玉之间四人麻将数据分析工具 - 带交互式可视化面板
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

    // ==================== 常量定义 ====================

    var LEVEL_BASELINE = {
        10301: { name: '士3', 立直率: 19.66, 副露率: 35.83, 和牌率: 21.08, 放铳率: 17.55, 平均打点: 6688 },
        10401: { name: '杰1', 立直率: 19.81, 副露率: 35.44, 和牌率: 21.55, 放铳率: 16.81, 平均打点: 6639 },
        10402: { name: '杰2', 立直率: 19.90, 副露率: 34.80, 和牌率: 22.22, 放铳率: 15.92, 平均打点: 6663 },
        10403: { name: '杰3', 立直率: 19.58, 副露率: 33.74, 和牌率: 22.25, 放铳率: 15.08, 平均打点: 6651 },
        10501: { name: '豪1', 立直率: 19.35, 副露率: 32.51, 和牌率: 22.20, 放铳率: 14.12, 平均打点: 6634 },
        10502: { name: '豪2', 立直率: 19.02, 副露率: 32.06, 和牌率: 22.04, 放铳率: 13.49, 平均打点: 6597 },
        10503: { name: '豪3', 立直率: 18.77, 副露率: 32.03, 和牌率: 22.14, 放铳率: 12.93, 平均打点: 6571 },
        10601: { name: '圣1', 立直率: 18.54, 副露率: 32.04, 和牌率: 22.14, 放铳率: 12.45, 平均打点: 6538 },
        10602: { name: '圣2', 立直率: 18.47, 副露率: 32.03, 和牌率: 22.12, 放铳率: 12.14, 平均打点: 6520 },
        10603: { name: '圣3', 立直率: 18.38, 副露率: 32.36, 和牌率: 22.37, 放铳率: 11.73, 平均打点: 6485 },
        10701: { name: '魂1', 立直率: 18.25, 副露率: 32.68, 和牌率: 22.56, 放铳率: 11.41, 平均打点: 6472 }
    };

    var DEFAULT_BASELINE = LEVEL_BASELINE[10403];

    var PLAYER_COLORS = [
        { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.2)' },
        { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.2)' },
        { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.2)' },
        { border: 'rgb(255, 206, 86)', bg: 'rgba(255, 206, 86, 0.2)' }
    ];

    // ==================== 全局状态 ====================

    var DashboardState = {
        isOpen: false,
        compareList: [],
        dataCache: {},
        chart: null,
        currentChartType: 'radar'
    };

    // ==================== 工具函数 ====================

    function getBaseline(levelId) {
        return LEVEL_BASELINE[levelId] || DEFAULT_BASELINE;
    }

    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    // ==================== API 请求 ====================

    function getPlayerStats(accountId) {
        return new Promise(function(resolve, reject) {
            var endTime = Date.now();
            var startTime = 1262304000000;
            var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch(e) {
                            reject('JSON解析失败');
                        }
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
            var endTime = Date.now();
            var startTime = 1262304000000;
            var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_extended_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch(e) {
                            reject('JSON解析失败');
                        }
                    } else {
                        reject('HTTP ' + response.status);
                    }
                },
                onerror: function() { reject('网络错误'); },
                ontimeout: function() { reject('请求超时'); }
            });
        });
    }
