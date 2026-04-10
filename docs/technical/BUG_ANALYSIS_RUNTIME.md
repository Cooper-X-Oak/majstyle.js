# 运行时 Bug 分析报告

**创建时间**: 2026-04-10  
**分析者**: bug-agent  
**状态**: ✅ 已修复（2026-04-11）

---

## 问题现象

脚本部署到实际运行环境后：
- 后台产生大量报错（"巨多报错"）
- 游戏加载时间明显变长

---

## BUG-05：轮询期间触发游戏 Reactive Proxy 错误处理器（严重）

### 根本原因

游戏的 `view` 对象被 Reactive Proxy 包装（游戏内部使用类 Vue 响应式系统）。在游戏加载阶段，`view.DesktopMgr` 尚未完成初始化，此时从外部脚本访问该属性会触发游戏的响应式错误处理器，产生副作用（向 aliyuncs 上报错误日志），**即使我们的 try/catch 捕获了抛出的异常，副作用已经发生**。

我们的脚本在游戏加载完成前每秒轮询一次，导致错误持续触发。

### 证据

**解码后的错误栈**（来自 aliyuncs 日志请求的 URL 参数）：

```
Error
    at getPlayerDatas (chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/userscript.html?name=...user.js:38:60)
    at Proxy.<anonymous> (chrome-extension://...user.js:2850:29)
    at At (<anonymous>:10:89)
    at t.<computed> (<anonymous>:81:107)
    at At (<anonymous>:10:89)
    at <anonymous>:32:325
    at <anonymous>:27:327
    at At (<anonymous>:10:89)
```

**游戏上报的错误元数据**：

```json
{
  "err": true,
  "prop": "DesktopMgr",
  "mode": false,
  "type": "re_err"
}
```

- `type: "re_err"` = reactive error，响应式系统检测到非法上下文访问
- `prop: "DesktopMgr"` = 被访问的属性名
- `mode: false` = 当前不在响应式上下文中

### 触发路径

```
main.js setInterval (每 1 秒)
  → getPlayerDatas()                          [game-bridge.js:7]
    → gameWindow.view.DesktopMgr              [game-bridge.js:10]
      → 游戏 Reactive Proxy getter 触发
        → 游戏错误处理器调用 window.onerror 或 dispatchEvent
          → 游戏向 aliyuncs 发送 HTTP 错误日志请求
            → aliyuncs 请求失败 (ERR_FAILED)，产生新的控制台错误
        → Proxy getter 抛出异常
      → try/catch 捕获异常，返回 null
```

### 频率与影响

- 脚本在页面加载后 **2 秒**开始轮询，每 **1 秒**一次
- 游戏加载阶段通常持续 **10~30 秒**
- 因此每次进入游戏会触发 **10~30 次**该错误
- 每次错误触发一个 aliyuncs HTTP 请求，该请求本身也失败（ERR_FAILED），产生额外的控制台错误
- 错误请求的超时等待会阻塞游戏的错误处理流程，**直接导致加载变慢**

### 相关代码位置

- `src/game/game-bridge.js:7-18` — `getPlayerDatas()` 函数，包含 try/catch 但无法阻止 Proxy 副作用
- `src/main.js:85-152` — setInterval 轮询逻辑，2 秒后启动，1 秒间隔

### 注意

`getPlayerDatas()` 的 try/catch 本身是正确的，但它只能捕获 **抛出的异常**，无法阻止 Proxy getter 在抛出前已经执行的**副作用**（调用游戏错误处理器）。这是 JavaScript Proxy 的特性，try/catch 无法拦截 getter 的副作用。

---

## BUG-06：sw.js 大量 Failed to fetch（非我方 Bug，需确认）

### 现象

```
sw.js:1  Uncaught (in promise) TypeError: Failed to fetch
    at sw.js:1:625
```

日志中出现 20+ 次，贯穿整个加载过程。

### 分析

这些错误来自**游戏自身的 Service Worker**（`sw.js`），不是我们的脚本。

