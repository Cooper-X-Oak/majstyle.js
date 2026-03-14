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

// 探索游戏对象结构（用于数据研究）
export function exploreGameObject() {
    var gameWindow = getGameWindow();

    console.log('=== 雀魂游戏对象结构探索 ===');
    console.log('提示: 将以下结果记录到 docs/GAME_OBJECT_STRUCTURE.md');
    console.log('');

    // 探索 view 对象
    if (gameWindow.view) {
        console.log('【view 对象】');
        console.log('可用属性:', Object.keys(gameWindow.view));
        console.log('');

        // 探索 DesktopMgr
        if (gameWindow.view.DesktopMgr) {
            console.log('【view.DesktopMgr 对象】');
            console.log('可用属性:', Object.keys(gameWindow.view.DesktopMgr));
            console.log('');

            // 探索 DesktopMgr.Inst
            if (gameWindow.view.DesktopMgr.Inst) {
                console.log('【view.DesktopMgr.Inst 对象】');
                var instKeys = Object.keys(gameWindow.view.DesktopMgr.Inst);
                console.log('可用属性 (' + instKeys.length + ' 个):', instKeys);
                console.log('');

                // 探索 player_datas
                if (gameWindow.view.DesktopMgr.Inst.player_datas) {
                    console.log('【player_datas 数组】');
                    var playerDatas = gameWindow.view.DesktopMgr.Inst.player_datas;
                    console.log('玩家数量:', playerDatas.length);

                    if (playerDatas.length > 0) {
                        console.log('第一个玩家对象的属性:', Object.keys(playerDatas[0]));
                        console.log('第一个玩家数据示例:', JSON.stringify(playerDatas[0], null, 2));
                    }
                    console.log('');
                }
            }
        }
    } else {
        console.log('⚠️ view 对象不存在');
    }

    // 探索 GameMgr 对象
    if (gameWindow.GameMgr) {
        console.log('【GameMgr 对象】');
        console.log('可用属性:', Object.keys(gameWindow.GameMgr));
        console.log('');

        if (gameWindow.GameMgr.Inst) {
            console.log('【GameMgr.Inst 对象】');
            var gameMgrKeys = Object.keys(gameWindow.GameMgr.Inst);
            console.log('可用属性 (' + gameMgrKeys.length + ' 个):', gameMgrKeys);
            console.log('');

            // 显示一些可能有用的属性
            var interestingKeys = ['account_id', 'game_state', 'round', 'dealer', 'scores'];
            interestingKeys.forEach(function(key) {
                if (typeof gameWindow.GameMgr.Inst[key] !== 'undefined') {
                    console.log('  ' + key + ':', gameWindow.GameMgr.Inst[key]);
                }
            });
            console.log('');
        }
    } else {
        console.log('⚠️ GameMgr 对象不存在');
    }

    // 探索可能的事件系统
    console.log('【事件系统探索】');
    var eventKeys = ['on', 'addEventListener', 'emit', 'trigger', 'dispatch'];
    var foundEvents = false;

    [gameWindow, gameWindow.view, gameWindow.GameMgr].forEach(function(obj, idx) {
        if (obj) {
            var objName = ['gameWindow', 'view', 'GameMgr'][idx];
            eventKeys.forEach(function(key) {
                if (typeof obj[key] === 'function') {
                    console.log('  发现事件方法: ' + objName + '.' + key);
                    foundEvents = true;
                }
            });
        }
    });

    if (!foundEvents) {
        console.log('  未发现明显的事件系统');
    }
    console.log('');

    console.log('=== 探索完成 ===');
    console.log('请将以上结果记录到 docs/GAME_OBJECT_STRUCTURE.md');
}
