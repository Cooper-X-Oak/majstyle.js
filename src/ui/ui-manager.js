// 清除所有玩家信息UI
export function clearAllPlayerInfoUI() {
    var elements = document.querySelectorAll('.majsoul-style-info');
    elements.forEach(function(el) {
        el.remove();
    });
    window.playerUICounter = 0;
}

// 重置UI计数器
export function resetPlayerUICounter() {
    window.playerUICounter = 0;
}
