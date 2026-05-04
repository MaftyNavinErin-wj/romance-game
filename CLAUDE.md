# CLAUDE.md — Project Romance Refactor Constitution

> 这份文件是 Claude Code 启动每个 session 时**必须先读**的宪法。
> 内容简短、强约束、不啰嗦。详细路线图见 `REFACTOR_PLAN_v1.md`。

---

## 制作人硬规则(不可违反)

1. **新功能 / 新设计先讨论 → 制作人 approve → 实装**。Claude Code 不擅自做设计决策。
2. **每次迭代关注 robustness / 完整度 / 精简度**。代码要经得起 audit。
3. **不擅自添加未提需求的功能或机制**。范围严格限定在 session 任务单内。
4. **HANDOVER 文档不重写,只追加**。已有内容(20520 行)受保护。

---

## 项目背景(快速 context)

- 项目名:Project Romance(三国题材策略游戏)
- 技术栈:原生 JavaScript + HTML(单文件 2.0 MB / ~39500 行 v181)
- 当前阶段:**8 链 audit pass 1 完成 → 进入重构期**
- 重构目标:单 HTML → 四层架构(`data/` + `render/` + `chains/` + `core/`)
- 重构方式:渐进式三阶段(数据 → 渲染 → 机制),每阶段完成才进下一阶段

## 8 链架构(audit 沉淀)

游戏机制按 8 条逻辑链组织,每条链都有完整 audit 文档:

1. 经济链(economy)
2. 军事链(military)
3. 武将链(general)
4. 政治链(politics)
5. 外交链(diplomacy)
6. 事件链(event)
7. 价值观链(ethos)
8. 豪族链(gentry)

D 类清单见 `cross_chain_d_list_v1_0.md`(145 个 finding,27 HIGH / 44 MEDIUM / 67 LOW)。

---

## 重构期工作模式

### 当前 session 范围

每个 session 启动前,制作人会指定本 session 的精确范围(到文件级 / 函数级)。
Claude Code **不允许**:
- 超出范围动其他文件
- 顺手修 HIGH/MEDIUM D 类(留到重构完成后 sprint)
- 自行决定要不要拆某个文件

### Session 启动 checklist

每个 session 启动,Claude Code 必须先确认:

- [ ] 已读本 `CLAUDE.md`
- [ ] 已读 `REFACTOR_PLAN_v1.md` 对应章节
- [ ] 已确认当前 Git 分支正确
- [ ] 已确认 baseline.json 存在
- [ ] 已知本 session 任务范围
- [ ] 已知本 session 的 out-of-scope
- [ ] **基础事实实测**(`wc -l` / `du -h` 当前 v181 + 各 src 文件,不抄文档)

### Session 结束条件(满足任一即结束)

1. 当前任务完成 + smoke test PASS + commit pushed
2. context 余量预警(建议低于 20% 时收尾)
3. 制作人主动结束
4. smoke FAIL 且 30 分钟内无法定位
5. 遇到设计决策需要回 Claude.ai 对话讨论

---

## D 类处理原则

| D 类等级 | 重构期处理 |
|---|---|
| HIGH | ❌ **不修**(留 sprint) |
| MEDIUM | ❌ **不修**(留 sprint) |
| LOW fix | ❌ **不修**(留 sprint) |
| LOW defer 架构债 | ✅ **重构期自然 close**(限定阶段 1.5/1.6) |
| verified-with-notes | ❌ 不动 |
| verified | ❌ 不动 |

**自然 close 标记**:commit message 格式 `chore: closes D-XXX via centralization`

**严格判定**:LOW defer 必须满足"修复 = 抽离副产物"才允许自然 close。**不允许**主动 fix。

---

## Smoke Test 强约束

### 每个 commit 必须做的事

1. 跑 `node tests/smoke.js` 生成 `current.json`
2. 跑 `node tests/compare.js` 比对 baseline
3. 第一层全字段 PASS 才允许 commit
4. 任何 diff 必须解释或回滚

### smoke FAIL 处理流程

