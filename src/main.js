import { getPlayerDatas, getMyAccountId, exploreGameObject } from './game/game-bridge.js';
import { processPlayer } from './game/player-processor.js';
import { clearAllPlayerInfoUI, resetPlayerUICounter } from './ui/ui-manager.js';
import { getPlayerExtendedStats } from './api/amae-koromo.js';

(function() {
    'use strict';

    var lastCheck = null;
    var intervalId = null;
    var isProcessing = false;
    var processingCache = new Map();

    // 清理定时器
    function cleanup() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        processingCache.clear();
    }

    // 监听页面卸载事件
    window.addEventListener('beforeunload', cleanup);

    // 数据探索模式 - Ctrl+Alt+E (Explore)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.altKey && e.key === 'e') {
            e.preventDefault(); // 阻止默认行为
            console.log('');
            console.log('========================================');
            console.log('      数据探索模式已触发');
            console.log('      快捷键: Ctrl+Alt+E');
            console.log('========================================');
            console.log('');

            // 探索游戏对象结构
            exploreGameObject();

            // 探索当前玩家的 API 数据
            var playerDatas = getPlayerDatas();
            if (playerDatas && playerDatas.length > 0) {
                var firstPlayer = playerDatas[0];
                console.log('');
                console.log('=== 探索玩家 API 数据 ===');
                console.log('账号ID:', firstPlayer.account_id);
                console.log('正在请求 player_extended_stats...');
                console.log('');

                getPlayerExtendedStats(firstPlayer.account_id)
                    .then(function(data) {
                        console.log('【player_extended_stats 完整响应】');
                        console.log(JSON.stringify(data, null, 2));
                        console.log('');

                        console.log('【字段清单】');
                        Object.keys(data).forEach(function(key) {
                            var value = data[key];
                            var type = typeof value;
                            if (value === null) {
                                type = 'null';
                            } else if (Array.isArray(value)) {
                                type = 'array[' + value.length + ']';
                            }
                            console.log('  ' + key + ': ' + type);
                        });
                        console.log('');
                        console.log('请将以上结果记录到 docs/API_DATA_STRUCTURE.md');
                    })
                    .catch(function(error) {
                        console.error('API 请求失败:', error);
                    });
            } else {
                console.log('⚠️ 当前没有玩家数据，无法探索 API');
            }

            console.log('');
            console.log('========================================');
            console.log('提示: 使用 tools/api-explorer.html 可以更方便地探索 API');
            console.log('快捷键: Ctrl+Alt+E');
            console.log('========================================');
        }
    });

    setTimeout(function() {
        intervalId = setInterval(function() {
            try {
                // 防止重复处理
                if (isProcessing) {
                    return;
                }

                var playerDatas = getPlayerDatas();
                var myId = getMyAccountId();

                if (!playerDatas || playerDatas.length === 0) {
                    clearAllPlayerInfoUI();
                    return;
                }

                var currentIds = playerDatas.map(function(p) {
                    return p.account_id;
                }).sort().join(',');

                if (currentIds !== lastCheck) {
                    lastCheck = currentIds;
                    isProcessing = true;
                    resetPlayerUICounter();

                    console.log('========================================');
                    console.log('         雀魂对手风格分析');
                    console.log('========================================');

                    var promises = [];
                    for (var i = 0; i < playerDatas.length; i++) {
                        var playerId = playerDatas[i].account_id;

                        // 检查是否已有进行中的请求
                        if (processingCache.has(playerId)) {
                            promises.push(processingCache.get(playerId));
                        } else {
                            var promise = processPlayer(playerDatas[i], myId, i);
                            processingCache.set(playerId, promise);

                            // 请求完成后清理缓存
                            promise.finally(function() {
                                processingCache.delete(playerId);
                            });

                            promises.push(promise);
                        }
                    }

                    Promise.all(promises)
                        .then(function() {
                            console.log('');
                            console.log('========================================');
                        })
                        .catch(function(error) {
                            console.error('[Promise.all 失败]', error);
                        })
                        .finally(function() {
                            isProcessing = false;
                        });
                }
            } catch(e) {
                console.log('[错误] ' + e.message);
                console.log(e.stack);
                isProcessing = false;
            }
        }, 1000);
    }, 2000);
})();
