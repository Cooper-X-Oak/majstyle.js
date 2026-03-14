// 获取游戏窗口对象
export function getGameWindow() {
    return (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
}

// 获取当前对局的玩家数据
export function getPlayerDatas() {
    var gameWindow = getGameWindow();
    try {
        return gameWindow.view.DesktopMgr.Inst.player_datas;
    } catch(e) {
        return null;
    }
}

// 获取当前用户的账号ID
export function getMyAccountId() {
    var gameWindow = getGameWindow();
    try {
        return gameWindow.GameMgr.Inst.account_id;
    } catch(e) {
        return null;
    }
}
