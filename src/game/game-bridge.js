// 获取游戏窗口对象
export function getGameWindow() {
    return (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
}

// 获取当前对局的玩家数据
export function getPlayerDatas() {
    var gameWindow = getGameWindow();
    try {
        if (gameWindow && gameWindow.view && gameWindow.view.DesktopMgr &&
            gameWindow.view.DesktopMgr.Inst && gameWindow.view.DesktopMgr.Inst.player_datas) {
            return gameWindow.view.DesktopMgr.Inst.player_datas;
        }
        return null;
    } catch(e) {
        return null;
    }
}

// 判断牌局是否真正进行中
// 两阶段检查：ingame（安全，不触发 Proxy）→ DesktopMgr.gameing（精确，player_datas 可用）
// 注意：ingame=true 只代表游戏会话建立，gameing=true 才代表牌局开始、player_datas 就绪
export function isInGame() {
    var gameWindow = getGameWindow();
    try {
        if (!(gameWindow && gameWindow.GameMgr &&
              gameWindow.GameMgr.Inst && gameWindow.GameMgr.Inst.ingame)) {
            return false;
        }
        var dm = gameWindow.view && gameWindow.view.DesktopMgr && gameWindow.view.DesktopMgr.Inst;
        return !!(dm && dm.gameing);
    } catch(e) {
        return false;
    }
}

// 获取当前用户的账号ID
export function getMyAccountId() {
    var gameWindow = getGameWindow();
    try {
        if (gameWindow && gameWindow.GameMgr && gameWindow.GameMgr.Inst &&
            typeof gameWindow.GameMgr.Inst.account_id !== 'undefined') {
            return gameWindow.GameMgr.Inst.account_id;
        }
        return null;
    } catch(e) {
        return null;
    }
}

// 深度探索对象（递归）
function deepExplore(obj, path, maxDepth, currentDepth) {
    'use strict';

    if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
        return;
    }

    var keys = Object.keys(obj);
    var statsKeywords = ['stat', 'rate', '率', '点', 'count', 'avg', 'average', 'total', 'score', 'data', 'record', 'history'];

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = obj[key];
        var fullPath = path + '.' + key;

        // 检查是否包含统计关键词
        var hasStatsKeyword = false;
        for (var j = 0; j < statsKeywords.length; j++) {
            if (key.toLowerCase().indexOf(statsKeywords[j]) !== -1) {
                hasStatsKeyword = true;
                break;
            }
        }

        if (hasStatsKeyword) {
            console.log('🔍 发现可能的统计数据: ' + fullPath);
            console.log('   类型:', typeof value);
            if (Array.isArray(value)) {
                console.log('   数组长度:', value.length);
                if (value.length > 0) {
                    console.log('   第一个元素:', JSON.stringify(value[0]).substring(0, 200));
                }
            } else if (typeof value === 'object' && value !== null) {
                console.log('   对象属性:', Object.keys(value).slice(0, 10).join(', '));
            } else {
                console.log('   值:', value);
            }
            console.log('');
        }

        // 递归探索
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            deepExplore(value, fullPath, maxDepth, currentDepth + 1);
        }
    }
}

// 探索游戏对象结构（增强版）
export function exploreGameObject() {
    'use strict';

    var gameWindow = getGameWindow();

    console.log('=== 雀魂游戏对象结构深度探索 ===');
    console.log('目标: 寻找玩家统计数据（立直率、和牌率等 51 个字段）');
    console.log('');

    // 探索 view 对象
    if (gameWindow.view) {
        console.log('【1. view 对象】');
        console.log('可用属性:', Object.keys(gameWindow.view));
        console.log('');

        // 探索 DesktopMgr
        if (gameWindow.view.DesktopMgr && gameWindow.view.DesktopMgr.Inst) {
            console.log('【2. view.DesktopMgr.Inst 对象】');
            var instKeys = Object.keys(gameWindow.view.DesktopMgr.Inst);
            console.log('可用属性 (' + instKeys.length + ' 个):', instKeys);
            console.log('');

            // 探索 player_datas
            if (gameWindow.view.DesktopMgr.Inst.player_datas) {
                console.log('【3. player_datas 数组】');
                var playerDatas = gameWindow.view.DesktopMgr.Inst.player_datas;
                console.log('玩家数量:', playerDatas.length);

                if (playerDatas.length > 0) {
                    console.log('第一个玩家对象的所有属性:');
                    console.log(Object.keys(playerDatas[0]));
                    console.log('');
                    console.log('第一个玩家完整数据:');
                    console.log(JSON.stringify(playerDatas[0], null, 2));
                    console.log('');

                    // 深度探索玩家对象
                    console.log('【4. 深度探索玩家对象（寻找统计数据）】');
                    deepExplore(playerDatas[0], 'player_datas[0]', 5, 0);
                }
            }

            // 深度探索 DesktopMgr.Inst
            console.log('【5. 深度探索 DesktopMgr.Inst（寻找统计数据）】');
            deepExplore(gameWindow.view.DesktopMgr.Inst, 'view.DesktopMgr.Inst', 3, 0);
        }
    }

    // 探索 GameMgr 对象
    if (gameWindow.GameMgr && gameWindow.GameMgr.Inst) {
        console.log('【6. GameMgr.Inst 对象】');
        var gameMgrKeys = Object.keys(gameWindow.GameMgr.Inst);
        console.log('可用属性 (' + gameMgrKeys.length + ' 个):', gameMgrKeys);
        console.log('');

        // 深度探索 GameMgr.Inst
        console.log('【7. 深度探索 GameMgr.Inst（寻找统计数据）】');
        deepExplore(gameWindow.GameMgr.Inst, 'GameMgr.Inst', 3, 0);
    }

    // 探索顶层 window 对象
    console.log('【8. 探索顶层 window 对象（寻找统计相关对象）】');
    var topLevelKeys = Object.keys(gameWindow);
    var statsRelatedKeys = topLevelKeys.filter(function(key) {
        return key.toLowerCase().indexOf('stat') !== -1 ||
               key.toLowerCase().indexOf('player') !== -1 ||
               key.toLowerCase().indexOf('data') !== -1 ||
               key.toLowerCase().indexOf('record') !== -1;
    });

    if (statsRelatedKeys.length > 0) {
        console.log('发现可能相关的顶层对象:', statsRelatedKeys);
        statsRelatedKeys.forEach(function(key) {
            console.log('');
            console.log('探索 window.' + key + ':');
            if (gameWindow[key] && typeof gameWindow[key] === 'object') {
                console.log('  属性:', Object.keys(gameWindow[key]).slice(0, 20));
                deepExplore(gameWindow[key], 'window.' + key, 3, 0);
            }
        });
    } else {
        console.log('未发现明显的统计相关顶层对象');
    }

    console.log('');
    console.log('=== 探索完成 ===');
    console.log('');
    console.log('📋 下一步操作:');
    console.log('1. 查看上面标记为 🔍 的路径');
    console.log('2. 在控制台手动访问这些路径，查看完整数据');
    console.log('3. 将包含 51 个统计字段的路径告诉开发者');
    console.log('');
    console.log('💡 提示: 寻找包含以下字段的对象:');
    console.log('   立直率、副露率、和牌率、放铳率、平均打点、立直收支、');
    console.log('   立直后和牌率、副露后和牌率、和了巡数、被炸率、默听率等');
}
