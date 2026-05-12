---
name: Scenario sprint (feature 改 baseline) pattern + codex multi-trial sweep
description: 1f sprint (12 commit, 12 新城/cascading move) 提炼的 feature 改 baseline 类 sprint pattern. user-driven 多轮地图调整 + history-correct 优先 + codex sweep catch cascading dep.
type: feedback
---

## 1f sprint 12 commit 历史

1f / 1f-p2 / 1f-p2-p2 / 1f-p3 / 1f-p3-p2 / 1f-p3-p3 / 1f-p4 / 1f-p4-p2 / doc nit / v181 latent fix
= 累计 12 commit, 11 新城 + 1 hex 修订 + 22 武将 home city 史实正确化 + 6 latent bug fix.

## 模式 1: user 多轮反馈,每次 propose 完整 spec

每加一批城 (3 / 5 / 2 / 0) user 看实际地图反馈下一步. CC 流程:
1. user 提需求 ("还能加城吗 / 这里空 / 那里太近")
2. CC scout (现有 city hex + state set + region set + county)
3. CC propose 完整 spec 表 (id/name/hex/fac/size/pop/troops/tags/jun/base/道路)
4. AskUserQuestion 关键 design point (fac 选 / 城选 / hex 调整)
5. user pick → 实装 → codex review → fix → re-lock baseline → user 累积

**Why**: feature 改 baseline 不像 refactor 守底 — 不能用 byte-identical 自动 verify, user 必须看
实际地图 决定. CC 不擅自决定数据 (CLAUDE.md 硬规则).

## 模式 2: history-correct 优先 (B 选项)

user 1f-p4 选 B: "B才是真正架构合理改到位的方式" — 让 CC 接受 cascading move:
- 谯县 chenliu→xiaopei (13 武将 home)
- 朐县 xuzhou→donghai (2 武将)
- 吴县 jianye→suzhou (5 武将)
- popShare 重 normalize 3 城

副作用 (jianye 失 magnate 等) 视为 history trade-off, 不 hack.

**Why**: 长远 维护成本低 + v181 妥协一次性 fix; 守底 strict (byte-identical) 不适用 feature.

## 模式 3: codex multi-trial sweep catch cascading dep

1f sprint 内 codex 8 latent bug catch (single-trial 不能 catch 全):
- 1e P1.1 F.1 missing pair (validator scope)
- 1e P1.2 squads.forEach crash
- 1f-p2 region set (QINGXU/JINGZHOU)
- 1f-p3 STATE_CITIES (10 新城分州)
- 1f-p3 STATE_TIER (4 升级)
- 1f-p4 suzhou 吴县 type (clan_base 模式)
- v181 latent getGenBirthplace (GEN_TAGS vs GEN_META)
- (npm compare baseline doc nit ×2)

Pattern: 每个 sub-sprint commit 后 trial codex review, NEEDS-WORK 立即 fix 不 push. 累积到 user
实测前 sweep 完整.

**Why**: feature 改 baseline 涉及 cross-cutting concern (region set / state / county / IIFE 等), 单
sprint scope 难一次想全; codex sweep 多 trial 让 cascading dep silent broken 暴露.

## How to apply

**适用于**: feature 改 baseline 类 sprint (phase 2 190 势力 / phase 3 城市归属 / phase 4 武将归属
等). 每步 user-driven + multi-trial codex sweep + 接受 multiple baseline re-lock.

**不适用**: refactor 守底 sprint (smoke byte-identical 自动 verify) 仍按 1a-1d 模式.
