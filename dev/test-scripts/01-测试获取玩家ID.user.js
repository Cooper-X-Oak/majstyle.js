// ==UserScript==
// @name         雀魂-测试01-获取玩家ID
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  测试能否获取游戏中的玩家ID
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    console.log('[测试01] 脚本已加载');

    // 等待游戏加载
    setTimeout(function() {
        console.log('[测试01] 开始检测游戏对象...');

        setInterval(function() {
            try {
                var gameWindow = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

                // 尝试访问游戏对象
                if (gameWindow.view && gameWindow.view.DesktopMgr && gameWindow.view.DesktopMgr.Inst) {
                    var playerDatas = gameWindow.view.DesktopMgr.Inst.player_datas;
                    var myId = gameWindow.GameMgr.Inst.account_id;

                    if (playerDatas && playerDatas.length > 0) {
                        console.log('========================================');
                        console.log('[测试01] ✅ 成功获取玩家数据！');
                        console.log('========================================');
                        console.log('我的ID:', myId);
                        console.log('玩家数量:', playerDatas.length);
                        console.log('');

                        for (var i = 0; i < playerDatas.length; i++) {
                            var p = playerDatas[i];
                            var isSelf = p.account_id === myId;
                            console.log('座位' + i + ':', {
                                nickname: p.nickname,
                                account_id: p.account_id,
                                isSelf: isSelf
                            });
                        }

                        console.log('');
                        console.log('[测试01] 测试成功！可以获取玩家ID');
                        console.log('========================================');

                        // 测试成功后停止检测
                        clearInterval(this);
                    }
                }
            } catch(e) {
                console.log('[测试01] 错误:', e.message);
            }
        }, 2000);
    }, 3000);
})();