- Service Worker 在尝试缓存/拦截游戏资源时，fetch 请求失败
- 同时出现的 `connect.facebook.net/en_US/sdk.js` 失败、`majsoul-hk-client.cn-hongkong.log.aliyuncs.com` 失败，均为网络层问题
- 这些错误在我们的脚本加载之前就已经开始出现

**结论**：BUG-06 是游戏本身的网络/SW 问题，与我们的脚本无关。但需要注意：BUG-05 产生的 aliyuncs 请求失败会与这些错误混在一起，增加噪音，使问题看起来更严重。

### 需要进一步确认

- 禁用我们的脚本后，sw.js 错误是否依然存在？（预期：是）
- 如果是，则 BUG-06 完全是游戏侧问题，我们无需处理

---

## BUG-07：游戏资源加载超时（非我方 Bug，记录备查）

### 现象

```
code.js:1 loader callback cost a long time:144 url=res/proto/liqi.json
code.js:1 loader callback cost a long time:3448 url=scene/entrance_chs_t.ls
```

### 分析

游戏自身的资源加载器报告某些资源加载耗时过长（3448ms 加载场景文件）。这是游戏侧的性能问题，与我们的脚本无关。

---

## 问题优先级

| Bug | 严重程度 | 是否我方问题 | 状态 |
|-----|---------|------------|------|
| BUG-05 | 严重 | 是 | ✅ 已修复 v2.2.2 |
| BUG-06 | 中等 | 否（游戏侧） | 无需处理 |
| BUG-07 | 低 | 否（游戏侧） | 无需处理 |

---

## 修复记录（BUG-05）

**修复版本**: v2.2.2  
**修复日期**: 2026-04-11  
**修复者**: bug-agent

### 修复方案

**三层修复，逐步收敛**：

#### 第一层：isInGame() 两阶段守卫（`src/game/game-bridge.js`）

新增 `isInGame()` 函数，替代直接访问 `view.DesktopMgr`：

```javascript
export function isInGame() {
    // 第一阶段：GameMgr.ingame（安全，不触发 Proxy 副作用）
    if (!(gameWindow.GameMgr.Inst && gameWindow.GameMgr.Inst.ingame)) return false;
    // 第二阶段：DesktopMgr.gameing（精确，player_datas 就绪的真正信号）
    var dm = gameWindow.view.DesktopMgr.Inst;
    return !!(dm && dm.gameing);
}
```

关键发现（来自 `tools/web-tools/game-state-monitor.user.js` 实测）：
- `ingame: true` 只代表游戏会话建立，此时 `DesktopMgr` 尚未初始化
- `DesktopMgr.gameing: true` 才代表牌局真正开始，`player_datas` 就绪
- 两者之间有约 **8 秒**的间隔

#### 第二层：MutationObserver 替代 setInterval（`src/main.js`）

删除 `setTimeout + setInterval(1000ms)` 轮询，改用 `MutationObserver` 监听 DOM 变化触发检测。对局中游戏动画帧持续产生 DOM mutations，足以驱动检测。

#### 第三层：Throttle 替代 Debounce（`src/main.js`）

游戏动画帧约每 16ms 触发一次 mutation，debounce 会被持续重置导致永远不执行。改用 throttle：第一次触发后锁定 1 秒，期间忽略后续调用。

```javascript
function throttledCheck() {
    if (throttleTimer) return;  // 锁定期间忽略
    throttleTimer = setTimeout(function() {
        throttleTimer = null;
        checkAndProcess();
    }, 1000);
}
```

### 验证结果

实测日志（`game-state-monitor v1.3.0`）：

```
00:42:12  DesktopMgr.gameing: false → true   ← isInGame() 返回 true
00:42:15  分析卡片数: 0 → 1                   ← 主脚本触发，3秒后卡片出现
```

加载阶段无 `re_err` 类型的 aliyuncs 请求，BUG-05 完全消除。

### 新增工具

`tools/web-tools/game-state-monitor.user.js` — 游戏状态监测 Tampermonkey 脚本，用于调试触发时机。监测 `ingame`、`gameing`、主脚本状态、分析卡片数等关键信号，支持 Alt+M 收起。
