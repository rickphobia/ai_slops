# Exhaustion: whole dropped picks, a busy Worker, and a rest hour on the Shift's clock

The spec leaves three Exhaustion rules open, and ticket 08 settles them as follows:

- **Dropped cotton.** "A pick can drop part of its cotton" is modelled as a chance that the whole pick is dropped: the plot is emptied, and the pick earns no Quota credit and no Labour Points. The Quota counts whole picks, so dropping a share of one would mean fractional Quotas everywhere. Over many picks, `dropped_cotton_chance` is the share of cotton lost, which is the dial ticket 18's tools tiers can turn down.
- **Slow work.** "Each action takes longer" means that above `slow_exhaustion` a plant, pick or clear leaves the Worker busy for `slow_action_seconds`. Until that passes, further field work is refused with `worker_busy`. The Generator and the rest hour are not field work, so they stay open.
- **The rest hour.** It lasts `rest_hour_seconds` of online play (60 s shipped: "hour" is The App's name for it, like a Shift's 10 minutes). The Shift keeps counting, so rest costs Quota time. Offline, it waits like the Shift does. While he rests, field work and the Generator are refused with `resting`. A Study Session cuts the rest short, with no refund.

**Trade-offs:**

- The player feels slow work as taps being refused, not as a slower animation.
- A dropped pick is a bigger, rarer loss than a slight shortfall every time.
- A rest bought just before a Shift's end can be lost to the Study Session.

**Considered Options:**

- Fractional cotton per pick: rejected, as above.
- Queueing taps while the Worker is busy: more state in the rules, and a queued tap would still have to be refused if a Study Session started.
- Letting the rest hour run on while away, like a Study Session: the rest would be spent while nobody saw it.
