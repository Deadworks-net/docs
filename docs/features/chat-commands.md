---
title: "Chat commands"
---

# Chat commands

> **Namespace:** `DeadworksManaged.Api`

A chat command is a command that players run from chat as `/name` or `!name`. Plugins create chat commands with the [`[Command]`](commands) attribute.

Use `[Command("name")]` when you want the same command to be available as:

- `/name`
- `!name`
- `dw_name`

To register only the chat versions, without the `dw_name` console command, set `ChatOnly = true`:

```csharp
[Command("hello", ChatOnly = true)]
public void CmdHello(Caller caller)
{
    // Respond to /hello and !hello, but do not register dw_hello
}
```

## See also

- [Commands](commands): arguments, aliases, `SuppressChat` and console behavior
- [Console commands](console-commands): `dw_` commands and the built-in ones
