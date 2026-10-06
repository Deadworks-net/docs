---
title: "Plugin lifecycle"
sidebar_label: "Plugin lifecycle"
---

# Plugin lifecycle

Deadworks calls methods on your plugin at set moments: when the plugin loads, when a map starts, and when a player joins or leaves. Override the ones you need.

## Server lifecycle

```text
Server start
    │
    ├── OnLoad(isReload: false)     ← Plugin loaded
    │
    │   ┌──────── EVERY MAP ──────────────┐
    │   │                                 │
    │   │  OnStartupServer()              │ ← Map starting, set game settings here
    │   │  OnPrecacheResources()          │ ← Precache models, particles, heroes
    │   │                                 │
    │   │  Players join and leave         │ ← See the player lifecycle below
    │   │  OnGameFrame() every tick       │
    │   │                                 │
    │   └─────────────────────────────────┘
    │
    └── OnUnload()                  ← Plugin turned off, or its file replaced
```

- **`OnLoad`** runs once when your plugin loads. Your config and `Timer` are ready to use.
- **`OnStartupServer`** runs every time a map starts. Change [game settings](../features/convars) here.
- **`OnPrecacheResources`** runs while every map loads. It is the only place [precaching](../features/precaching) works.
- **`OnGameFrame`** runs every tick.
- **`OnUnload`** runs when your plugin is turned off or replaced.

:::warning
`OnUnload` doesn't run when the server shuts down. Data saved only in `OnUnload` is lost on shutdown, so save it as it changes.
:::

## Player lifecycle

```text
Player connects
    │
    ├── OnClientConnect()         ← Connecting. Return false to refuse them
    │
    ├── OnClientPutInServer()     ← Put on the server. Bots start here
    │
    ├── OnClientFullConnect()     ← In the game. Safe to use their controller
    │
    │   (player is playing)
    │
    ├── OnClientDisconnecting()   ← Leaving. Their controller and hero still exist
    │
    └── OnClientDisconnect()      ← Gone
```

`OnClientFullConnect` is the one most plugins want. See [Players](../features/players#do-something-when-a-player-joins-or-leaves) for an example.

When the map changes, players stay connected. Every player still goes through the whole list again: the two disconnect methods, then the connect methods on the new map.

## Reloading a plugin

Deadworks watches the `plugins/` folder. When you replace your plugin's file while the server is running, Deadworks swaps the plugin without a restart:

1. `OnUnload()` runs on the old plugin.
2. `OnLoad(isReload: true)` runs on the new one.

:::note
A plugin loaded this way doesn't get `OnStartupServer` or `OnPrecacheResources` until the next map starts.
:::

## What Deadworks cleans up for you

When your plugin unloads, Deadworks removes its:

- timers
- commands and ConVars
- methods marked with an attribute, such as `[GameEventHandler]` or `[EntityOutputHook]`
- zones

Stop anything else your plugin started in `OnUnload`. This includes hooks added in code, such as `EntityIO.HookOutput`, and open connections.

## See also

- [Players](../features/players): run code when players join or leave.
- [How Deadworks works](how-deadworks-works): how plugins fit into the server.
