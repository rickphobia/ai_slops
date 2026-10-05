# Profile encrypted at rest with a key held by the server

The Profile (name, email, unit number, mobile) is encrypted in the database with a key the server reads from an environment variable. It is not encrypted with a passphrase from the Operator, because the server has to read the Profile at Release Time while nobody is logged in. The key is never stored in the database, the repo or the logs.

**Trade-offs:** this protects against a leaked database file or backup, not against someone who controls the running server. Losing the key means re-entering the Profile.
