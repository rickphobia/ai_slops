# 25: Split the Shift end out of Farm

**What to build:** The Farm rules file is about twice the project's ~300-line limit, and the Hand-in, Harmony Audits and Disasters all hook into the end of a Shift. Before they arrive, the Shift's clock, the Quota check, Study Sessions and the Shift end move into their own module inside the rules, which Farm owns and delegates to. Nothing a player sees changes (land and hazards spec: "Implementation Decisions": Hand-in and Shift end; repo rule: one job per module).

**Blocked by:** 22 (Call home)

**Status:** ready

**Touches:** rules

**Effort:** medium

- [ ] The Shift's clock, Quota check, Study Sessions and the Shift end's order live in a module of their own inside the rules, tested only through Farm
- [ ] Farm is under ~300 lines, or the ticket says plainly what still keeps it over and which later ticket takes it
- [ ] No behaviour changes: every existing rules test passes unchanged
- [ ] No save format change
