# 开发指南

本文档面向希望了解项目技术实现或参与贡献的开发者。

## 项目概述

- **项目名称**：雀魂金玉四麻风格分析助手
- **版本**：v2.1.0
- **开发工具**：Claude Code
- **架构**：模块化（14个源文件）+ Rollup 构建
- **技术栈**：ES6+ JavaScript（源码）→ ES5（输出）、Tampermonkey GM API

## 项目结构

```
majstyle.js/
├── README.md                                    # 项目主文档
├── CHANGELOG.md                                 # 版本历史
├── LICENSE                                      # MIT 协议
├── package.json                                 # 依赖和构建脚本
├── rollup.config.js                             # Rollup 配置
├── babel.config.js                              # Babel ES5 转译配置
├── src/                                         # 源代码（模块化）
│   ├── config/
│   │   ├── constants.js                         # 常量、基准数据、阈值
│   │   └── metadata.js                          # Userscript 元数据
│   ├── api/
│   │   ├── client.js                            # GM_xmlhttpRequest 封装
│   │   └── amae-koromo.js                       # 牌谱屋 API
│   ├── analysis/
│   │   ├── style-analyzer.js                    # 风格分析算法
│   │   └── advice-generator.js                  # 策略建议
│   ├── ui/
│   │   ├── color-utils.js                       # 颜色工具
│   │   ├── player-info-card.js                  # 信息卡片组件
│   │   └── ui-manager.js                        # UI 管理
│   ├── game/
│   │   ├── game-bridge.js                       # 游戏对象访问
│   │   └── player-processor.js                  # 玩家处理流程
│   └── main.js                                  # 主入口
├── dist/                                        # 构建输出
│   └── 雀魂金玉四麻风格分析助手-v2.0.0.user.js  # 打包后的脚本
├── docs/                                        # 文档目录
│   ├── installation.md                          # 安装指南
│   ├── usage.md                                 # 使用说明
│   └── development.md                           # 开发指南（本文件）
├── archive/                                     # 历史版本归档
└── openspec/                                    # 规范管理
```

## 开发环境搭建

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
# 启动 watch 模式（自动重新构建）
npm run watch

# 或使用别名
npm run dev
```

### 3. 生产构建

```bash
npm run build
```

构建输出：`dist/雀魂金玉四麻风格分析助手-v2.0.0.user.js`

## 模块化架构

### 模块划分

项目采用职责分离的模块化架构：

#### 1. 配置模块 (src/config/)

- **constants.js**：段位基准数据、分类阈值、getBaseline 函数
- **metadata.js**：Userscript 元数据配置

#### 2. API模块 (src/api/)

- **client.js**：封装 GM_xmlhttpRequest 为 Promise 接口
- **amae-koromo.js**：牌谱屋 API 调用（getPlayerStats, getPlayerExtendedStats）

#### 3. 分析模块 (src/analysis/)

- **style-analyzer.js**：核心风格分析算法（analyzeStyle）
- **advice-generator.js**：策略建议生成（generateAdvice）

#### 4. UI模块 (src/ui/)

- **color-utils.js**：偏差值颜色计算（getColor）
- **player-info-card.js**：玩家信息卡片渲染（createPlayerInfoUI, createNoDataUI）
- **ui-manager.js**：UI 管理（clearAllPlayerInfoUI, resetPlayerUICounter）

#### 5. 游戏桥接模块 (src/game/)

- **game-bridge.js**：游戏对象访问（getGameWindow, getPlayerDatas, getMyAccountId）
- **player-processor.js**：玩家处理流程（processPlayer, printAnalysis）

#### 6. 主入口 (src/main.js)

- IIFE 包装
- 主事件循环（2秒延迟启动，1秒轮询间隔）
- 玩家变化检测
- 并行处理4个玩家

### 模块依赖关系

```
main.js
  ├─ game/game-bridge.js
  ├─ game/player-processor.js
  │   ├─ api/amae-koromo.js
  │   │   └─ api/client.js
  │   ├─ config/constants.js
  │   ├─ analysis/style-analyzer.js
  │   │   └─ config/constants.js
  │   ├─ analysis/advice-generator.js
  │   └─ ui/player-info-card.js
  │       └─ ui/color-utils.js
  └─ ui/ui-manager.js
