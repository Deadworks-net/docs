---
title: "Chat Commands"
sidebar_label: "Chat Commands"
---

# Chat Commands

> **Namespace:** `DeadworksManaged.Api`

Register chat commands using the `[ChatCommand]` attribute on plugin methods.

## Prefix: `/` Only

Chat commands are triggered when a player types a message starting with `/`. The bare command name you register (e.g. `"rtd"`) is what the player types **after** the slash.

## ChatCommandAttribute

Marks a plugin method as a handler for a chat command. Can be applied multiple times to map multiple commands to the same handler.

```csharp
[ChatCommand("rtd")]
public HookResult OnRollTheDice(ChatCommandContext ctx)
{
    // Player typed /rtd in chat
    return HookResult.Handled;
}
```

### Multiple Commands on One Handler

```csharp
[ChatCommand("help")]
[ChatCommand("info")]
public HookResult OnHelp(ChatCommandContext ctx)
{
    // Handles both /help and /info
    return HookResult.Handled;
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Command` | `string` | The command string this attribute matches (e.g. `"rtd"`) |

## ChatCommandContext

Context object passed to every chat command handler.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Message` | `ChatMessage` | The raw chat message that triggered the command |
| `Command` | `string` | The matched command string (e.g. `"rtd"`) |
| `Args` | `string[]` | Arguments following the command, split by whitespace |
| `Controller` | `CCitadelPlayerController?` | The player controller who sent the command, or `null` |

### Common Pattern

```csharp
[ChatCommand("mycommand")]
public HookResult OnMyCommand(ChatCommandContext ctx)
{
    // Get the player's pawn (in-game entity)
    var pawn = ctx.Controller?.GetHeroPawn();
    if (pawn == null)
        return HookResult.Handled;

    // Parse optional arguments
    int duration = ctx.Args.Length > 0 && int.TryParse(ctx.Args[0], out var d) ? d : 30;

    // Do something with the player...

    return HookResult.Handled;
}
```

### Accessing Sender Slot

The sender's player slot is available via the message:

```csharp
int senderSlot = ctx.Message.SenderSlot;
```

This is useful for [sending targeted messages](networking.md):

```csharp
NetMessages.Send(msg, RecipientFilter.Single(ctx.Message.SenderSlot));
```

## ChatMessage

Incoming chat message from a player. Also passed to `OnChatMessage()` on the [plugin base](plugin-base.md).

| Property | Type | Description |
|----------|------|-------------|
| `SenderSlot` | `int` | Player slot index of the sender |
| `ChatText` | `string` | The raw chat text that was sent |
| `AllChat` | `bool` | Whether this was an all-chat message (vs team chat) |
| `LaneColor` | `LaneColor` | Lane color of the sender |

## Return Values

Chat command handlers must return a [HookResult](plugin-base.md):

- `HookResult.Handled` — Command was processed, message consumed
- `HookResult.Stop` — Block further processing

## See Also

- [Console Commands](console-commands.md) — Server console commands (`[ConCommand]`)
- [Plugin Base](plugin-base.md) — `OnChatMessage` hook for raw message interception
- [Networking](networking.md) — Sending responses back to players
