---
title: "DeadworksPluginBase"
sidebar_label: "DeadworksPluginBase"
sidebar_position: 1
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# DeadworksPluginBase

> **Namespace:** `DeadworksManaged.Api`

Optional base class for plugins. Provides direct access to `ITimer` via a `Timer` property without needing interface casts or using aliases.

## Properties

| Property | Description |
|----------|-------------|
| `Timer` | Per-plugin timer service. |

---

## IDeadworksPlugin

> **Namespace:** `DeadworksManaged.Api`

Core plugin interface. Implement this (or extend `DeadworksPluginBase`) to create a Deadworks plugin. Methods have default no-op implementations so you only need to override what you use.

### Properties

| Property | Description |
|----------|-------------|
| `Name` | Display name of the plugin. |
| `Timer` | Per-plugin timer service. Use to schedule delayed or repeating actions. |

### Methods

| Method | Description |
|--------|-------------|
| `OnLoad(bool arg0)` | Called when the plugin is loaded or hot-reloaded. |
| `OnUnload()` | Called when the plugin is unloaded. Clean up hooks and timers here. |
| `OnPrecacheResources()` | Called during map load to precache resources (particles, models, etc). Use `String)` to register resources. |
| `OnStartupServer()` | Called when the server starts up (new map load). |
| `OnGameFrame(bool arg0, bool arg1, bool arg2)` | Called every server frame. |
| `OnTakeDamage(TakeDamageEvent arg0)` | Called when an entity takes damage. Return Stop to block the damage from being applied. |
| `OnModifyCurrency(ModifyCurrencyEvent arg0)` | Called when a player's currency is about to be modified. Return Stop to block the currency change. |
| `OnChatMessage(ChatMessage arg0)` | Called when a player sends a chat message. Return Stop to block the message from being processed further. |
| `OnClientConCommand(ClientConCommandEvent arg0)` | Called when a client sends a console command (e.g. selecthero, changeteam, respawn). Return Stop to block the command from being processed by the engine. |
| `OnClientPutInServer(ClientPutInServerEvent arg0)` | Called when a client is put into the server (initial connection). |
| `OnClientFullConnect(ClientFullConnectEvent arg0)` | Called when a client has fully connected and is in-game. |
| `OnClientDisconnect(ClientDisconnectedEvent arg0)` | Called when a client disconnects from the server. |
| `OnEntityCreated(EntityCreatedEvent arg0)` | Called when an entity is created. |
| `OnEntitySpawned(EntitySpawnedEvent arg0)` | Called when an entity has been fully spawned. |
| `OnEntityDeleted(EntityDeletedEvent arg0)` | Called when an entity is deleted. |
| `OnEntityStartTouch(EntityTouchEvent arg0)` | Called when an entity starts touching another entity (trigger zone entry, collision). |
| `OnEntityEndTouch(EntityTouchEvent arg0)` | Called when an entity stops touching another entity. |
