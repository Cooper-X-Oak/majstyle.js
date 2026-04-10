# 算法设计文档

**状态**: 🔵 实施中  
**版本**: v1.1  
**最后更新**: 2026-04-10  
**负责人**: sub-agent-algorithm

---

## 概述

本文档固化项目核心算法，作为 sub-agent-algorithm 的权威参考。所有算法改动须先更新此文档，再修改代码。

### 核心架构约束

**算法参数不得硬编码在 `.js` 文件中。** 所有数值参数（归一化范围、权重、阈值、置信度映射）必须定义在 `src/config/analysis-config.json`，算法文件只负责读取和计算逻辑。

这条约束的目的：调参 = 改 JSON，不触碰算法代码，迭代风险最小。

---

## 1. 数据流总览

```
玩家 account_id
  → getPlayerStats()        基础数据（段位 levelId）
  → getPlayerExtendedStats() 扩展统计（50+ 字段）
  → getBaseline(levelId)    段位基准数据
  → analyzeStyle(stats, baseline)   → StyleResult
  → generateAdvice(analysis, stats) → AdviceResult
  → createPlayerInfoUI(...)         → DOM 渲染
```

---

## 2. 风格分析算法（style-analyzer.js）

### 2.1 核心指标计算

```
进攻意愿 = 立直率(%) + 副露率(%)
基准进攻意愿 = baseline.立直率 + baseline.副露率

进攻效率 = (和牌率 / 进攻意愿) × 100
基准进攻效率 = (baseline.和牌率 / 基准进攻意愿) × 100

偏差计算（相对段位基准）:
  进攻意愿偏差 = 进攻意愿 - 基准进攻意愿
  进攻效率偏差 = 进攻效率 - 基准进攻效率
  放铳率偏差   = 放铳率 - baseline.放铳率
  打点偏差     = 平均打点 - baseline.平均打点
```

### 2.2 四维分类

| 维度 | 分类 | 判断条件（来自 config 阈值） |
|------|------|--------------------------|
| 意愿类型 | 高/中/低 | 进攻意愿偏差 > 高阈值 / < 低阈值 |
| 效率类型 | 高/中/低 | 进攻效率偏差 > 高阈值 / < 低阈值 |
| 防守类型 | 铁壁/正常/漏勺 | 放铳率偏差 < 铁壁阈值 / > 漏勺阈值 |
| 打点类型 | 大牌/均衡/速和 | 打点偏差 > 大牌阈值 / < 速和阈值 |

### 2.3 称号映射（意愿 × 防守 → 9 种）

```
高铁壁 → 钢铁战士    高正常 → 狂战士    高漏勺 → 自爆兵
中铁壁 → 忍者        中正常 → 上班族    中漏勺 → 赌徒
低铁壁 → 乌龟        低正常 → 摆烂人    低漏勺 → 送分童子
```

### 2.4 标签系统（11 种，可叠加）

| 标签 | 触发条件 |
|------|---------|
| 精准狙击 | 效率类型 === '高' |
| 速攻流 | 副露率 > 38% |
| 立直狂 | 立直率 > 25% |
| 大牌猎人 | 打点类型 === '大牌' |
| 对攻狂魔 | 追立率 > config.追立率.狂魔 |
| 慢热型 | 意愿类型 === '低' |
| 铁壁 | 防守类型 === '铁壁' |
| 漏勺 | 防守类型 === '漏勺' |
| 先制王 | 先制率 > config.先制率.先制王 |
| 好型立直 | 立直好型 > config.立直好型.好型 |
| 赌博立直 | 立直好型 < config.立直好型.赌博 且 立直率 > 20% |

---

## 3. 危险度计算算法（advice-generator.js → calculateDangerLevel）

### 3.1 10 维度加权评分

权重来自 `analysis-config.json → danger_weights`。

| # | 维度 | 权重 | 方向 | 归一化范围（来自 config） |
|---|------|------|------|--------------------------|
| 1 | 净打点效率 | 30% | 正向 | [-1000, 2000] |
| 2 | 默听率 | 15% | 正向 | [0, 0.20] |
| 3 | 立直收支 | 20% | 正向 | [-1000, 3000] |
| 4 | 平均铳点 | 5% | 反向 | [4000, 6000] |
| 5 | 被炸率 | 10% | 反向 | [0, 0.10] |
| 6 | 和了巡数 | 10% | 反向 | [9, 14] |
| 7 | 立直后和牌率 | 5% | 正向 | [0, 0.50] |
| 8 | 副露后和牌率 | 3% | 正向 | [0, 0.40] |
| 9 | 和牌率 | 2% | 正向 | [0.18, 0.26] |
| 10 | 样本量置信度 | 收缩系数 | — | 见 3.3 |

