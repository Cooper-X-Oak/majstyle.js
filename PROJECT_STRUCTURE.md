# 项目结构说明

本文档详细说明 majstyle.js 项目的目录结构、构建系统和开发工作流。

## 目录结构

```
majstyle.js/
├── src/                           # 源代码（ES6+ 模块）
│   ├── main.js                    # 入口文件
│   ├── game/                      # 游戏对象访问
│   ├── api/                       # API 客户端
│   ├── analysis/                  # 风格分析逻辑
│   ├── ui/                        # UI 渲染
│   ├── config/                    # 配置和常量
│   └── utils/                     # 工具函数
│
├── dist/                          # 构建输出（单文件 .user.js）
│
├── docs/                          # 项目文档
│   ├── user/                      # 用户文档（安装、使用指南）
│   ├── development/               # 开发文档（实现路线图、修复记录）
│   ├── api/                       # API 文档（数据结构、字段分析）
│   └── game/                      # 游戏对象文档
│
├── tools/                         # 开发工具
│   ├── api-explorer.html          # API 数据探索工具
│   └── phase1-verification.js     # 验证脚本
│
├── archive/                       # 归档的旧版本
│
├── node_modules/                  # 开发依赖包（自动生成，不提交 Git）
│
├── .git/                          # Git 版本控制
├── .claude/                       # Claude 会话数据
├── .gitignore                     # Git 忽略规则
│
├── package.json                   # 项目配置和依赖声明
├── package-lock.json              # 依赖版本锁定
├── rollup.config.js               # Rollup 打包配置
├── babel.config.cjs               # Babel 转译配置
│
├── README.md                      # 项目说明
├── CLAUDE.md                      # Claude 开发指南
├── CHANGELOG.md                   # 变更日志
├── QUICKSTART.md                  # 快速开始
├── VERSION.md                     # 版本说明
├── PROJECT_STRUCTURE.md           # 本文档
└── LICENSE                        # 许可证
```

## node_modules 详解

### 什么是 node_modules？

`node_modules` 是 **Node.js 项目的依赖包存储目录**，包含项目构建所需的所有第三方库和工具。

### 为什么需要它？

虽然这是一个 Tampermonkey 用户脚本项目，但使用了现代化的开发工具链：

1. **模块化开发**：`src/` 目录下有多个 ES6+ 模块文件
2. **打包工具**：Rollup 将多个模块合并成单个 `.user.js` 文件
3. **代码转译**：Babel 将 ES6+ 代码转换为 ES5（兼容 IE11）
4. **依赖解析**：自动处理模块之间的依赖关系

这些工具都存储在 `node_modules` 中。

### 当前依赖包

根据 `package.json`，项目使用的开发依赖：

```json
{
  "@babel/core": "^7.24.0",                    // Babel 核心引擎
  "@babel/preset-env": "^7.24.0",              // Babel 预设（ES6+ → ES5）
  "@rollup/plugin-babel": "^6.0.4",            // Rollup 的 Babel 插件
  "@rollup/plugin-node-resolve": "^15.2.3",    // 解析 node_modules 中的模块
  "rollup": "^4.12.0"                          // Rollup 打包工具
}
```

这些依赖包及其子依赖共占用约 **30MB** 空间，包含数千个文件。

### 重要特性

1. **自动生成**：运行 `npm install` 时自动创建
2. **可以删除**：删除后运行 `npm install` 即可重新生成
3. **不提交到 Git**：已在 `.gitignore` 中排除
4. **只在开发时需要**：最终生成的 `dist/*.user.js` 不依赖它
5. **跨平台一致**：`package-lock.json` 确保所有开发者使用相同版本

### 工作流程

```
开发时：
┌─────────────────────────────────────────────────────────────┐
│ src/*.js (ES6+ 模块)                                        │
│   ↓                                                          │
│ Rollup 打包 (使用 node_modules/rollup)                      │
│   ↓                                                          │
│ Babel 转译 (使用 node_modules/@babel/*)                     │
│   ↓                                                          │
│ dist/*.user.js (单文件 ES5 脚本)                            │
└─────────────────────────────────────────────────────────────┘

使用时：
┌─────────────────────────────────────────────────────────────┐
│ dist/*.user.js                                               │
│   ↓                                                          │
│ 安装到 Tampermonkey                                          │
│   ↓                                                          │
│ 在浏览器中运行（不需要 node_modules）                       │
└─────────────────────────────────────────────────────────────┘
```

## 开发工作流

### 1. 安装依赖

首次克隆项目或更新依赖时运行：

```bash
npm install
```

这会：
- 读取 `package.json` 中的依赖声明
- 下载所有依赖包到 `node_modules/`
- 生成 `package-lock.json` 锁定版本

