# All files access instead of the Storage Access Framework

The app asks for "All files access" (`MANAGE_EXTERNAL_STORAGE`) and works on the Study folder through normal file paths, not through the Storage Access Framework (SAF). Safe saving (write a temporary file, then swap it in) needs an atomic rename, which SAF doesn't offer, and SAF's folder listing is slow on large trees. The app is sideloaded for one person, so the Play Store's limits on this permission don't apply.

**Trade-offs:** the app could not be published on the Play Store as it is, and it can read any file on shared storage, not just the Study folder.