所有维度统一使用 `normalizeScore`，反向维度通过 `inverted: true` 标记在 config 中声明，不在代码中写 `10 - score`。

### 3.2 归一化函数

```
normalizeScore(value, min, max, inverted=false):
  normalized = clamp((value - min) / (max - min), 0, 1)
  if inverted: normalized = 1 - normalized
  return normalized × 10   // 输出 0-10
```

### 3.3 置信度收缩

置信度映射来自 `analysis-config.json → confidence_thresholds`。

| 样本量 | 置信度系数 |
|--------|-----------|
| ≥ 400 局 | 1.00 |
| ≥ 200 局 | 0.95 |
| ≥ 100 局 | 0.90 |
| ≥ 50 局  | 0.80 |
| < 50 局  | 0.70 |

**收缩公式**（向中性值 5 收缩，而非直接缩放）：

```
dangerLevel = 5 + (rawScore - 5) × confidenceMultiplier
```

这样低样本玩家的分数趋向 5（未知），而非趋向 0（错误地判断为安全）。

### 3.4 最终危险度

```
dangerLevel = round(clamp(5 + (rawScore - 5) × confidence, 0, 10))
```

| 分数 | 图标 | 标签 |
|------|------|------|
| 9-10 | ⚠️ | 极度危险 |
| 7-8  | ⚡ | 较为危险 |
| 5-6  | ➡️ | 正常水平 |
| 3-4  | ✓  | 威胁较小 |
| 0-2  | 🎯 | 送分目标 |

---

## 4. 玩家原型检测算法（archetype-detector.js）

### 4.1 匹配度计算

```
对每个原型的每个条件:
  met = 条件是否满足（支持 >=、<=、>、< 四种操作符）
  deviation = |value - threshold| / threshold

  if met:
    score += 1 + min(deviation, 0.5)   // 超出越多得分越高，上限 +0.5
  else:
    score -= deviation                  // 未满足则扣分

必须满足所有条件（metConditions == totalConditions）才返回 score，否则返回 0
```

### 4.2 百分比字段自动转换

字段 `立直率`、`副露率`、`放铳率`、`和牌率` 在比较前自动 × 100（原始值为小数）。

### 4.3 原型选择

所有匹配度 > 0 的原型按 score 降序排列，取第一个。

---

## 5. 策略建议生成算法（advice-generator.js → generateStrategies）

### 5.1 建议来源优先级

1. **玩家原型建议**（优先级最高，来自 config.archetypes[key].advice）
2. **综合实力**：净打点效率 > 500 或 < 0
3. **隐蔽性**：默听率 > 12%（无原型时触发）
4. **速度**：和了巡数 < 11 或 > 13（无原型时触发）
5. **立直质量**：立直收支 > 2000 或 < 0（无原型时触发）
6. **副露质量**：副露后和牌率 > 35% 或 < 25%（无原型时触发）
7. **防守能力**：放铳率 > 16% 或（< 13% 且平均铳点 < 5000）（无原型时触发）
8. **被炸率**：被炸率 > 10%

### 5.2 优先级计算

```
calculatePriority(deviation, minThreshold, maxThreshold):
  normalized = clamp((deviation - minThreshold) / (maxThreshold - minThreshold), 0, 1)
  return round(normalized × 10)
```

### 5.3 去重与截断

- 按优先级降序排列
- 相同建议文本去重
- 最多输出 8 条建议

---

## 6. 综合实力子维度评估

### 6.1 进攻强度（strength-evaluator.js → evaluateAttackStrength）

子维度：立直进攻、副露进攻、速度、打点（各 0-10 分）  
总分 = 加权平均 × 10（0-100）

### 6.2 防守强度（strength-evaluator.js → evaluateDefenseStrength）

子维度：放铳控制、大牌防守、隐蔽性、立直防守（各 0-10 分）  
总分 = 加权平均 × 10（0-100）

---

## 7. 关键阈值来源

所有阈值均从 `config-loader.js` 动态加载，**不硬编码在算法文件中**：

- 风格分类阈值：`getStyleThresholds()`
- 危险度权重：`getDangerWeights()`
- 危险度归一化范围：`getDangerNormalization()`（待新增）
- 原型定义：`loadConfig().archetypes`
- 段位基准：`loadConfig().level_baseline[levelId]`

---

## 8. 已知问题（待修复）

> 本节记录分析发现的 bug，修复后移至 CHANGELOG。

### BUG-01：危险度 4 个维度缺少 clamp（严重）

**位置**: `advice-generator.js → calculateDangerLevel`，维度 2、5、7、8

