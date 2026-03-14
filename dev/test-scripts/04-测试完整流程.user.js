// ==UserScript==
// @name         雀魂-测试04-完整流程测试
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  测试完整流程：检测玩家 → 获取数据 → 输出结果
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      5-data.amae-koromo.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('[测试04] 脚本已加载');

    var gameWindow = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    function getPlayerData(accountId) {
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
                        resolve(JSON.parse(response.responseText));
                    } else {
                        reject('HTTP ' + response.status);
                    }
                },
                onerror: function() {
                    reject('网络错误');
                },
                ontimeout: function() {
                    reject('请求超时');
                }
            });
        });
    }

    setTimeout(function() {
        console.log('[测试04] 开始完整流程测试...');

        setInterval(function() {
            try {
                if (!gameWindow.view || !gameWindow.view.DesktopMgr || !gameWindow.view.DesktopMgr.Inst) {
                    return;
                }

                var playerDatas = gameWindow.view.DesktopMgr.Inst.player_datas;
                var myId = gameWindow.GameMgr.Inst.account_id;

                if (!playerDatas || playerDatas.length === 0) {
                    return;
                }

                console.log('========================================');
                console.log('[测试04] ✅ 检测到对局！');
                console.log('========================================');
                console.log('玩家数量:', playerDatas.length);
                console.log('我的ID:', myId);
                console.log('');

                // 只测试第一个真人玩家
                for (var i = 0; i < playerDatas.length; i++) {
                    var p = playerDatas[i];
                    if (p.account_id > 10) {
                        console.log('正在获取玩家数据:', p.nickname, '(ID:' + p.account_id + ')');

                        getPlayerData(p.account_id)
                            .then(function(data) {
                                console.log('');
                                console.log('✅ 数据获取成功！');
                                console.log('对局数:', data.count);
                                console.log('立直率:', (data['立直率'] * 100).toFixed(2) + '%');
                                console.log('副露率:', (data['副露率'] * 100).toFixed(2) + '%');
                                console.log('和牌率:', (data['和牌率'] * 100).toFixed(2) + '%');
                                console.log('放铳率:', (data['放铳率'] * 100).toFixed(2) + '%');
                                console.log('');
                                console.log('[测试04] 完整流程测试成功！');
                                console.log('========================================');
                            })
                            .catch(function(e) {
                                console.log('❌ 数据获取失败:', e);
                            });

                        break;
                    }
                }

                // 测试成功后停止
                clearInterval(this);
            } catch(e) {
                console.log('[测试04] 错误:', e.message);
            }
        }, 2000);
    }, 3000);
})();
