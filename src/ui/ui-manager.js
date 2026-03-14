// 初始化命名空间
if (typeof window.majstyleJS === 'undefined') {
    window.majstyleJS = {};
}

// 清除所有玩家信息UI
export function clearAllPlayerInfoUI() {
    var elements = document.querySelectorAll('.majsoul-style-info');
    elements.forEach(function(el) {
        el.remove();
    });
    window.majstyleJS.playerUICounter = 0;
}

// 重置UI计数器
export function resetPlayerUICounter() {
    window.majstyleJS.playerUICounter = 0;
}