```

## 技术架构

### 核心技术点

#### 1. 跨域请求（GM_xmlhttpRequest）

使用 Tampermonkey 的 `GM_xmlhttpRequest` API 绕过浏览器的 CORS 限制：

```javascript
// src/api/client.js
export function gmRequest(options) {
    return new Promise(function(resolve, reject) {
        GM_xmlhttpRequest({
            method: options.method || 'GET',
            url: options.url,
            timeout: options.timeout || 10000,
            onload: function(response) {
                if (response.status === 200) {
                    resolve(JSON.parse(response.responseText));
                } else {
                    reject('HTTP ' + response.status);
                }
            },
            onerror: function() { reject('网络错误'); },
            ontimeout: function() { reject('请求超时'); }
        });
    });
}
```

#### 2. 游戏对象访问（unsafeWindow）

通过 `unsafeWindow` 访问页面的真实 window 对象：

```javascript
// src/game/game-bridge.js
export function getGameWindow() {
    return (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
}

export function getPlayerDatas() {
    var gameWindow = getGameWindow();
    try {
        return gameWindow.view.DesktopMgr.Inst.player_datas;
    } catch(e) {
        return null;
    }
}
```

**关键点**：

- Tampermonkey 默认在沙箱环境运行
- 必须使用 `unsafeWindow` 才能访问游戏对象
- 需要在脚本头部声明 `@grant unsafeWindow`

#### 3. 风格分析算法

```javascript
// src/analysis/style-analyzer.js
export function analyzeStyle(stats, baseline) {
    // 1. 计算进攻意愿
    var 进攻意愿 = 立直率 + 副露率;
    var 基准进攻意愿 = baseline.立直率 + baseline.副露率;

    // 2. 计算进攻效率
    var 进攻效率 = (和牌率 / 进攻意愿) * 100;
    var 基准进攻效率 = (baseline.和牌率 / 基准进攻意愿) * 100;

    // 3. 计算偏差
    var 进攻意愿偏差 = 进攻意愿 - 基准进攻意愿;
    var 进攻效率偏差 = 进攻效率 - 基准进攻效率;
    var 放铳率偏差 = 放铳率 - baseline.放铳率;
    var 打点偏差 = 平均打点 - baseline.平均打点;

    // 4. 分类
    if (进攻意愿偏差 > 1.5) 意愿类型 = '高';
    else if (进攻意愿偏差 < -1.5) 意愿类型 = '低';
    else 意愿类型 = '中';

    if (放铳率偏差 < -2.0) 防守类型 = '铁壁';
    else if (放铳率偏差 > 2.0) 防守类型 = '漏勺';
    else 防守类型 = '正常';

    // 5. 称号映射
    var 称号映射 = {
        '高铁壁': '钢铁战士',
        '高正常': '狂战士',
        // ...
    };
    var 主称号 = 称号映射[意愿类型 + 防守类型];

    return { 主称号, 标签, 数据, 偏差 };
}
```

#### 4. 动态 UI 创建

```javascript
function createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, nickname, isSelf) {
    var container = document.createElement('div');
    container.id = 'player-style-' + index;
    container.style.cssText = 'position: fixed; background: rgba(0,0,0,0.6); ...';

    // 位置分配
    if (isSelf) {
        container.style.cssText += 'bottom: 120px; left: 20px;';
    } else {
        var otherPositions = [
            'top: 120px; right: 20px;',
            'top: 20px; left: 75%; transform: translateX(-50%);',
            'top: 120px; left: 20px;'
        ];
        container.style.cssText += otherPositions[window.playerUICounter % 3];
        window.playerUICounter++;
    }

    // 颜色编码
    function getColor(deviation, threshold) {
        var absValue = Math.abs(deviation);
        if (deviation > 0) {
            if (absValue > threshold * 2) return '#ff4444';
            if (absValue > threshold) return '#ff6b6b';
            return '#ff9999';
        } else if (deviation < 0) {
            if (absValue > threshold * 2) return '#44ff44';
            if (absValue > threshold) return '#51cf66';
            return '#99ff99';
        }
        return '#aaa';
    }

    // 构建 HTML
    var html = '...';
    container.innerHTML = html;
    document.body.appendChild(container);
}
```

#### 5. ES5 兼容性

**不能使用的 ES6+ 语法**：

```javascript
// ❌ 不能用
const data = await fetch();
let arr = [1, 2, 3];
const fn = () => {};
`template ${string}`;
arr.map(x => x * 2);

