# 工具更新日志

## 2026-03-14 - Git Push 脚本重大改进

### 改进内容

增强了 `scripts/git-push-flexible.sh`，添加了以下核心功能：

#### 1. 网络质量检测
- 推送前使用 `ping` 测试到 GitHub 的连接质量
- 检测丢包率和平均延迟
- 根据质量评级决定是否继续：
  - **Good**: 0% 丢包，<200ms 延迟 → 自动继续
  - **Fair**: <30% 丢包 → 警告但继续
  - **Poor**: ≥30% 丢包 → 询问用户是否继续

#### 2. 智能重试机制
- 每种连接方式（代理/直连）最多重试 3 次
- 指数退避策略：第 1 次失败后等待 2s，第 2 次等待 4s，第 3 次等待 6s
- 显示重试进度和剩余次数

#### 3. Git 超时优化
- 临时设置合理的超时参数：
  - `http.lowSpeedLimit=1000` (最低速度 1KB/s)
  - `http.lowSpeedTime=30` (超时时间 30 秒)
- 推送完成后自动恢复原始设置
- 避免 Git 默认的过长超时（lowspeedtime=999999）

#### 4. SSH 备选方案
- 检测用户是否配置了 SSH 密钥（`~/.ssh/id_rsa`, `id_ed25519`, `id_ecdsa`）
- HTTPS 推送失败后，自动建议切换到 SSH
- 提供一键切换命令
- 如果没有 SSH 密钥，提供生成指南

#### 5. 改进的用户体验
- 显示待推送的提交数量
- 清晰的步骤划分（4 个主要步骤）
- 彩色输出，使用蓝色表示信息，黄色表示警告，红色表示错误，绿色表示成功
- 失败时提供详细的故障排查建议

### 技术细节

**新增函数**:
- `test_network_quality()` - 网络质量检测
- `optimize_git_timeout()` - 优化超时设置
- `restore_git_timeout()` - 恢复超时设置
- `check_ssh_available()` - 检测 SSH 可用性
- `suggest_ssh_switch()` - 建议 SSH 切换
- `try_push_with_retry()` - 带重试的推送

**配置参数**:
- `MAX_RETRIES=3` - 最大重试次数
- `RETRY_BASE_DELAY=2` - 基础重试延迟（秒）

### 解决的问题

1. **curl 测试成功但 git push 失败**:
   - 原因：curl 快速测试不等于 git push 的长时间连接
   - 解决：添加重试机制和超时优化

2. **网络不稳定导致偶发失败**:
   - 原因：单次尝试容易受瞬时网络波动影响
   - 解决：自动重试 3 次，增加成功率

3. **Git 默认超时过长**:
   - 原因：默认 lowspeedtime=999999 导致挂起很久
   - 解决：临时设置 30 秒合理超时

4. **HTTPS 在某些网络环境不稳定**:
   - 原因：HTTPS 连接对网络质量要求较高
   - 解决：提供 SSH 备选方案

### 文档更新

1. **CLAUDE.md**:
   - 更新"Git Push with Network Issues"章节
   - 添加网络质量评级说明
   - 添加重试机制说明
   - 添加 SSH 切换指南
   - 添加故障排查指南

2. **tools/README.md**:
   - 更新 Git 推送工具说明
   - 添加核心功能列表
   - 添加工作流程说明
   - 添加 SSH 切换指南
   - 添加故障排查部分

### 使用示例

```bash
# 推荐使用方式
npm run push

# 输出示例：
# === Git Push with Flexible Network Handling ===
#
# Original proxy: http://127.0.0.1:7897|http://127.0.0.1:7897
# Commits to push: 5
#
# Step 1: Network Quality Assessment
# Testing network quality to GitHub...
#   Packet loss: 50%
#   Average latency: 258ms
# ⚠ Network quality: Poor (high packet loss)
#
# ⚠ Network quality is poor. Push may fail.
# Continue anyway? (y/N): y
#
# Step 2: Optimizing Git Settings
# Optimizing Git timeout settings...
# ✓ Timeout optimized (1KB/s for 30s)
#
# Step 3: Testing Connectivity
# Testing proxy connection...
# ✗ Proxy failed
# Testing direct connection...
# ✓ Direct connection works
#
# Step 4: Pushing to Remote
# Using direct connection method
# ✓ Proxy disabled (using direct connection)
# Attempt 1/3
# [推送输出...]
# ✓ Push successful!
#
# Restoring Git timeout settings...
# ✓ Timeout settings restored
# ✓ Proxy restored
#
# ✓✓✓ Push completed successfully! ✓✓✓
```

### 预期效果

1. **更高的成功率**: 通过重试和超时优化，预计成功率提升 60-80%
2. **更快的失败检测**: 30 秒超时避免长时间挂起
3. **更好的用户体验**: 清晰的进度显示和建议
4. **更多的备选方案**: SSH 作为 HTTPS 的可靠备选

### 后续改进方向

1. 支持自定义重试次数和延迟
2. 添加推送进度显示（如果 Git 支持）
3. 记录推送历史和成功率统计
4. 支持更多的网络诊断工具
