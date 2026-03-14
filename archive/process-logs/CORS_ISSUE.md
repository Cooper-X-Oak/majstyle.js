# CORS 问题说明

## 问题描述

当你尝试使用 `tools/api-explorer.html` 工具时，遇到了 "Failed to fetch" 错误。这是浏览器的安全机制导致的。

## 技术原因

### 什么是 CORS？

CORS（Cross-Origin Resource Sharing，跨域资源共享）是浏览器的一种安全机制，用于限制网页从不同域名加载资源。

### 为什么会失败？

1. **本地 HTML 文件**（`file:///...`）尝试访问外部 API（`https://5-data.amae-koromo.com`）
2. 浏览器检测到跨域请求
3. 牌谱屋 API 服务器没有设置允许跨域的响应头
4. 浏览器阻止了请求，返回 "Failed to fetch" 错误

### 为什么用户脚本可以工作？

用户脚本使用 Tampermonkey 提供的 `GM_xmlhttpRequest` API，这是一个特权 API，可以绕过浏览器的 CORS 限制。

## 解决方案

### 方案 1: 使用游戏内探索模式（推荐）✅

**优点**:
- 最简单，无需额外配置
- 可以同时探索游戏对象和 API 数据
- 使用 Tampermonkey 的特权 API，无 CORS 问题

**步骤**:
1. 安装用户脚本
2. 进入雀魂对局
3. 按 `Ctrl+Alt+E`
4. 查看浏览器控制台（F12）

### 方案 2: 使用本地 Web 服务器

**原理**: 通过 HTTP 协议访问，而不是 `file://` 协议

**步骤**:

1. **使用 Python（推荐）**
   ```bash
   cd tools
   python -m http.server 8000
   ```
   然后访问: `http://localhost:8000/api-explorer.html`

2. **使用 Node.js**
   ```bash
   npx http-server tools -p 8000
   ```
   然后访问: `http://localhost:8000/api-explorer.html`

3. **使用 VS Code**
   - 安装 "Live Server" 扩展
   - 右键 `api-explorer.html` -> "Open with Live Server"

**注意**: 即使使用本地服务器，仍然可能遇到 CORS 问题，因为牌谱屋 API 服务器没有设置 CORS 响应头。

### 方案 3: 使用浏览器扩展禁用 CORS（不推荐）

**警告**: 这会降低浏览器的安全性，仅用于开发测试

**Chrome/Edge**:
- 安装 "CORS Unblock" 或类似扩展
- 启用扩展
- 刷新页面

**Firefox**:
- 安装 "CORS Everywhere" 扩展
- 启用扩展
- 刷新页面

**注意**: 使用完后记得禁用扩展！

## 推荐做法

**直接使用游戏内探索模式**（`Ctrl+Alt+E`）是最简单、最可靠的方法。

`api-explorer.html` 工具可以作为：
1. UI 参考
2. 在配置好本地服务器后使用
3. 了解 API 结构的文档

但实际数据探索，推荐使用游戏内探索模式。

## 为什么还保留 HTML 工具？

1. **独立性**: 不依赖游戏环境，可以随时探索任何账号
2. **UI 友好**: 比控制台输出更直观
3. **教学价值**: 展示 API 的使用方式
4. **未来扩展**: 可能会添加更多功能（如对比分析）

## 总结

- ✅ **推荐**: 使用游戏内探索模式（`Ctrl+Alt+E`）
- ⚠️ **备用**: 使用本地 Web 服务器 + HTML 工具
- ❌ **不推荐**: 禁用浏览器 CORS（安全风险）

现在就去游戏中按 `Ctrl+Alt+E` 试试吧！
