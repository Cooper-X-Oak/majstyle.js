// 初始化命名空间
if (typeof window.majstyleJS === "undefined") {
  window.majstyleJS = {};
}

// 清除所有玩家信息UI
export function clearAllPlayerInfoUI() {
  var elements = document.querySelectorAll(".majsoul-style-info");
  elements.forEach(function (el) {
    el.remove();
  });
  // 清除座位索引和折叠状态
  delete window.majstyleJS.selfSeatIndex;
  window.majstyleJS.cardsCollapsed = false;
}

// 重置UI计数器（保留接口兼容性，但不再使用计数器）
export function resetPlayerUICounter() {
  // 清除座位索引，准备重新分配
  delete window.majstyleJS.selfSeatIndex;
}
