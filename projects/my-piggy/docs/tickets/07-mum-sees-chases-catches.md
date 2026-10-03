# 07: Mum sees, chases and catches

**What to build:** Mum carries a torch. If the Piggy is in its beam with nothing in the way, she sees them and chases, faster than the Piggy can trot. Breaking line of sight and going quiet can lose her; she then searches the last place she saw you. If she reaches the Piggy, they're **caught**: a short capture scene (torch in the face, her face, her scream, cut to black), then the space restarts from its checkpoint in under 3 seconds. After this ticket the first playable can be judged on whether it's scary.

**Blocked by:** 06 (Mum hunts by sound)

**Status:** done

**Touches:** family brain (sight, chase), Mum's actor (torch, line of sight), Night (caught → restore checkpoint), capture scene, smoke test

- [x] Mum sees the Piggy only inside her tuned torch cone and range with a clear line of sight; furniture and darkness outside the beam hide the Piggy
- [x] Seeing the Piggy moves the family brain to chasing; losing sight moves it to searching the last seen spot (tested through Night)
- [x] Mum within the caught distance while chasing makes the Piggy caught (tested through Night)
- [x] Being caught restores the checkpoint: Piggy position, humanity, urge, used give-in spots and Mum's position and alert level (tested through Night)
- [x] Capture scene plays (placeholder face is fine) and the restart completes in under 3 seconds
- [x] Smoke test boots the main scene headless, runs scripted input until caught, and checks the space restarts with no errors logged; it runs in CI
- [x] The debug key from ticket 03 for restoring checkpoints is removed or kept behind `?debug=1`
- [x] PR says how to try a chase and an escape
