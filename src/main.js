import { getPlayerDatas, getMyAccountId, isInGame, exploreGameObject } from './game/game-bridge.js';
import { processPlayer } from './game/player-processor.js';
import { clearAllPlayerInfoUI, resetPlayerUICounter } from './ui/ui-manager.js';
import { getPlayerExtendedStats } from './api/amae-koromo.js';

(function() {
    'use strict';

    var lastCheck = null;
    var isProcessing = false;
    var processingCache = new Map();
    var throttleTimer = null;
    var observer = null;
    var fallbackInterval = null;

    // 清理资源
    function cleanup() {
        if (observer) { observer.disconnect(); observer = null; }
        if (throttleTimer) { clearTimeout(throttleTimer); throttleTimer = null; }
        if (fallbackInterval) { clearInterval(fallbackInterval); fallbackInterval = null; }
        processingCache.clear();
    }

    window.addEventListener('beforeunload', cleanup);

    // 数据探索模式 - Ctrl+Alt+E
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.altKey && e.key === 'e') {
            e.preventDefault();
            console.log('');
            console.log('========================================');
            console.log('      数据探索模式已触发');
            console.log('      快捷键: Ctrl+Alt+E');
            console.log('========================================');
            console.log('');

            exploreGameObject();

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
                            if (value === null) { type = 'null'; }
                            else if (Array.isArray(value)) { type = 'array[' + value.length + ']'; }
                            console.log('  ' + key + ': ' + type);
                        });
                        console.log('');
                        console.log('请将以上结果记录到 docs/API_DATA_STRUCTURE.md');
                    })
                    .catch(function(error) {
                        console.error('API 请求失败:', error);
                    });
            } else {
                console.log('当前没有玩家数据，无法探索 API');
            }

            console.log('');
            console.log('========================================');
            console.log('提示: 使用 tools/api-explorer.html 可以更方便地探索 API');
            console.log('========================================');
        }
    });

    // 核心检查：isInGame() 两阶段守卫（ingame + DesktopMgr.gameing）
    // 只有 gameing=true 时 player_datas 才就绪，避免加载阶段触发 Proxy 副作用
    function checkAndProcess() {
        try {
            if (isProcessing) return;

            if (!isInGame()) {
                if (lastCheck !== null) {
                    lastCheck = null;
                    clearAllPlayerInfoUI();
                }
                window.majstyleJS.status = 'waiting';
                return;
            }

            window.majstyleJS.status = 'checking';

            var playerDatas = getPlayerDatas();
            var myId = getMyAccountId();

            if (!playerDatas || playerDatas.length === 0) {
                clearAllPlayerInfoUI();
                return;
            }

            var currentIds = playerDatas.map(function(p) {
                return p.account_id;
            }).sort().join(',');

            if (currentIds === lastCheck) return;

            lastCheck = currentIds;
            isProcessing = true;
            window.majstyleJS.status = 'processing';
            resetPlayerUICounter();

            console.log('========================================');
            console.log('         雀魂对手风格分析');
            console.log('========================================');

            var promises = [];
            for (var i = 0; i < playerDatas.length; i++) {
                var playerId = playerDatas[i].account_id;

                if (processingCache.has(playerId)) {
                    promises.push(processingCache.get(playerId));
                } else {
                    var promise = processPlayer(playerDatas[i], myId, i);
                    processingCache.set(playerId, promise);
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
                    window.majstyleJS.status = 'done';
                });

        } catch(e) {
            console.log('[错误] ' + e.message);
            console.log(e.stack);
            isProcessing = false;
            window.majstyleJS.status = 'error:' + e.message;
        }
    }

    // Throttle：第一次 DOM 变化后锁定 1 秒执行一次，期间忽略后续调用
    // 用 throttle 而非 debounce：游戏动画帧每 16ms 触发 mutation，debounce 会永远被重置
    function throttledCheck() {
        if (throttleTimer) return;
        throttleTimer = setTimeout(function() {
            throttleTimer = null;
            checkAndProcess();
        }, 1000);
    }

    // MutationObserver：有 DOM 变化时快速响应（如 monitor 工具、大厅 UI 等）
    observer = new MutationObserver(throttledCheck);
    observer.observe(document.body, { childList: true, subtree: true });

    // 兜底轮询：游戏是 canvas 渲染，document.body 可能长时间无 DOM 变化
    // isInGame() 守卫确保加载阶段不会触碰 view.DesktopMgr，无 Proxy 副作用
    fallbackInterval = setInterval(checkAndProcess, 3000);

    window.majstyleJS.status = 'observer-ready';
})();
