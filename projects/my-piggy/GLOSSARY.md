# My Piggy

A first-person horror game. You wake up as your own human head on a pig's body, and your family hunts you through the house in one long night.

## The player and their body

**Piggy**:
The player character: a human head on a pig's body. Mum calls them "my piggy".
_Avoid_: hybrid, pig-man, the player (in game text)

**Humanity**:
A hidden number from 100 (fully yourself) to 0 (fully pig). It is never shown on screen; the player only notices it through what they see and hear.
_Avoid_: sanity, health

**Urge**:
The pig body's need, building up over time. When it peaks, the body has an outburst unless the player suppresses it or gives in.
_Avoid_: hunger, stress, pressure

**Outburst**:
A noise or twitch the body makes on its own when an urge peaks: a snort, a squeal, a lunge.
_Avoid_: tic, fit

**Suppress**:
Holding the suppress key to hold back an outburst. Keeps humanity but doesn't clear the urge, and slows the Piggy down.
_Avoid_: resist (in code), hold breath

**Give in**:
Doing a pig act at a give-in spot (eating slop, rooting, wallowing). Clears the urge quietly and costs humanity.
_Avoid_: indulge, feed

**Give-in spot**:
A place in the house where the Piggy can give in: a slop bowl, a bin, a puddle.

**Slop**:
Rotten food left out (or put out) for the Piggy. What it looks like depends on humanity.

## Senses and lies

**Pig vision**:
The Piggy's blurry, washed-out view of the world. It gets more pig-like as humanity drops.

**Hallucination**:
Anything the game shows or plays that isn't real, chosen by humanity: slop looking like snacks, the mirror showing your old face, Mum's voice from an empty room.
_Avoid_: illusion, vision, sanity effect

**Reflection**:
A mirror or dark window where the Piggy can see their own body.

## The night

**Night**:
One playthrough, from waking up in the bedroom to an ending.
_Avoid_: run, level, session

**Space**:
One area of the house that is also a restart point: bedroom, hallway, kitchen (first playable), later upstairs and basement.
_Avoid_: room (in code), level, zone

**Checkpoint**:
The saved state taken when the Piggy enters a space. Being caught puts everything back to it.

**Caught**:
A family member reaching the Piggy. Plays the capture scene, then restarts the space.
_Avoid_: death, game over

**Noise**:
A sound the Piggy makes, with a position and a loudness. Family members who hear it come to look.

## The family

**Family member**:
One of the people hunting the Piggy. The first playable has only **Mum**.
_Avoid_: enemy, monster, AI

**Alert level**:
What a family member is doing about the Piggy: unaware, investigating a noise, searching, or chasing.
_Avoid_: aggro, state
