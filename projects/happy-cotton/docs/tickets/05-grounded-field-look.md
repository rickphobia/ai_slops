# 05: Grounded field look

**What to build:** The field looks like the grim, grounded place the game is about: dust, a muted palette, harsh light, fog, fences, and a Worker standing in the field who looks like a person, not a caricature. It runs smoothly on a phone under the Compatibility renderer (spec: stories 11–13; "Content rules"; decision 0001).

**Blocked by:** 04 (Plant, grow, pick)

**Status:** done

**Touches:** adapters/field, assets

**Effort:** low

**Owner steps:** open the PR's preview on a real phone and check it stays responsive and the Worker reads as a person with dignity (the session could only test with software rendering).

- [x] CC0 models and textures for the field, cotton plants at each growth stage, fences and the Worker, replacing the placeholder shapes
- [x] A dusty, muted palette with harsh light and fog, using only what the Compatibility renderer supports
- [x] The Worker is a stylised adult person with dignity: no caricature in looks
- [x] A credits file names every asset, its author, licence and link
- [x] The web export still loads and stays responsive on a phone-sized screen (record what was checked in the PR)
