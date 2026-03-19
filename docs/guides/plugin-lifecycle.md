---
title: "Plugin Lifecycle"
sidebar_label: "Plugin Lifecycle"
---

# Plugin Lifecycle

This guide explains the complete lifecycle of a Deadworks plugin, from loading to unloading.

## Lifecycle Flow

```
Server Start
    │
    ├── OnPrecacheResources()     ← Precache particles, models, heroes
    │
    ├── OnLoad(isReload: false)   ← Plugin first loaded
    │
    ├── OnStartupServer()         ← Server map loaded, set convars here
    │
    │   ┌─────────────────────────────────────────┐
    │   │           SERVER RUNNING                │
    │   │                                         │
    │   │  OnClientPutInServer()  ← Client joins  │
    │   │  OnClientFullConnect()  ← Client ready  │
    │   │  OnGameFrame()          ← Every tick     │
    │   │  OnEntityCreated()      ← Entity born    │
    │   │  OnEntitySpawned()      ← Entity ready   │
    │   │  OnEntityDeleted()      ← Entity dying   │
    │   │  OnTakeDamage()         ← Damage event   │
    │   │  OnModifyCurrency()     ← Currency event  │
    │   │  OnChatMessage()        ← Chat message    │
    │   │  OnClientConCommand()   ← Console cmd     │
    │   │  OnClientDisconnect()   ← Client leaves   │
    │   └─────────────────────────────────────────┘
    │
    ├── OnUnload()                ← Plugin unloaded
    │
    └── (Hot-reload) → OnLoad(isReload: true)
```

## Startup Phase

### OnPrecacheResources

Called during map load. **Must** precache all resources (particles, models, heroes) here.

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
    Precache.AddAllHeroes();
}
```

See [Precaching](../api-reference/precaching).

### OnLoad

Called when the plugin is loaded. The `isReload` parameter is `true` during hot-reload.

```csharp
public override void OnLoad(bool isReload)
{
    Console.WriteLine($"[{Name}] Loaded! (reload={isReload})");

    if (!isReload)
    {
        // First-time initialization only
    }
}
```

### OnStartupServer

Called when the server starts a new map. Ideal for setting game convars:

```csharp
public override void OnStartupServer()
{
    ConVar.Find("citadel_trooper_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_allow_duplicate_heroes")?.SetInt(1);
}
```

## Runtime Phase

During runtime, your plugin responds to events through hooks and registered commands.

### Event Processing Order

1. **Entity events** — creation, spawn, deletion, touch
2. **Player events** — connect, disconnect, commands
3. **Gameplay events** — damage, currency, chat
4. **Frame events** — `OnGameFrame` every tick

### Hot-Reloading

When a plugin is hot-reloaded:

1. `OnUnload()` is called on the old instance
2. `OnLoad(isReload: true)` is called on the new instance
3. All registered commands and hooks are re-registered

**Important:** Clean up timers and hooks in `OnUnload()` to avoid duplicates after reload.

## Shutdown Phase

### OnUnload

Called when the plugin is unloaded (server shutdown, hot-reload, or manual unload).

```csharp
public override void OnUnload()
{
    Console.WriteLine($"[{Name}] Unloaded!");
    // Timers are automatically cleaned up per-plugin
    // EntityData stores are automatically cleaned up
}
```

**What's cleaned up automatically:**
- Per-plugin timers
- `EntityData<T>` entries (on entity deletion)

**What you should clean up manually:**
- Dynamic game event listeners (via `IHandle.Cancel()`)
- Any external resources or connections

## Client Lifecycle

```
Player connects
    │
    ├── OnClientPutInServer()   ← Initial connection
    │
    ├── OnClientFullConnect()   ← Fully in-game, can interact
    │
    │   (player is active in-game)
    │
    └── OnClientDisconnect()    ← Player leaves
```

### Example: Player Tracking

```csharp
private readonly HashSet<int> _activePlayers = new();

public override HookResult OnClientFullConnect(ClientFullConnectEvent ev)
{
    _activePlayers.Add(ev.Slot);
    Console.WriteLine($"Player connected: slot {ev.Slot}");
    return HookResult.Handled;
}

public override HookResult OnClientDisconnect(ClientDisconnectedEvent ev)
{
    _activePlayers.Remove(ev.Slot);
    Console.WriteLine($"Player disconnected: slot {ev.Slot}");
    return HookResult.Handled;
}
```

## See Also

- [Plugin Base](../api-reference/plugin-base) — All lifecycle hooks
- [Precaching](../api-reference/precaching) — Resource precaching
- [Console Commands](../api-reference/console-commands) — ConVar setup in OnStartupServer
