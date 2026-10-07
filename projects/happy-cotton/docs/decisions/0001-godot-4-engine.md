# Godot 4 with web export, not a browser TypeScript build

Happy Cotton is a 3D, real-time farm game played as a link on rickphobia.com, on desktop and on phones. We chose Godot 4 over a TypeScript + Three.js build because it gives a scene editor, 3D lighting and animation, and scenes and scripts stored as plain text that can be reviewed. We use its single-threaded web export with the Compatibility (WebGL 2) renderer, so nginx serves it as plain static files with no special headers and it runs in mobile browsers. The exact Godot version is pinned when ticket 01 is built.

**Trade-offs:** a 30–40 MB first download and a slower start on phones than a Three.js build; the Compatibility renderer limits lighting and post-processing, which caps how realistic the look can get, so scenes and textures have to stay small; a GDScript toolchain (Godot's own test addon, a Godot binary in CI) instead of TypeScript, Vite and Vitest.

**Considered Options:** TypeScript + Three.js (smaller download, faster on phones, Vitest for the farm logic, but no scene editor and every scene built in code or from glTF files).