1. 先看 diff 报告定位差异字段
2. 30 分钟内能定位 → fix + 重跑
3. 30 分钟内无法定位 → 工作分支 `git reset --hard HEAD~1` + 在这个对话讨论
4. **绝对不允许**:为了让 smoke PASS 而修改 baseline.json

### baseline 管理

- baseline 在 `tests/baseline/` 目录
- v181 原代码 baseline 是权威基准,**永不修改**
- 每个阶段完成后生成新 baseline,但保留旧 baseline 用于回归

---

## Git 工作流

### 分支结构

```
main                    永远可玩
├─ refactor/phase-N     阶段主分支
│   └─ refactor/pN.M-task-name    工作分支(每个搬运动作一个)
```

### Commit 规则

- 1 个搬运动作 = 1 个 commit
- 1 个 D 类自然 close = 1 个独立 commit
- commit message 必须含阶段标识:`refactor(p1.1): ...` / `chore: closes D-XXX`

### Merge 规则

- 工作分支 → smoke PASS → squash merge 阶段分支
- 阶段分支 → 全量 smoke PASS + summary doc → merge main

---

## 设计决策回流机制

如果 session 中遇到以下情况,**立即停止 + 回到 Claude.ai 对话讨论**:

1. 抽数据时发现循环依赖
2. 函数职责边界模糊,不知道该归到哪个模块
3. 接口设计需要选择(如 render 层是否能直读 G state)
4. smoke FAIL 30 分钟无法定位
5. 发现 audit 漏掉的新 D 类(记录到 followup,不当场 fix)
6. 需要拆分超出 plan 的文件
7. 任何"我觉得这样设计更好"的冲动 → 必须先讨论

**回流不是失败**,是硬规则 #1 的体现。

---

## 文档保护清单

以下文件 Claude Code **只读**,不允许修改(除非制作人明确授权):

- `HANDOVER_v181_v1_6.md`
- `cross_chain_d_list_v1_0.md`
- 8 链各自的 walkthrough(`*_chain_walkthrough_v*.md`)
- 8 链各自的 JSON(`*_chain_v*.json`)
- 概念图 HTML(`concept_map_v*.html`)
- `Project_Romance_GDD_*.pdf`
- `Project_Romance_Pitch_*.pdf`

以下文件 Claude Code **可读可写**:

- `REFACTOR_PLAN_v1.md`(每阶段末追加 phase summary 引用)
- `src/` 目录下所有文件
- `tests/` 目录下所有文件
- `docs/phase*_summary.md`(每阶段末新建)

以下文件 Claude Code **可读不可写**(原 v181 文件):

- `project_romance_v181.html`(重构期间逐步减重,但不允许"删原代码再写新文件",必须"抽离 + 引用")

---

## 反模式(禁止)

❌ "顺手优化一下这段代码"
❌ "这里有个 bug 我顺便修了"
❌ "我觉得这样设计更好,我先实现看看"
❌ "smoke FAIL 应该是无关的小问题,先 commit 再说"
❌ "重写一下 HANDOVER 让它更清晰"
❌ "加个新 feature 让用户体验更好"
❌ "这个 D 类很容易修,顺便 close 了吧"
❌ "我觉得不需要 smoke test,代码看起来没问题"

---

## 正模式(鼓励)

✅ "这超出 session 范围了,我停下来等指示"
✅ "smoke FAIL,我先看 diff 报告"
✅ "这是个设计决策,我回 Claude.ai 讨论"
✅ "我发现一个新 D 类,记录到 followup.md,不当场 fix"
✅ "context 余量 25%,建议本 session 收尾"
✅ "搬完这个文件,smoke PASS,准备 commit"

---

## 联系制作人(回流触发关键词)

如果 Claude Code 输出以下任一关键词,制作人应介入:

- 🛑 "BLOCKED: 需要设计决策"
- 🛑 "BLOCKED: smoke FAIL 无法定位"
- 🛑 "BLOCKED: 发现循环依赖"
- 🛑 "BLOCKED: session 范围模糊"
- ⚠️ "WARNING: context 余量 < 20%"
- ⚠️ "WARNING: 发现新 D 类(已记录 followup)"

---

(CLAUDE.md v1.0 完结 — 所有 session 启动必读)