### 2. 开发模式

开发时使用自动重新构建：

```bash
npm run dev
# 或
npm run watch
```

这会：
- 监听 `src/` 目录的文件变化
- 自动重新构建 `dist/*.user.js`
- 无需手动运行构建命令

### 3. 生产构建

发布新版本前运行：

```bash
npm run build
```

这会：
- 读取 `src/main.js` 作为入口
- 使用 Rollup 打包所有模块
- 使用 Babel 转译为 ES5
- 生成 `dist/雀魂金玉四麻风格分析助手-v{version}.user.js`

### 4. 构建流程详解

```
src/main.js (入口)
  ↓
导入其他模块 (game/, api/, analysis/, ui/, config/, utils/)
  ↓
Rollup 解析依赖树
  ↓
合并所有模块到单个文件
  ↓
Babel 转译 ES6+ → ES5
  ↓
添加 Userscript 元数据头
  ↓
输出到 dist/
```

## 常见问题

### Q: node_modules 是什么？

A: 开发工具的存储位置，包含 Rollup、Babel 等构建工具。用户不需要关心它的内容。

### Q: 为什么有这么多文档？

A: 项目经历了多个开发阶段，文档记录了实现过程、API 分析、问题修复等。现在已按主题分类到 `docs/` 的子目录中。

### Q: 如何找到特定功能的代码？

A: 参考 `CLAUDE.md` 中的"架构"部分，了解模块结构：
- 游戏对象访问 → `src/game/`
- API 调用 → `src/api/`
- 风格分析 → `src/analysis/`
- UI 渲染 → `src/ui/`

### Q: 如何更新版本号？

A: 参考 `docs/development/VERSION_MANAGEMENT.md`，需要同时修改：
1. `rollup.config.js` - metadata.version (line 28) 和 output.file (line 41)
2. `package.json` - version 字段 (line 3)

### Q: 为什么构建输出是单个文件？

A: Tampermonkey 用户脚本必须是单个 `.user.js` 文件。Rollup 将多个模块打包成单文件，方便安装和分发。

### Q: 为什么要转译为 ES5？

A: 雀魂游戏客户端使用较老的浏览器引擎，需要兼容 IE11。Babel 将现代 JavaScript 转换为旧版本语法。

## 项目特点

### 模块化开发

- 源代码按功能分模块（game, api, analysis, ui, config, utils）
- 使用 ES6 模块语法（import/export）
- 构建时自动合并为单文件

### 现代化工具链

- **Rollup**：高效的模块打包工具
- **Babel**：JavaScript 转译器
- **npm scripts**：自动化构建流程

### 兼容性目标

- **目标环境**：IE11 / ES5
- **转译策略**：Babel preset-env
- **代码风格**：使用 `var` 和 `function()` 语法

### 单文件输出

- **输入**：多个 ES6+ 模块
- **输出**：单个 ES5 兼容的 `.user.js` 文件
- **元数据**：自动生成 Userscript 头部

### 无运行时依赖

- **开发依赖**：只在构建时使用（Rollup, Babel）
- **运行时依赖**：无（所有代码都打包到输出文件中）
- **外部依赖**：仅调用 Amae Koromo 公开 API

## 文档导航

### 用户文档

- **安装指南**：`docs/user/installation.md`
- **使用指南**：`docs/user/usage.md`（中英文版本）

### 开发文档

- **开发指南**：`docs/development/development.md`
- **实现路线图**：`docs/development/IMPLEMENTATION_ROADMAP.md`
- **版本管理**：`docs/development/VERSION_MANAGEMENT.md`
- **修复记录**：`docs/development/FIXED.md`, `FIXES_APPLIED.md`

### API 文档

- **API 数据结构**：`docs/api/API_DATA_STRUCTURE.md`
- **API 字段分析**：`docs/api/API_FIELDS_ANALYSIS.md`
- **CORS 问题**：`docs/api/CORS_ISSUE.md`

### 游戏对象文档

- **游戏对象结构**：`docs/game/GAME_OBJECT_STRUCTURE.md`

### 核心文档

- **项目说明**：`README.md`
- **Claude 开发指南**：`CLAUDE.md`
- **变更日志**：`CHANGELOG.md`
- **快速开始**：`QUICKSTART.md`
- **版本说明**：`VERSION.md`

## 总结

- **node_modules** 是开发工具的存储位置，不是项目的一部分
- **用户不需要关心它的内容**，只需要知道运行 `npm install` 会创建它
- **它让项目可以使用现代化的开发工具**，同时生成兼容旧浏览器的代码
- **最终输出是单个 .user.js 文件**，可以直接安装到 Tampermonkey
- **文档已按主题分类**，方便查找和维护
