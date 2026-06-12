---
trigger: always_on
---

# 项目开发规则 (Project Rules)

1. **语言规则 (Language Rule)**:
   - 所有对话、思考、沟通、工作计划（如 `implementation_plan.md`、`task.md`、`walkthrough.md`）以及代码中的注释（Code Comments）**必须使用中文**。

2. **提交限制规则 (Commit Constraint Rule)**:
   - 除非用户明确要求提交，否则禁止执行 Git Commit/Submit。

3. **更改记录规则 (Uncommitted Changes Record Rule)**:
   - 必须记录所有未提交的更改。在更改被正式提交后，该记录将被清除。

4. **任务明细管理规则 (Task Checklist Management Rule)**:
   - 每次需求开发都需要在 `task.md` 中创建任务明细清单。
   - 任务完全完成后，应删除对应的任务明细文件或清单；若未完成，则需保留进度以便后续继续执行。