// ✅ 必须用
var data;
var arr = [1, 2, 3];
var fn = function() {};
'string' + variable;
arr.map(function(x) { return x * 2; });
```

## 数据流程

### 1. 玩家检测

```
游戏加载
  ↓
定时检测（1秒/次）
  ↓
读取 gameWindow.view.DesktopMgr.Inst.player_datas
  ↓
提取玩家 ID 列表
  ↓
对比上次检测结果
  ↓
如果有变化，触发分析
```

### 2. 数据获取

```
获取玩家 ID
  ↓
请求 player_stats API（基础数据）
  ↓
获取段位信息
  ↓
请求 player_extended_stats API（扩展数据）
  ↓
获取 50+ 统计字段
  ↓
检查数据完整性（至少 50 局）
```

### 3. 风格分析

```
获取统计数据
  ↓
根据段位选择基准数据
  ↓
计算进攻意愿、进攻效率
  ↓
计算各项偏差值
  ↓
分类（意愿类型、防守类型）
  ↓
映射主称号
  ↓
生成特征标签
  ↓
生成策略建议
```

### 4. UI 显示

```
分析完成
  ↓
创建信息框 DOM 元素
  ↓
分配显示位置
  ↓
应用颜色编码
  ↓
添加到页面
  ↓
控制台输出详细信息
```

## API 文档

### 牌谱屋 API

#### 基础统计 API

```
GET https://5-data.amae-koromo.com/api/v2/pl4/player_stats/{account_id}/{start_time}/{end_time}?mode=12.9&tag=492541
```

**参数**：

- `account_id`: 玩家 ID
- `start_time`: 开始时间戳（毫秒）
- `end_time`: 结束时间戳（毫秒）
- `mode`: 12.9（金之间四麻）
- `tag`: 492541（玉之间）

**响应示例**：

```json
{
  "account_id": 14766635,
  "nickname": "玩家名",
  "level": {
    "id": 10403,
    "score": 1693
  }
}
```

#### 扩展统计 API

```
GET https://5-data.amae-koromo.com/api/v2/pl4/player_extended_stats/{account_id}/{start_time}/{end_time}?mode=12.9&tag=492541
```

**响应示例**：

```json
{
  "count": 1605,
  "立直率": 0.1919,
  "副露率": 0.3221,
  "和牌率": 0.2268,
  "放铳率": 0.1408,
  "平均打点": 6725,
  "追立率": 0.2110,
  "先制率": 0.7890,
  "立直好型": 0.7955
}
```

## 开发环境搭建

### 1. 安装 Tampermonkey

参考 [安装指南](installation.md)

### 2. 创建开发脚本

1. 打开 Tampermonkey 管理面板
2. 创建新脚本
3. 复制主脚本内容
4. 修改脚本名称（添加 -dev 后缀）
5. 开始开发

### 3. 调试技巧

#### 使用控制台

```javascript
console.log('调试信息:', data);
console.error('错误信息:', error);
```

#### 查看游戏对象

```javascript
// 在控制台执行
console.log(unsafeWindow.view.DesktopMgr.Inst.player_datas);
console.log(unsafeWindow.GameMgr.Inst.account_id);
```

#### 测试 API

```javascript
// 在控制台执行
GM_xmlhttpRequest({
    method: 'GET',
    url: 'https://5-data.amae-koromo.com/api/v2/pl4/player_stats/14766635/1262304000000/' + Date.now() + '?mode=12.9&tag=492541',
    onload: function(response) {
        console.log(JSON.parse(response.responseText));
    }
});
```

## 贡献指南

### 代码规范

1. **使用 ES5 语法**：确保兼容性
2. **添加注释**：关键逻辑要有注释
3. **保持简洁**：避免过度工程化
4. **测试充分**：在真实环境测试

### 提交流程

1. Fork 项目
2. 创建功能分支（`git checkout -b feature/新功能`）
3. 提交更改（`git commit -m '添加新功能'`）
4. 推送到分支（`git push origin feature/新功能`）
5. 创建 Pull Request

### 版本发布

1. 更新版本号（脚本头部 `@version`）
2. 更新 CHANGELOG.md
3. 更新文件名（添加版本号）
4. 测试功能
5. 创建 Git tag
6. 发布到 GitHub Releases

## 常见问题

### Q: 如何添加新的段位基准数据？

A: 修改 `LEVEL_BASELINE` 对象：

```javascript
var LEVEL_BASELINE = {
    10301: { name: '士3', 立直率: 19.66, ... },
    // 添加新段位
    10801: { name: '新段位', 立直率: 18.00, ... }
};
```

### Q: 如何修改称号映射？

A: 修改 `称号映射` 对象：

```javascript
var 称号映射 = {
    '高铁壁': '钢铁战士',
    '高正常': '狂战士',
    // 修改或添加新称号
    '高漏勺': '新称号'
};
```

### Q: 如何调整阈值？

A: 修改 `THRESHOLDS` 对象：

```javascript
var THRESHOLDS = {
    进攻意愿: { 高: 1.5, 低: -1.5 },  // 调整这些值
    进攻效率: { 高: 2.0, 低: -2.0 },
    // ...
};
```

### Q: 如何添加新的特征标签？

A: 在 `analyzeStyle` 函数中添加判断逻辑：

```javascript
if (某个条件) 标签.push('新标签');
```

## 性能优化

### 当前性能指标

- 启动时间：2-3秒
- 检测频率：1秒/次
- API 响应：200-500ms
- 总加载时间：3-5秒

### 优化建议

1. **本地缓存**：缓存已查询的玩家数据
2. **批量请求**：合并多个 API 请求
3. **预加载**：预加载常见对手数据
4. **减少检测频率**：在非对局时降低检测频率

## 安全性考虑

### 合规性原则

1. **不修改游戏数据**：只读取，不写入
2. **不拦截通信**：不解析 WebSocket
3. **不破解协议**：不触碰 protobuf
4. **使用公开 API**：只调用第三方公开接口

### 隐私保护

1. **不收集数据**：不上传任何用户信息
2. **不存储数据**：不在本地存储敏感信息
3. **透明开源**：代码完全公开可审查

## 测试

### 测试环境

- 浏览器：Chrome/Edge/Firefox
- 游戏版本：雀魂网页版
- 测试段位：金之间、玉之间
- 测试模式：四人麻将

### 测试用例

1. **人机对局测试**：验证电脑玩家识别
2. **真人对局测试**：验证数据获取和分析
3. **UI 显示测试**：验证信息框位置和样式
4. **退出房间测试**：验证信息框清除
5. **性能测试**：验证加载速度

## 未来展望

### 可能的改进方向

#### 功能扩展

- [ ] 支持三人麻将
- [ ] 支持更多段位
- [ ] 添加历史对局记录
- [ ] 添加对手数据库

#### UI 优化

- [ ] 可拖拽信息框
- [ ] 可折叠/展开详细数据
- [ ] 添加设置面板
- [ ] 支持主题切换

#### 性能优化

- [ ] 本地缓存玩家数据
- [ ] 批量请求 API
- [ ] 预加载常见对手数据

## 技术支持

如有技术问题，请：

1. 查看浏览器控制台的错误信息
2. 检查 API 响应状态
3. 提交 Issue 并附上详细的错误信息和环境信息

---

感谢你对项目的关注和贡献！
