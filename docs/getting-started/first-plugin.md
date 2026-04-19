---
title: "Your First Plugin"
sidebar_label: "First Plugin"
---

# Your First Plugin

This guide walks through creating a minimal Deadworks plugin with a chat command.

## Minimal Plugin

Every plugin inherits from `DeadworksPluginBase` and provides a `Name`:

```csharp
using DeadworksManaged.Api;

namespace MyFirstPlugin;

public class HelloPlugin : DeadworksPluginBase
{
    public override string Name => "Hello World";

    public override void OnLoad(bool isReload)
    {
        Console.WriteLine($"[{Name}] Loaded! (reload={isReload})");
    }

    public override void OnUnload()
    {
        Console.WriteLine($"[{Name}] Unloaded!");
    }
}
```

Build the project, copy the DLL to the plugins folder, and the plugin will load automatically.

## Adding a Chat Command

Use the `[ChatCommand]` attribute to register a command that players can type in chat:

```csharp
using DeadworksManaged.Api;

namespace MyFirstPlugin;

public class HelloPlugin : DeadworksPluginBase
{
    public override string Name => "Hello World";

    [ChatCommand("hello")]
    public HookResult OnHello(ChatCommandContext ctx)
    {
        var pawn = ctx.Controller?.GetHeroPawn();
        if (pawn == null)
            return HookResult.Handled;

        // Send a HUD announcement to just this player
        var msg = new CCitadelUserMsg_HudGameAnnouncement
        {
            TitleLocstring = "HELLO!",
            DescriptionLocstring = "Welcome to Deadworks"
        };
        NetMessages.Send(msg, RecipientFilter.Single(ctx.Message.SenderSlot));

        return HookResult.Handled;
    }
}
```

Players type `/hello` in chat and see a HUD announcement.

## Adding a Timed Effect

Combine chat commands with the [Timer API](../api-reference/timers.md) for delayed actions:

```csharp
[ChatCommand("boost")]
public HookResult OnBoost(ChatCommandContext ctx)
{
    var pawn = ctx.Controller?.GetHeroPawn();
    if (pawn == null)
        return HookResult.Handled;

    // Grant infinite stamina for 10 seconds
    var stamina = pawn.AbilityComponent.ResourceStamina;
    var timer = Timer.Every(1.Ticks(), () =>
    {
        if (pawn.Health <= 0) return;
        stamina.LatchValue = stamina.MaxValue;
        stamina.CurrentValue = stamina.MaxValue;
    });

    // Stop after 10 seconds
    Timer.Once(10.Seconds(), () => timer.Cancel());

    return HookResult.Handled;
}
```

## Key Concepts

| Concept | Description | Learn More |
|---------|-------------|------------|
| `DeadworksPluginBase` | Base class — provides `Timer`, lifecycle hooks | [Plugin Base](../api-reference/plugin-base.md) |
| `[ChatCommand]` | Attribute to register chat commands | [Chat Commands](../api-reference/chat-commands.md) |
| `HookResult` | `Continue` (default, let event proceed), `Handled` or `Stop` (block further processing) | [Plugin Base](../api-reference/plugin-base.md) |
| `NetMessages.Send` | Send protobuf messages to players | [Networking](../api-reference/networking.md) |
| `RecipientFilter` | Target specific players for messages | [Networking](../api-reference/networking.md) |
| `Timer` | Schedule delayed/repeating actions | [Timers](../api-reference/timers.md) |

## Next Steps

- [Plugin Lifecycle](../guides/plugin-lifecycle.md) — Understand the full load/unload flow
- [API Reference](../api-reference/plugin-base.md) — Deep dive into the base class
- [Example Plugins](../examples/roll-the-dice.md) — See full real-world plugins
