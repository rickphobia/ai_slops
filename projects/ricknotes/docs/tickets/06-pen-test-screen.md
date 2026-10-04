# 06: Pen test screen

**What to build:** A hidden screen, reached from Settings, that lists every event the stylus sends: touches, hovering, pressure, buttons held, the eraser end, key events and anything else Android reports. We use it to find out which buttons of the Lenovo Xiaoxin Stylus 2023 reach apps on ZUXOS before building the Pen button settings in ticket 15.

**Blocked by:** 03 (Pick the Study folder)

**Status:** done

**Touches:** app-diagnostics, app-settings

**Effort:** low

- [x] Hidden entry in Settings opens the pen test screen
- [x] Each event shows its type, tool type, button state, pressure, hover state and key code if any, newest first
- [x] Holding the screen still while pressing a button shows whether a hover event with a button arrives
- [x] README section "Pen buttons" with a table to fill in: button, action tried, what the app received

**Owner steps:** open the screen on the tablet, try every pen button (press while touching, while hovering, double-tap if the pen supports it), and fill in the README table, or paste the results into the PR for the session to write up.
