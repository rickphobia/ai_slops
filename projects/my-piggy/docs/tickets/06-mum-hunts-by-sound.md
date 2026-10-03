# 06: Mum hunts by sound

**What to build:** **Mum** is in the house. She walks her route humming "This Little Piggy", and you can hear where she is before you see her. Every **noise** the Piggy makes (footsteps, doors, outbursts, giving in) has a loudness. If she's within range, after walls and closed doors cut it down, she comes to look. She searches the area for a while, talking softly ("Come to Mummy", "It's alright, my piggy"), then goes back to her route. Her humming stops and her voice changes with her **alert level**. She can't see or catch the Piggy yet.

**Blocked by:** 04 (The body)

**Status:** ready

**Touches:** Noise, family brain, Mum's actor (movement, humming, lines), house distance provider, debug overlay (noise rings, alert level), Night (wiring Mum in)

- [ ] Noise is a rules class that turns movement, door pushes and body events into noises with a position and loudness, and decides who hears them using a distance it is given (tested with a fake distance provider)
- [ ] Each closed door or wall between a noise and a listener cuts its range by the tuned amount (tested)
- [ ] Family brain is a rules class: unaware → investigating → searching → back to unaware after the tuned search time (tested through Night with scripted noises)
- [ ] The house distance provider answers "path distance and number of doors and walls between these two points" using the walkable area; it is the only part of hearing that uses Godot
- [ ] Mum walks her route at her tuned speed, goes to a heard noise at investigate speed, and searches around it
- [ ] Mum's humming, footsteps and lines are 3D sounds, muffled through walls; humming stops when she's investigating, and her lines change with her alert level (placeholders are fine)
- [ ] `?debug=1` shows noise rings and Mum's alert level
- [ ] Logs record each noise heard (source, loudness, distance) and each alert level change
