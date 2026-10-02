# Browser demo in TypeScript + Canvas, no game engine

The demo exists to test whether the idea is fun before a possible Unreal rebuild. We use TypeScript, Vite and plain Canvas 2D instead of Phaser/Pixi or Unity, because the visuals are coloured squares and chess glyphs, and a shareable link with no install matters more than engine features. Rules live in pure modules with no DOM so they can be ported.

**Trade-offs:** we hand-write the game loop, input and simple animation that an engine would give us.
