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
| `Timer` | `ITimer` | Per-plugin [timer service](timers) for scheduling actions |

### Lifecycle Hooks

| Method | Description |
|--------|-------------|
| `OnLoad(bool isReload)` | Called when plugin is loaded. `isReload` is `true` during hot-reload |
| `OnUnload()` | Called when plugin is unloaded. Clean up hooks and timers here |
| `OnPrecacheResources()` | Called during map load. Use [`Precache.AddResource()`](precaching) here |
| `OnStartupServer()` | Called when the server starts (new map load) |
| `OnGameFrame(bool simulating, bool firstTick, bool lastTick)` | Called every server frame. `simulating` is true during active gameplay |

### Server Event Hooks

| Method | Description |
|--------|-------------|
| `OnTakeDamage(TakeDamageEvent)` | Entity takes damage. Return `HookResult.Stop` to block. See [Damage](damage) |
| `OnModifyCurrency(ModifyCurrencyEvent)` | Player currency modified. Return `Stop` to block. See [Players](players) |
| `OnChatMessage(ChatMessage)` | Player sends chat message. Return `Stop` to block |
| `OnClientConCommand(ClientConCommandEvent)` | Client sends console command. Return `Stop` to block |

### Client Lifecycle Hooks

| Method | Description |
|--------|-------------|
| `OnClientPutInServer(ClientPutInServerEvent)` | Client initially connected to server |
| `OnClientFullConnect(ClientFullConnectEvent)` | Client fully connected and in-game |
| `OnClientDisconnect(ClientDisconnectedEvent)` | Client disconnected |

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

| Value | Description |
|-------|-------------|
| `HookResult.Handled` | Event was consumed, but allow other plugins to process |
| `HookResult.Stop` | Block the event entirely — no further processing |

## IDeadworksPlugin

The core interface that `DeadworksPluginBase` implements. You can implement this directly instead of inheriting from the base class, but the base class is recommended as it provides default no-op implementations and the `Timer` property.

## IPluginConfig\<T\>

Interface for plugins with JSON configuration. See [Configuration](configuration).

```csharp
public class MyPlugin : DeadworksPluginBase, IPluginConfig<MyConfig>
{
    public MyConfig Config { get; set; } = new();
}
```

## See Also

- [Plugin Lifecycle Guide](../guides/plugin-lifecycle) — Full load/unload flow
- [Chat Commands](chat-commands) — Attribute-based command registration
- [Timers](timers) — Per-plugin timer service
