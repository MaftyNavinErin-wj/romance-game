---
name: Cross-machine memory sync — auto-memory ← in-repo
description: 跨电脑 session 启动时, 用 in-repo docs/memory/ 覆盖本机 auto-memory 保持一致
type: feedback
---

跨电脑工作流下, in-repo `docs/memory/` 是 memory 权威源 (跟 git 走), 本机 auto-memory `~/.claude/projects/C--Users-DELL-Desktop-romance-game/memory/` 只是 Claude Code 本机加载副本, **不跟 git 同步**。

**Why:** auto-memory 在 user home 的 `.claude\` 下不在 repo 里, `git pull` 只更新 in-repo `docs/memory/`, 本机 auto-memory 仍是这台机器上次 session 写的旧版。session 启动加载到 context 的是 auto-memory 那一份, 所以"pull 后还看到旧 memory"是必然的。

**How to apply:**

session 启动发现 in-repo memory 比 auto-memory 新 (e.g. 用 `git log -1 docs/memory/` 看最近 commit, 或 description 行内容不一致), 执行单条 cp 命令对齐 (Git Bash):

```bash
cp -v docs/memory/*.md "/c/Users/DELL/.claude/projects/C--Users-DELL-Desktop-romance-game/memory/"
```

verify (无输出 = 两边一致):

```bash
diff -rq docs/memory "/c/Users/DELL/.claude/projects/C--Users-DELL-Desktop-romance-game/memory/"
```

**注意点:**
- 当前 session 已加载旧 auto-memory 到 context, sync 后**下次 session 启动**才生效, 本 session 内仍以 in-repo 文件 Read 为准
- 反方向 (本机 auto-memory 改了要回流到 in-repo): 反过来 cp 后 commit + push (走 in-repo 改动 commit, **不要**直接改 auto-memory 后期望传播)
- 路径 hardcoded 这台电脑 user 名 `DELL` + 项目路径转义, 换电脑要改 (但跨电脑场景一般是公司/家两台都已配好, 命令字面通用)
