---
title: "Chat Commands"
---

# Chat Commands

> **Namespace:** `DeadworksManaged.Api`

Chat-triggered commands use the unified [`[Command]`](commands) attribute.

Use `[Command("name")]` when you want the same command to be available as:

- `/name`
- `!name`
- `dw_name`

If you only want the chat versions and do not want the `dw_name` console command, set `ChatOnly = true`:

```csharp
[Command("hello", ChatOnly = true)]
public void CmdHello(CCitadelPlayerController caller)
{
    // Respond to /hello and !hello, but do not register dw_hello
}
```

For the full explanation of arguments, aliases, `SuppressChat`, and console behavior, see [Commands](commands).
