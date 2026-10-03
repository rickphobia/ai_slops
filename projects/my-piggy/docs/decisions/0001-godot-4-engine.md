# Godot 4 with web export, not a browser TypeScript build

The game is first-person 3D with walking, collisions, family members finding their way around the house, 3D sound and lighting. It must be playable as a link on rickphobia.com first and possible to ship on Steam later. Godot 4 gives all of that in one project, exports to both the web and desktop, and stores scripts and scenes as plain text that can be reviewed and edited. We pin one exact Godot version (**4.7.2**, the latest stable 4.x when ticket 01 was built; GUT 9.7.1 and gdtoolkit 4.5.0 alongside it) and use its single-threaded web export with the Compatibility (WebGL 2) renderer, so nginx serves it as plain static files with no special headers.

**Trade-offs:** a 30–40 MB first download on the web; a newer toolchain for this repo (GDScript, Godot's own test addon, a Godot binary in CI) instead of the TypeScript, Vite and Vitest setup `pawn-swarm` uses; the Compatibility renderer limits lighting effects, which suits the PS1 look anyway.

**Considered Options:** TypeScript + Three.js (smaller download, same tools as `pawn-swarm`, but we would hand-build the walking controller, collisions, pathfinding and 3D sound, and need a wrapper for Steam).
