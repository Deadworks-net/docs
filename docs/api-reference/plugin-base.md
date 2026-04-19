---
title: "Plugin Base"
sidebar_label: "Plugin Base"
---

# Plugin Base

> **Namespace:** `DeadworksManaged.Api`

## DeadworksPluginBase

The recommended base class for all plugins. Provides the `Timer` property and default no-op implementations for all lifecycle hooks.

```csharp
public class MyPlugin : DeadworksPluginBase
{
    public override string Name => "My Plugin";
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Name` | `string` | Display name of the plugin (abstract — must override) |
| `Timer` | `ITimer` | Per-plugin [timer service](timers.md) for scheduling actions |

### Lifecycle Hooks

| Method | Description |
|--------|-------------|
| `OnLoad(bool isReload)` | Called when plugin is loaded. `isReload` is `true` during hot-reload |
| `OnUnload()` | Called when plugin is unloaded. Clean up hooks and timers here |
| `OnPrecacheResources()` | Called during map load. Use [`Precache.AddResource(.md)`](precaching.md) here |
| `OnStartupServer()` | Called when the server starts (new map load) |
| `OnGameFrame(bool simulating, bool firstTick, bool lastTick)` | Called every server frame (~64 Hz). `simulating` is true during active gameplay; the other flags tag the first/last frame of a contiguous simulation window. Prefer this over `Timer.Every(1.Ticks(), …)` when you need per-tick logic. |
| `OnConfigReloaded()` | Called when plugin config is reloaded at runtime |

### Server Event Hooks

| Method | Description |
|--------|-------------|
| `OnTakeDamage(TakeDamageEvent)` | Entity takes damage. Return `HookResult.Stop` to block. See [Damage](damage.md) |
| `OnModifyCurrency(ModifyCurrencyEvent)` | Player currency modified. Return `Stop` to block. See [Players](players.md) |
| `OnChatMessage(ChatMessage)` | Player sends chat message. Return `Stop` to block |
| `OnClientConCommand(ClientConCommandEvent)` | Client sends console command. Return `Stop` to block |
| `OnAddModifier(AddModifierEvent)` | Modifier about to be added. Return `Stop` to block |
| `OnAbilityAttempt(AbilityAttemptEvent)` | Ability execution attempted |
| `OnProcessUsercmds(ProcessUsercmdsEvent)` | User commands processed (every tick per player) |

### Client Lifecycle Hooks

| Method | Return | Description |
|--------|--------|-------------|
| `OnClientConnect(ClientConnectEvent)` | `bool` | Fires before `OnClientPutInServer`. Return `false` to **reject** the connection. Event exposes `Slot`, `Name`, `SteamId`, `IpAddress`. |
| `OnClientPutInServer(ClientPutInServerEvent)` | `void` | Client has entered the server |
| `OnClientFullConnect(ClientFullConnectEvent)` | `void` | Client fully connected and in-game |
| `OnClientDisconnect(ClientDisconnectedEvent)` | `void` | Client disconnected |
| `OnSignonState(ref string addons)` | `void` | Fires during signon handshake. Mutate `addons` to inject addon metadata sent to the client. |
| `OnCheckTransmit(CheckTransmitEvent)` | `void` | Fires per-player every tick. Call `args.Hide(entity)` to prevent an entity from being networked to that specific player (e.g. show UI worldtext only to its owner). Must be called every tick the entity should stay hidden. |

### Entity Lifecycle Hooks

| Method | Description |
|--------|-------------|
| `OnEntityCreated(EntityCreatedEvent)` | New entity created |
| `OnEntitySpawned(EntitySpawnedEvent)` | Entity fully spawned |
| `OnEntityDeleted(EntityDeletedEvent)` | Entity about to be deleted |
| `OnEntityStartTouch(EntityTouchEvent)` | Two entities begin touching |
| `OnEntityEndTouch(EntityTouchEvent)` | Two entities stop touching |

## HookResult

Return values for hooks and event handlers:

| Value | Raw | Description |
|-------|-----|-------------|
| `HookResult.Continue` | 0 | Default — event proceeds normally. Return this from passive observer hooks like `OnTakeDamage` when you don't want to change behavior. |
| `HookResult.Stop` | 1 | Block the event entirely — no further processing. |
| `HookResult.Handled` | 2 | Event consumed — same effect as `Stop` for framework purposes. Semantic difference only. |

> **Practical tip:** for **observer** hooks (`OnTakeDamage`, `OnAddModifier`, `OnChatMessage`, `OnClientConCommand`), return `Continue` unless you explicitly want to block. For **chat-command** handlers and similar "I answered this" methods, return `Handled`. `Stop` and `Handled` currently behave identically at the framework layer.

## IDeadworksPlugin

The core interface that `DeadworksPluginBase` implements. You can implement this directly instead of inheriting from the base class, but the base class is recommended as it provides default no-op implementations and the `Timer` property.

## IPluginConfig\<T\>

Interface for plugins with JSON configuration. See [Configuration](configuration.md).

```csharp
public class MyPlugin : DeadworksPluginBase, IPluginConfig<MyConfig>
{
    public MyConfig Config { get; set; } = new();
}
```

## See Also

- [Plugin Lifecycle Guide](../guides/plugin-lifecycle.md) — Full load/unload flow
- [Chat Commands](chat-commands.md) — Attribute-based command registration
- [Timers](timers.md) — Per-plugin timer service
