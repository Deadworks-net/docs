---
title: "Plugin Lifecycle"
sidebar_label: "Plugin Lifecycle"
---

# Plugin Lifecycle

This page explains when Deadworks calls each of a plugin's lifecycle methods, from loading to unloading, and what it cleans up for you.

## Lifecycle Flow

```
Server start
    │
    ├── OnLoad(isReload: false)     ← Plugin loaded
    │
    │   ┌──────── EVERY MAP ──────────────┐
    │   │                                 │
    │   │  OnStartupServer()              │ ← Map starting, set convars here
    │   │  OnPrecacheResources()          │ ← Precache particles, models, heroes
    │   │                                 │
    │   │  OnClientConnect()              │
    │   │  OnClientPutInServer()          │
    │   │  OnGameFrame() every tick       │
    │   │  ... other hooks ...            │
    │   └─────────────────────────────────┘
    │
    ├── OnUnload()                  ← Plugin disabled, or its DLL replaced
    │
    └── (Hot-reload) → OnLoad(isReload: true) on a new instance
```

## Startup Phase

### OnLoad

Called when the plugin is loaded: at server start, by `dw_plugin enable`, or when its DLL in `plugins/` changes while the server runs. `isReload` is `true` when the DLL was loaded because the file changed, including a DLL newly copied into `plugins/`.

The plugin's config is loaded and `Timer` is ready before `OnLoad` runs. Its commands and attribute hooks are registered right after `OnLoad` returns.

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

:::note
A plugin loaded while a map is already running (hot-reloaded or enabled with `dw_plugin enable`) doesn't get `OnStartupServer` or `OnPrecacheResources` until the next map loads.
:::

### OnStartupServer

Called each time a map starts, before `OnPrecacheResources`. Set game convars here:

```csharp
public override void OnStartupServer()
{
    ConVar.Find("citadel_trooper_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_allow_duplicate_heroes")?.SetInt(1);
}
```

### OnPrecacheResources

Called during every map load. Precache all resources (particles, models, heroes) here: `Precache.AddResource` and `Precache.AddHero` do nothing when called at any other time.

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
}
```

See [Precaching](../api-reference/precaching).

## Runtime Phase

During runtime, your plugin responds to events through hooks and registered commands.

### Hot-Reloading

Deadworks watches the `plugins/` folder. When a plugin's DLL there is replaced while the server runs:

1. The old instance's timers, commands and attribute hooks are removed.
2. `OnUnload()` is called on the old instance.
3. A new instance is created, its config is loaded, and `OnLoad(isReload: true)` is called on it.
4. The new instance's commands and attribute hooks are registered.

Anything your plugin registered in code rather than with an attribute is not removed for you. Cancel it in `OnUnload()`, or the old and new instances both keep running it.

## Shutdown Phase

### OnUnload

Called when the plugin is unloaded: by `dw_plugin disable`, or before a hot reload replaces it.

```csharp
private readonly CancellationTokenSource _cts = new();

public override void OnUnload()
{
    _cts.Cancel(); // stop background work started in OnLoad
    Console.WriteLine($"[{Name}] Unloaded!");
}
```

:::note
`OnUnload` isn't called when the server shuts down. Don't rely on it to save data.
:::

**What's cleaned up automatically** (before `OnUnload` runs):
- Timers from `Timer.Once`, `Timer.Every` and `Timer.Sequence`
- Commands and `[ConVar]` properties
- `[GameEventHandler]`, `[NetMessageHandler]`, `[EntityInputHook]` and `[EntityOutputHook]` methods
- `Zone`s the plugin created
- Converters registered with `CommandConverters`, and permission and penalty stores it registered
- The lifecycle overrides on this page stop being called

`EntityData<T>` entries are removed when their entity is deleted.

A hot reload runs `OnUnload` and then `OnLoad(isReload: true)` off the game thread; don't touch entities there, or defer it with `Timer.NextTick`.

**What you should clean up manually:**
- Handles returned by `GameEvents.AddListener`, `NetMessages.HookOutgoing`/`HookIncoming` and `EntityIO.HookInput`/`HookOutput` (call `IHandle.Cancel()`)
- Subscriptions to static events, such as `UI.ClientResync`
- Any external resources or connections

## Client Lifecycle

```
Player connects
    │
    ├── OnClientConnect()         ← Connecting; return false to refuse (not called for bots)
    │
    ├── OnClientPutInServer()     ← Initial connection; bots start here (args.IsBot)
    │
    ├── OnClientFullConnect()     ← Fully in-game, can interact
    │
    │   (player is active in-game)
    │
    ├── OnClientDisconnecting()   ← Leaving; controller and hero still intact
    │
    └── OnClientDisconnect()      ← Player has left
