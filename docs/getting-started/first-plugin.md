---
title: "Your First Plugin"
sidebar_label: "First Plugin"
---

# Your First Plugin

This guide shows the basic shape of a Deadworks plugin, then adds a command and a timer.

## Minimal Plugin

Every plugin starts by inheriting from `DeadworksPluginBase`:

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

`DeadworksPluginBase` gives your plugin the pieces most mods start with:

- `Name` tells Deadworks what your plugin is called
- `OnLoad(bool isReload)` runs when the plugin loads or hot-reloads
- `OnUnload()` runs when the plugin unloads or before a hot-reload
- `OnStartupServer()` runs each time the server starts a new map
- `Timer` lets you run code later or on a repeating loop

Most plugins only need those pieces at first.

## Running Code on Map Start

Use `OnStartupServer()` for setup that should happen every time a new map starts:

```csharp
public override void OnStartupServer()
{
    ConVar.Find("citadel_allow_duplicate_heroes")?.SetInt(1);
    ConVar.Find("citadel_player_starting_gold")?.SetInt(0);
}
```

This is a good place to change game ConVars or reset plugin state for the new match.

## Adding a Command

Use `[Command]` to register one handler for chat and console:

```csharp
using DeadworksManaged.Api;

namespace MyFirstPlugin;

public class HelloPlugin : DeadworksPluginBase
{
    public override string Name => "Hello World";

    [Command("hello", Description = "Show a welcome message")]
    public void CmdHello(CCitadelPlayerController caller)
    {
        var pawn = caller.GetHeroPawn();
        if (pawn == null)
            return;

        // Send a HUD announcement to just this player
        var msg = new CCitadelUserMsg_HudGameAnnouncement
        {
            TitleLocstring = "HELLO!",
            DescriptionLocstring = "Welcome to Deadworks"
        };
        NetMessages.Send(msg, RecipientFilter.Single(caller.EntityIndex - 1));
    }
}
```

This creates:

- `/hello` as a slash chat command
- `!hello` as a bang chat command
- `dw_hello` as the console version

For most plugins, that is all you need.

## Adding a Timed Effect

`DeadworksPluginBase` already gives your plugin a `Timer` property, so you can schedule work directly:

```csharp
[Command("boost")]
public void CmdBoost(CCitadelPlayerController caller)
{
    var pawn = caller.GetHeroPawn();
    if (pawn == null)
        return;

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
}
```

`Timer.Every(...)` keeps running until you cancel it.

That is why the example saves the returned handle in `timer`, then uses `Timer.Once(...)` to stop it 10 seconds later.

## Key Concepts

| Concept | Description | Learn More |
|---------|-------------|------------|
| `DeadworksPluginBase` | Base class every plugin starts from | [Plugin Lifecycle](../guides/plugin-lifecycle) |
| `ConVar.Find(...)` | Change built-in game settings when a map starts | [ConVars](../features/convars) |
| `[Command]` | Attribute to register chat and console commands | [Commands](../features/commands) |
| `NetMessages.Send` | Send protobuf messages to players | [Networking](../features/networking) |
| `RecipientFilter` | Target specific players for messages | [Networking](../features/networking) |
| `Timer` | Schedule delayed or repeating actions | [Timers](../features/timers) |

## Next Steps

- [Plugin Lifecycle](../guides/plugin-lifecycle) - Understand the full load/unload flow
- [Commands](../features/commands) - Add more chat and console commands
- [Commands for One Role](../guides/role-only-commands) - Limit a command to some players (coming soon)
- [ConVars](../features/convars) - Add console settings to your plugin
- [Timers](../features/timers) - Run delayed and repeating logic
- [Example Plugins](../examples/roll-the-dice) - See full real-world plugins
