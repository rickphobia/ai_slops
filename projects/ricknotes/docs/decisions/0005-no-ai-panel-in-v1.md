# No built-in AI panel in v1; send to the Gemini and Claude apps instead

The first spec had an AI panel calling five model APIs, with keys, a cost counter, maths rendering and saved chats. It was dropped from v1: it was the largest milestone, it adds API bills and keys to manage, and the owner already pays for Claude Max and Gemini AI Pro, whose apps give stronger models at no extra cost and can see diagrams. Instead, a Document or a snip is sent to the official app through the Android share menu, with a preset prompt put on the clipboard.

**Trade-offs:** no chat history saved next to each PDF, no cheap per-question models like DeepSeek or Qwen, and one paste per question. Reconsider after the first week of real use if those turn out to matter.