```

A map change doesn't disconnect anyone, but every player goes through these events again: `OnClientDisconnecting` and `OnClientDisconnect` with `args.IsMapChange` set to `true`, then the connect events on the new map with `args.IsMapChangeReconnect` set to `true`. `OnClientFullConnect` is called each time a player finishes loading a map, and for bots too.

### Example: Player Tracking

```csharp
private readonly HashSet<int> _activePlayers = new();

public override void OnClientFullConnect(ClientFullConnectEvent args)
{
    _activePlayers.Add(args.Slot);
    Console.WriteLine($"Player connected: slot {args.Slot}");
}

public override void OnClientDisconnect(ClientDisconnectedEvent args)
{
    _activePlayers.Remove(args.Slot);
    Console.WriteLine($"Player disconnected: slot {args.Slot}");
}
```

> You may use [`Players`](../api-reference/players) instead to access all players

## Permission and Admin Callbacks (Coming Soon)

**Coming soon:** these overrides come with the permission system. Like the others on this page, they stop when your plugin unloads or hot-reloads, so there's nothing to unsubscribe.

| Override | Called when |
|----------|-------------|
| `OnClientAuthorized(ClientAuthorizedEvent args)` | Steam confirms a player, once per connection (not again after a map change), a few seconds after they join. `args.Slot`, `args.SteamId64`, `args.Controller` (may be `null`). See [Steam Verification](../api-reference/admin-api#steam-verification). |
| `OnPermissionsChanged(ulong? steamId64)` | After a permissions reload, any grant or revoke, when Steam confirms a player, and when a custom store's entry for a player arrives. `null` means everyone. See [Reacting to Changes](../api-reference/permissions#reacting-to-changes). |
| `OnPenaltyAdded(Penalty penalty)` | A ban, gag or mute is added. See [Penalties](../api-reference/admin-api#penalties). |
| `OnPenaltyRemoved(Penalty penalty)` | A penalty is lifted, replaced or expires. |
| `OnAdminAction(AdminLogEntry entry)` | An admin action is logged through `AdminActivity` (the Admin plugin's commands, or any plugin that calls it). See [Admin Activity](../api-reference/admin-api#admin-activity). |

## Async Work — Get Back On the Game Thread

After an `await`, C# may resume on a thread-pool thread. Touching entities or calling the engine from there can crash the server. After an `await`, run game-touching code through `Timer.NextTick(...)`, which can be called from any thread:

```csharp
public override void OnLoad(bool isReload)
{
    // OnLoad is not async — kick off the work and don't await
    _ = FetchAndAnnounceAsync();
}

private async Task FetchAndAnnounceAsync()
{
    using var client = new HttpClient();
    var response = await client.GetStringAsync("https://api.example.com/message");

    // At this point we may be on a non-game thread.
    Timer.NextTick(() =>
    {
        // Safe to interact with the game here.
    });
}
```

The same rule applies to `Task.Delay`, `Task.Run`, file I/O, anything that yields. If you're not sure whether the continuation is on the game thread, route it through `Timer.NextTick`.

:::tip
Inside a [`[Command]`](../api-reference/commands#when-a-command-fails) method, code after an `await` already continues on the game thread.
:::

## Hot-Reload Gotchas

Hot-reload replaces the plugin assembly while the server keeps running. This is useful during development, but there are some pitfalls:

- **Cancel long-running work in `OnUnload`.** Timers and attribute hooks are removed for you. Anything else, such as a `CancellationTokenSource`, `FileSystemWatcher`, socket or hook registered in code, has to be cancelled or disposed manually.
- **Static state doesn't carry over.** The new DLL is loaded separately from the old one, so your plugin's static fields start empty after a reload.

## Console Output on Windows

If you launch `deadworks.exe` from Windows Terminal or PowerShell and the console window keeps overwriting its own top line (showing only `N/31 on map dl_midtown` no matter how far up you scroll), the terminal isn't compatible with Deadlock's progress output. Launch it from `cmd.exe` (the classic console host) instead.

## See Also

- [First Plugin](../getting-started/first-plugin) — Starting from `DeadworksPluginBase`
- [Precaching](../api-reference/precaching) — Resource precaching
- [ConVars](../api-reference/convars) — ConVar setup in `OnStartupServer`
- [Server Hosting](server-hosting) — Running a dedicated server
