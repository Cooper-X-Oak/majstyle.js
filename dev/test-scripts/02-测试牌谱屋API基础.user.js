// ==UserScript==
// @name         雀魂-测试02-牌谱屋API基础测试
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  测试牌谱屋API是否可用（player_stats）
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        GM_xmlhttpRequest
// @connect      5-data.amae-koromo.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('[测试02] 脚本已加载');

    function testPlayerStats() {
        // 使用一个已知的玩家ID进行测试
        var accountId = 14766635;
        var endTime = Date.now();
        var startTime = 1262304000000;
        var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

        console.log('[测试02] 测试URL:', url);

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 10000,
            onload: function(response) {
                console.log('[测试02] 状态码:', response.status);

                if (response.status === 200) {
                    var data = JSON.parse(response.responseText);
                    console.log('========================================');
                    console.log('[测试02] ✅ API 测试成功！');
                    console.log('========================================');
                    console.log('玩家ID:', data.account_id);
                    console.log('昵称:', data.nickname);
                    console.log('段位:', data.level);
                    console.log('');
                    console.log('完整数据:');
                    console.log(JSON.stringify(data, null, 2));
                    console.log('========================================');
                } else {
                    console.log('[测试02] ❌ 失败:', response.status);
                }
            },
            onerror: function(error) {
                console.log('[测试02] ❌ 网络错误:', error);
            },
            ontimeout: function() {
                console.log('[测试02] ❌ 请求超时');
            }
        });
    }

    // 5秒后执行测试
    setTimeout(function() {
        testPlayerStats();
    }, 5000);
})();
