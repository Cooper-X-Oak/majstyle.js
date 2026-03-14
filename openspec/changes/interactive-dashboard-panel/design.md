## Context

当前的雀魂数据分析助手（468 行）采用自动检测模式，在对局开始时自动显示对手风格信息。现在需要扩展为交互式面板，支持主动查询和深度对比。

**现有架构**：
- 单文件 Tampermonkey 脚本，ES5 语法
- 使用 unsafeWindow 访问游戏对象
- GM_xmlhttpRequest 调用牌谱屋 API
- 简单的 DOM 操作创建悬浮信息框

**技术约束**：
- 必须保持 ES5 兼容（Tampermonkey 环境）
- 不能使用外部构建工具（纯脚本运行）
- 必须绕过 CORS（使用 GM_xmlhttpRequest）
- 不能触碰雀魂反作弊机制（只读取暴露的对象）

**利益相关者**：
- 雀魂玩家（需要简单易用的工具）
- 开发者（需要可维护的代码结构）

## Goals / Non-Goals

**Goals:**
- 创建模块化架构，支持未来扩展
- 实现高性能的图表渲染（<300ms）
- 提供直观的用户交互体验
- 保持与现有功能的兼容性
- 确保代码可测试和可维护

**Non-Goals:**
- 不支持移动端（雀魂主要是桌面游戏）
- 不支持三人麻将（当前只做四人麻将）
- 不支持历史对局回放（API 不支持）
- 不做数据导出功能（P2 优先级，本次不做）
- 不做 AI 对局建议（需要额外的算法开发）

## Decisions

### 1. 模块化架构设计

**决策**：采用命名空间模式（Namespace Pattern）组织代码，而非 ES6 模块

**理由**：
- ES5 环境不支持 import/export
- 命名空间模式提供清晰的模块边界
- 便于在单文件脚本中组织代码
- 避免全局变量污染

**替代方案**：
- ❌ IIFE 模式：难以模块间通信
- ❌ 原型链模式：过于复杂，不适合函数式风格

**实现**：
```javascript
var DashboardPanel = {
    UI: { /* UI 管理函数 */ },
    Search: { /* 搜索模块 */ },
    Comparison: { /* 对比模块 */ },
    Chart: { /* 图表模块 */ },
    Cache: { /* 数据缓存 */ },
    Storage: { /* 本地存储 */ }
};
```

### 2. 图表库选择

**决策**：使用 Chart.js v3.9.1

**理由**：
- 轻量级（~200KB），支持 CDN 引入
- 原生支持雷达图、柱状图、折线图
- 响应式设计，自动适配容器大小
- 文档完善，社区活跃
- 支持 ES5 环境

**替代方案**：
- ❌ ECharts：体积过大（~1MB），功能过剩
- ❌ D3.js：学习曲线陡峭，需要大量自定义代码
- ❌ 自己实现：开发成本高，性能难以保证

**集成方式**：
```javascript
// @require https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js
```

### 3. 状态管理方案

**决策**：使用中心化状态对象 + 事件总线（Event Bus）

**理由**：
- 中心化状态便于调试和追踪
- 事件总线解耦模块间依赖
- 符合 ES5 的编程范式
- 性能开销小

**替代方案**：
- ❌ Redux/Vuex：需要额外依赖，过于重量级
- ❌ 直接函数调用：模块间耦合度高
- ❌ 观察者模式：实现复杂，不如事件总线简洁

**实现**：
```javascript
var DashboardState = {
    isOpen: false,
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 },
    compareList: [],
    currentChart: 'radar',
    cache: {}
};

var EventBus = {
    events: {},
    on: function(event, callback) { /* ... */ },
    emit: function(event, data) { /* ... */ }
};
```

### 4. 数据缓存策略

**决策**：内存缓存 + 时间戳过期（5 分钟）

**理由**：
- 减少 API 请求，提升响应速度
- 5 分钟过期平衡数据新鲜度和性能
- 内存缓存实现简单，无需持久化
- 避免 localStorage 容量限制

**替代方案**：
- ❌ 无缓存：API 请求过多，响应慢
- ❌ localStorage 缓存：容量有限（5-10MB），读写慢
- ❌ IndexedDB：过于复杂，不适合简单数据

**实现**：
```javascript
var DataCache = {
    cache: {},
    TTL: 5 * 60 * 1000, // 5分钟
    set: function(key, value) {
        this.cache[key] = { data: value, timestamp: Date.now() };
    },
    get: function(key) {
        var item = this.cache[key];
        if (!item) return null;
        if (Date.now() - item.timestamp > this.TTL) {
            delete this.cache[key];
            return null;
        }
        return item.data;
    }
};
```

### 5. 面板拖拽实现

**决策**：原生 DOM 事件（mousedown/mousemove/mouseup）

**理由**：
- 无需外部依赖
- 性能最优
- 兼容性好
- 实现简单（~50 行代码）

**替代方案**：
- ❌ HTML5 Drag & Drop API：行为不符合预期（会触发拖放）
- ❌ 第三方库（interact.js）：增加依赖，体积大

**实现**：
```javascript
var isDragging = false;
var dragOffset = { x: 0, y: 0 };

panel.addEventListener('mousedown', function(e) {
    if (e.target === titleBar) {
        isDragging = true;
        dragOffset.x = e.clientX - panel.offsetLeft;
        dragOffset.y = e.clientY - panel.offsetTop;
    }
});

document.addEventListener('mousemove', function(e) {
    if (isDragging) {
        panel.style.left = (e.clientX - dragOffset.x) + 'px';
        panel.style.top = (e.clientY - dragOffset.y) + 'px';
    }
});

document.addEventListener('mouseup', function() {
    isDragging = false;
});
```

### 6. 数据归一化算法

