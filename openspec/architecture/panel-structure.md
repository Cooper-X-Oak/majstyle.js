# 架构设计：面板结构

## 模块划分

```
DashboardPanel (主模块)
├── PanelUI (UI 管理)
│   ├── createPanel()
│   ├── togglePanel()
│   ├── dragHandler()
│   └── resizeHandler()
├── SearchModule (搜索模块)
│   ├── searchPlayer()
│   ├── addCurrentPlayers()
│   └── displaySearchResult()
├── ComparisonModule (对比模块)
│   ├── addPlayer()
│   ├── removePlayer()
│   ├── compareList (最多4个)
│   └── updateComparison()
├── ChartModule (图表模块)
│   ├── renderRadarChart()
│   ├── renderBarChart()
│   ├── updateChart()
│   └── normalizeData()
├── DataCache (数据缓存)
│   ├── cachePlayer()
│   ├── getPlayer()
│   └── clearExpired()
└── StorageModule (本地存储)
    ├── savePreferences()
    ├── loadPreferences()
    └── saveHistory()
```

## 数据流

```
用户输入 → SearchModule → API请求 → DataCache
                                          ↓
                                    ComparisonModule
                                          ↓
                                    ChartModule → 渲染图表
```

## 状态管理

```javascript
var DashboardState = {
    isOpen: false,
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 },
    compareList: [],
    currentChart: 'radar',
    cache: {}
};
```

## 事件系统

```javascript
var EventBus = {
    events: {},
    on: function(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    },
    emit: function(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(function(cb) { cb(data); });
        }
    }
};

// 使用示例
EventBus.on('player:added', function(player) {
    ChartModule.updateChart();
});
```

## 生命周期

1. **初始化阶段**
   - 加载 Chart.js
   - 创建面板 DOM
   - 恢复用户偏好
   - 绑定事件监听

2. **运行阶段**
   - 响应用户操作
   - 更新图表
   - 缓存数据

3. **销毁阶段**
   - 保存用户偏好
   - 清理事件监听
   - 释放资源