**现状**: 这 4 个维度用手写公式（`× 50`、`10 - × 100`、`× 20`、`× 25`），没有 clamp，极端玩家会产生 < 0 或 > 10 的分数，破坏权重体系。

**根因**: 这些公式是硬编码的，没有走统一的 `normalizeScore`。

**修复方向**: 将这 4 个维度的归一化范围迁移到 `analysis-config.json → danger_normalization`，统一用 `normalizeScore + inverted` 处理，彻底消除手写公式。

---

### BUG-02：进攻效率除以零（严重）

**位置**: `style-analyzer.js:21`

**现状**: `进攻效率 = (和牌率 / 进攻意愿) × 100`，当 `立直率 + 副露率 = 0` 时产生 `Infinity`，导致称号/标签全部变 NaN。

**修复方向**: 加守卫 `进攻意愿 > 0 ? ... : 0`，同时在 config 中记录"进攻意愿为 0 时的默认效率值"。

---

### BUG-03：置信度乘数语义错误（严重）

**位置**: `advice-generator.js → calculateDangerLevel`

**现状**: `dangerLevel = rawScore × confidenceMultiplier`，低样本玩家分数被直接打折，系统性低估危险度（50 局的 8 分 → 6.4 分）。

**修复方向**: 改为向中性值收缩：`dangerLevel = 5 + (rawScore - 5) × confidence`。

---

### BUG-04：explainArchetypeAdvice 硬编码原型条件（中等）

**位置**: `advice-generator.js:573`

**现状**: 函数内有一份 `ARCHETYPES_LOCAL`，用旧格式（`{min, max}` 对象）重复定义了原型条件，与 config 中的 `{field, operator, value}` 数组格式不一致，config 更新后解释文本不会同步。

**修复方向**: 删除 `ARCHETYPES_LOCAL`，直接从 `loadConfig().archetypes` 读取条件，按 `{field, operator, value}` 格式生成解释文本。

---

## 9. 修复计划

### 修复顺序

```
BUG-01 + BUG-02 + BUG-03  →  config 扩展  →  代码修改  →  构建验证  →  推送
BUG-04                     →  单独 PR（影响范围小，不阻塞上线）
```

### Step 1：扩展 analysis-config.json

新增 `danger_normalization` 节点，把 BUG-01 的 4 个手写公式参数化：

```json
"danger_normalization": {
  "净打点效率":   { "min": -1000, "max": 2000,  "inverted": false },
  "默听率":       { "min": 0,     "max": 0.20,   "inverted": false },
  "立直收支":     { "min": -1000, "max": 3000,   "inverted": false },
  "平均铳点":     { "min": 4000,  "max": 6000,   "inverted": true  },
  "被炸率":       { "min": 0,     "max": 0.10,   "inverted": true  },
  "和了巡数":     { "min": 9,     "max": 14,     "inverted": true  },
  "立直后和牌率": { "min": 0,     "max": 0.50,   "inverted": false },
  "副露后和牌率": { "min": 0,     "max": 0.40,   "inverted": false },
  "和牌率":       { "min": 0.18,  "max": 0.26,   "inverted": false }
}
```

同时在 `config-loader.js` 新增 `getDangerNormalization()` 导出函数。

### Step 2：修改 advice-generator.js

- `calculateDangerLevel`：删除所有手写公式，改为循环读取 `danger_normalization`，统一调用 `normalizeScore(value, norm.min, norm.max, norm.inverted)`
- 置信度公式：`5 + (rawScore - 5) × confidence`

### Step 3：修改 style-analyzer.js

- 进攻效率计算加零除守卫

### Step 4：构建 + 手动验证

```bash
npm run build
```

验证清单：
- 极端玩家（默听率 25%）→ 危险度维度分 ≤ 10
- 极端玩家（被炸率 15%）→ 危险度维度分 ≥ 0
- 50 局样本玩家 → 危险度向 5 收缩，不是直接打折
- 立直率 + 副露率 = 0 → 称号正常，不出现 NaN

### Step 5：版本 + 推送

```
2.2.0-beta.2 → 2.2.1
git commit -m "fix: danger score clamp + divide-by-zero + confidence shrinkage"
git tag v2.2.1 && npm run push
```

---

## 10. 算法改动规范

1. 改动前先更新本文档对应章节
2. 阈值和归一化范围只改 config，不改算法文件
3. 新增危险度维度须同步更新第 3.1 节权重表（总权重须保持 100%）和 `danger_normalization`
4. 新增原型须在 config.archetypes 中定义，不在代码中硬编码条件
5. 反向维度用 `inverted: true` 在 config 中声明，不在代码中写 `10 - score`