**决策**：基于段位基准的相对归一化（0-100 分制）

**理由**：
- 不同指标量级差异大（立直率 ~20%，平均打点 ~6500）
- 相对归一化保留与段位平均的对比关系
- 50 分为基准线，便于理解偏差
- 支持不同段位的基准切换

**替代方案**：
- ❌ Min-Max 归一化：丢失与基准的对比关系
- ❌ Z-score 标准化：不直观，难以理解
- ❌ 绝对值显示：量级差异大，图表难以对比

**公式**：
```javascript
归一化值 = (实际值 / 基准值) * 50
防守力 = (1 - 放铳率 / 基准放铳率) * 50 + 50  // 反向指标
```

### 7. 性能优化策略

**决策**：图表更新而非重建 + 防抖处理 + ResizeObserver

**理由**：
- Chart.js 的 update() 比 destroy() + new Chart() 快 10 倍
- 防抖避免频繁更新（用户快速切换玩家时）
- ResizeObserver 自动响应面板大小变化

**实现**：
```javascript
// 更新而非重建
function updateChart(newData) {
    chart.data.datasets[0].data = newData;
    chart.update('none'); // 无动画，更快
}

// 防抖
var updateChartDebounced = debounce(updateChart, 300);

// 响应式
var resizeObserver = new ResizeObserver(function() {
    if (chart) chart.resize();
});
resizeObserver.observe(chartContainer);
```

## Risks / Trade-offs

### 1. Chart.js CDN 依赖

**风险**：CDN 不可用导致图表功能失效

**缓解措施**：
- 使用 jsdelivr（国内可访问，有备份节点）
- 添加加载超时检测（10 秒）
- 失败时显示友好提示，降级为纯文本显示

### 2. 内存占用增加

**风险**：从 <5MB 增加到 <20MB，可能影响低配置设备

**缓解措施**：
- 限制缓存大小（最多 50 个玩家）
- 限制对比列表（最多 4 个玩家）
- 关闭面板时释放图表资源（chart.destroy()）

### 3. API 请求频率

**风险**：批量搜索可能触发 API 限流

**缓解措施**：
- 使用缓存减少重复请求
- 添加请求队列，控制并发（最多 3 个）
- 添加重试机制（指数退避）

### 4. 与现有功能的兼容性

**风险**：新面板可能与现有的自动显示功能冲突

**缓解措施**：
- 保持现有功能独立运行
- 共享数据缓存，避免重复请求
- 使用不同的 DOM 容器，避免 ID 冲突

### 5. 浏览器兼容性

**风险**：ResizeObserver 在旧版浏览器不支持

**缓解措施**：
- 添加 polyfill 检测
- 降级为 window.resize 事件
- 文档中明确浏览器要求（Chrome/Edge 90+）

### 6. 用户学习曲线

**风险**：交互式面板比自动显示复杂，用户可能不会用

**缓解措施**：
- 提供快捷键（Ctrl+Shift+D）和悬浮按钮两种触发方式
- 添加首次使用引导提示
- 保持 UI 简洁，减少操作步骤

## Migration Plan

### 部署步骤

1. **阶段 1：核心框架（P0）**
   - 实现面板 UI 框架（拖拽、调整大小）
   - 集成 Chart.js
   - 实现状态管理和事件总线
   - **验收标准**：面板可以打开/关闭、拖拽、调整大小

2. **阶段 2：搜索功能（P0）**
   - 实现玩家搜索（ID/昵称）
   - 实现快速添加当前对局玩家
   - 实现数据缓存
   - **验收标准**：可以搜索玩家并显示基本信息

3. **阶段 3：图表可视化（P0）**
   - 实现雷达图渲染
   - 实现数据归一化
   - 实现多玩家叠加显示
   - **验收标准**：可以显示 2-4 个玩家的雷达图对比

4. **阶段 4：对比功能（P0）**
   - 实现对比列表管理
   - 实现柱状图渲染
   - 实现差异高亮
   - **验收标准**：可以对比多个玩家的详细数据

5. **阶段 5：优化和测试（P1）**
   - 性能优化（防抖、缓存）
   - 用户偏好保存（localStorage）
   - 错误处理和边界情况
   - **验收标准**：通过所有测试用例，性能达标

### 回滚策略

- 保留现有的 `雀魂金玉四麻风格分析助手.user.js` 作为备份
- 新功能作为独立脚本发布（`雀魂数据分析面板Pro.user.js`）
- 用户可以选择启用/禁用
- 如果出现严重问题，禁用新脚本即可回滚

### 测试计划

**单元测试**（手动）：
- 数据归一化函数
- 缓存过期逻辑
- 事件总线机制

**集成测试**：
- 搜索 → 缓存 → 显示流程
- 添加玩家 → 更新图表流程
- 拖拽 → 保存偏好 → 恢复流程

**性能测试**：
- 面板打开时间 <200ms
- 搜索响应时间 <500ms
- 图表渲染时间 <300ms
- 内存占用 <20MB

## Open Questions

1. **是否需要支持自定义图表配置？**
   - 例如：用户自定义雷达图维度、颜色主题
   - 建议：P2 优先级，本次不做

2. **是否需要支持键盘导航？**
   - 例如：Tab 键切换焦点、Enter 键搜索
   - 建议：P1 优先级，如果时间允许可以做

3. **是否需要支持多语言？**
   - 当前只有中文
   - 建议：P2 优先级，等有国际版需求再做

4. **缓存清理策略？**
   - 当前是 5 分钟过期 + 最多 50 个玩家
   - 是否需要手动清理按钮？
   - 建议：先观察实际使用情况，再决定是否需要

5. **是否需要支持导出图表为图片？**
   - Chart.js 支持 toBase64Image()
   - 建议：P2 优先级，用户需求不明确
