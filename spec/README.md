# Spec 目录使用指南

本目录是项目规范管理中心，包含提案、设计文档、进度跟踪和架构决策记录（ADR）。

## 目录结构

```
spec/
├── proposals/          # 提案阶段（待评审）
├── active/            # 活跃项目（已批准，进行中）
│   ├── designs/       # 设计文档
│   ├── progress/      # 进度跟踪
│   └── decisions/     # 架构决策记录（ADR）
└── archived/          # 已归档（已完成或已废弃）
    ├── proposals/     # 已归档的提案
    ├── designs/       # 已归档的设计
    ├── progress/      # 已归档的进度
    └── decisions/     # 历史决策记录
```

## 文档类型

### 1. 提案（Proposals）
新功能、技术方案的评审文档。

- **位置**: `proposals/`
- **命名**: `YYYYMMDD-proposal-name.md`
- **模板**: `proposals/TEMPLATE.md`
- **索引**: `proposals/index.md`

**工作流程**:
1. 创建提案 → 2. 团队评审 → 3. 批准/拒绝 → 4. 移至 active/ 或 archived/

### 2. 设计文档（Designs）
详细的技术设计、架构设计、接口设计。

- **位置**: `active/designs/`
- **命名**: `descriptive-name.md`
- **模板**: `active/designs/TEMPLATE.md`
- **索引**: `active/designs/index.md`

**状态流转**: 设计中 → 已批准 → 实施中 → 已完成 → 归档

### 3. 进度跟踪（Progress）
里程碑、任务状态、待办事项。

- **位置**: `active/progress/`
- **命名**: `phaseN-status.md` 或 `project-name-status.md`
- **模板**: `active/progress/TEMPLATE.md`
- **索引**: `active/progress/index.md`

**用途**: 跟踪 Phase 实施进度、任务清单、关键指标

### 4. 架构决策记录（ADR）
记录重要技术选择及理由。

- **位置**: `active/decisions/`
- **命名**: `XXXX-decision-title.md`（编号递增）
- **模板**: `active/decisions/TEMPLATE.md`
- **索引**: `active/decisions/index.md`

**状态**: 提议中 → 已采纳 / 已拒绝 / 已废弃 / 已替代

## 快速开始

### 创建新提案
```bash
# 1. 复制模板
cp spec/proposals/TEMPLATE.md spec/proposals/$(date +%Y%m%d)-my-proposal.md

# 2. 编辑提案内容
# 3. 更新 spec/proposals/index.md
```

### 创建新设计文档
```bash
# 1. 复制模板
cp spec/active/designs/TEMPLATE.md spec/active/designs/my-design.md

# 2. 编辑设计内容
# 3. 更新 spec/active/designs/index.md
```

### 记录架构决策
```bash
# 1. 确定下一个 ADR 编号（查看 spec/active/decisions/index.md）
# 2. 复制模板
cp spec/active/decisions/TEMPLATE.md spec/active/decisions/0005-my-decision.md

# 3. 编辑决策内容
# 4. 更新 spec/active/decisions/index.md
```

### 跟踪项目进度
```bash
# 1. 复制模板
cp spec/active/progress/TEMPLATE.md spec/active/progress/phase2-status.md

# 2. 编辑进度内容
# 3. 定期更新任务清单和关键指标
# 4. 更新 spec/active/progress/index.md
```

## 文档生命周期

### 提案流程
```
创建提案 → 评审 → 决策（批准/拒绝）→ 实施/归档
```

### 设计文档流程
```
设计中 → 评审与迭代 → 已批准 → 实施中 → 已完成 → 归档
```

### 进度跟踪流程
```
计划中 → 进行中 → 已完成 → 归档
```

### ADR 流程
```
提议中 → 已采纳/已拒绝 → （可能）已废弃/已替代
```

## 归档规则

### 何时归档
- **提案**: 已批准并实施完成，或已拒绝
- **设计文档**: 项目已完成或已废弃
- **进度跟踪**: Phase 已完成
- **ADR**: 决策已被新决策替代（标记为"已替代"）

### 如何归档
```bash
# 移动到对应的 archived/ 子目录
mv spec/proposals/20260315-my-proposal.md spec/archived/proposals/completed/
mv spec/active/designs/my-design.md spec/archived/designs/
mv spec/active/progress/phase1-status.md spec/archived/progress/
```

## 与 docs/ 的区别

| 目录 | 用途 | 受众 | 生命周期 |
|------|------|------|----------|
| **spec/** | 提案、设计、进度、决策记录 | 开发团队 | 有明确的状态流转 |
| **docs/** | 用户文档、技术参考、开发笔记 | 用户 + 开发者 | 长期维护 |

**docs/ 保留内容**:
- `docs/user/` - 用户文档（安装、使用指南）
- `docs/technical/` - 技术参考（API 结构、游戏对象）
- `docs/development/development.md` - 开发笔记
- `docs/phase1-testing-guide.md` - 测试指南

## 索引文件

每个子目录都包含 `index.md` 文件，提供快速导航和状态概览：

- `proposals/index.md` - 提案索引（按状态分类）
- `active/designs/index.md` - 设计文档索引（按状态分类）
- `active/progress/index.md` - 进度跟踪索引（按项目分类）
- `active/decisions/index.md` - ADR 索引（按状态分类）

## 最佳实践

1. **使用模板**: 始终从 TEMPLATE.md 开始，确保文档结构一致
2. **更新索引**: 创建或更新文档后，立即更新对应的 index.md
3. **状态管理**: 及时更新文档状态，反映真实进展
4. **链接引用**: 在文档间使用相对路径链接，便于导航
5. **定期归档**: 完成的文档及时归档，保持 active/ 目录整洁
6. **记录决策**: 重要技术选择必须创建 ADR，记录理由和权衡
7. **版本控制**: 所有 spec/ 文档纳入 Git 版本控制

## 常见问题

### Q: 何时创建提案 vs 直接创建设计文档？
A: 如果方案有多个选择或需要团队评审，先创建提案；如果方案已明确，可直接创建设计文档。

### Q: ADR 和设计文档有什么区别？
A: ADR 记录"为什么这样做"（决策理由），设计文档描述"怎么做"（实现细节）。

### Q: 进度文档应该多久更新一次？
A: 建议每周更新一次，或在关键里程碑完成时更新。

### Q: 已归档的文档还会修改吗？
A: 一般不会。如果需要修正错误，可以添加勘误说明；如果需要重新启动，应创建新文档。

## 相关资源

- **项目指南**: `CLAUDE.md`
- **用户文档**: `docs/user/`
- **技术参考**: `docs/technical/`
- **开发笔记**: `docs/development/development.md`

## 维护者

如有问题或建议，请联系项目维护者。
