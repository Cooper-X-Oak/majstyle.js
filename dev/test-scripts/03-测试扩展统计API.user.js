// ==UserScript==
// @name         雀魂-测试03-牌谱屋扩展统计API
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  测试牌谱屋扩展统计API（player_extended_stats）
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        GM_xmlhttpRequest
// @connect      5-data.amae-koromo.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('[测试03] 脚本已加载');

    function testExtendedStats() {
        var accountId = 14766635;
        var endTime = Date.now();
        var startTime = 1262304000000;
        var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_extended_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

        console.log('[测试03] 测试URL:', url);

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 10000,
            onload: function(response) {
                console.log('[测试03] 状态码:', response.status);

                if (response.status === 200) {
                    var data = JSON.parse(response.responseText);
                    console.log('========================================');
                    console.log('[测试03] ✅ 扩展统计API测试成功！');
                    console.log('========================================');
                    console.log('对局数:', data.count);
                    console.log('');
                    console.log('【核心数据】');
                    console.log('立直率:', (data['立直率'] * 100).toFixed(2) + '%');
                    console.log('副露率:', (data['副露率'] * 100).toFixed(2) + '%');
                    console.log('和牌率:', (data['和牌率'] * 100).toFixed(2) + '%');
                    console.log('放铳率:', (data['放铳率'] * 100).toFixed(2) + '%');
                    console.log('平均打点:', data['平均打点']);
                    console.log('');
                    console.log('【扩展数据】');
                    console.log('追立率:', (data['追立率'] * 100).toFixed(2) + '%');
                    console.log('先制率:', (data['先制率'] * 100).toFixed(2) + '%');
                    console.log('立直好型:', (data['立直好型'] * 100).toFixed(2) + '%');
                    console.log('自摸率:', (data['自摸率'] * 100).toFixed(2) + '%');
                    console.log('默听率:', (data['默听率'] * 100).toFixed(2) + '%');
                    console.log('');
                    console.log('【可用字段总数】:', Object.keys(data).length);
                    console.log('');
                    console.log('完整数据:');
                    console.log(JSON.stringify(data, null, 2));
                    console.log('========================================');
                } else {
                    console.log('[测试03] ❌ 失败:', response.status);
                }
            },
            onerror: function(error) {
                console.log('[测试03] ❌ 网络错误:', error);
            },
            ontimeout: function() {
                console.log('[测试03] ❌ 请求超时');
            }
        });
    }

    setTimeout(function() {
        testExtendedStats();
    }, 5000);
})();
