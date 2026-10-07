# 06: The App: Shift and Quota

**What to build:** Over the grim field sits The App: a bright overlay with a Quota bar, a Shift timer, Labour Points and the Mascot speaking in the state's doublespeak. Each Shift lasts 10 minutes of play; at its end the Quota is checked, a met Quota is celebrated with confetti and praise, and the next Shift starts right away with a higher Quota. Each pick earns a few Labour Points. Every sourced line and doublespeak term is tied to the sources register, and CI fails if one isn't (spec: stories 22–29, 31–39, 81–82).

**Blocked by:** 03 (Title screen and Sources page), 04 (Plant, grow, pick)

**Status:** done

**Touches:** rules, config/tuning, content/app-text, adapters/app-overlay, entrypoint

**Effort:** medium

- [x] Rules track the Shift (online time only), the Quota and its progress, and Labour Points earned per pick
- [x] At the end of a Shift: met Quota gives a praise App message; the next Shift starts at once; the Quota rises and never falls; picks above the Quota carry no credit forward
- [x] Rules emit App messages as data (a key plus values), never text
- [x] App text table maps each message key to English text; sourced lines and doublespeak terms carry a source id
- [x] A content test fails if any key the rules can emit has no text, or any source id is missing from the register
- [x] GUT tests cover a full Shift, Quota met, Quota rising, surplus not carried and Labour Points per pick, with time driven by the test
- [x] The App overlay shows the Quota bar, Shift time left, Labour Points and the Mascot's speech, and plays confetti on a met Quota; it never speaks for the Worker
- [x] Shift length, starting Quota, Quota rise and Labour Points per pick come from the tuning table
- [x] Quota checks are logged at info level
