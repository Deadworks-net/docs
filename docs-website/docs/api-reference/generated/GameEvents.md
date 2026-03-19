---
title: "Game Events"
sidebar_label: "Game Events"
sidebar_position: 13
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# GameEvents

> **Namespace:** `DeadworksManaged.Api`

Static API for registering/removing dynamic Source 2 game event listeners and creating new events.

## Methods

| Method | Description |
|--------|-------------|
| `AddListener(string arg0, GameEventHandler arg1)` | Registers a dynamic listener for the named game event. Returns a handle that cancels the listener when disposed or cancelled. |
| `RemoveListener(string arg0, GameEventHandler arg1)` | Removes a previously registered dynamic game event listener. |
| `Create(string arg0, bool arg1)` | Creates a game event. Returns null if the event type doesn't exist. Must be fired or freed. |

---

## GameEvent

> **Namespace:** `DeadworksManaged.Api`

Represents a Source 2 game event fired by the engine. Read field values via Get* methods; write via Set* methods.

### Properties

| Property | Description |
|----------|-------------|
| `Name` | The event name (e.g. "player_death"). |

### Methods

| Method | Description |
|--------|-------------|
| `GetBool(string arg0, bool arg1)` | Gets a bool field from this event. |
| `GetInt(string arg0, int arg1)` | Gets an int field from this event. |
| `GetFloat(string arg0, float arg1)` | Gets a float field from this event. |
| `GetString(string arg0, string arg1)` | Gets a string field from this event. |
| `SetBool(string arg0, bool arg1)` | Sets a bool field on this event. |
| `SetInt(string arg0, int arg1)` | Sets an int field on this event. |
| `SetFloat(string arg0, float arg1)` | Sets a float field on this event. |
| `SetString(string arg0, string arg1)` | Sets a string field on this event. |
| `GetUint64(string arg0, ulong arg1)` | Gets a uint64 field from this event. |
| `GetPlayerController(string arg0)` | Gets a player controller entity referenced by an ehandle field in this event. |
| `GetPlayerPawn(string arg0)` | Gets a player pawn entity referenced by an ehandle field in this event. |
| `GetEHandle(string arg0)` | Gets an entity by resolving the entity handle stored in the named event field. |

---

## GameEventWriter

> **Namespace:** `DeadworksManaged.Api`

Wraps a newly created IGameEvent for setting fields and firing.

### Methods

| Method | Description |
|--------|-------------|
| `Fire(bool arg0)` | Fires the event. After firing, the event is owned by the engine and must not be used. |

---

## GameEventHandler

> **Namespace:** `DeadworksManaged.Api`

Delegate type for dynamic game event listener callbacks registered via `GameEvents`.

---

## GameEventHandlerAttribute

> **Namespace:** `DeadworksManaged.Api`

Marks a method to be auto-registered as a Source 2 game event handler for the named event.

### Properties

| Property | Description |
|----------|-------------|
| `EventName` | The Source 2 game event name to listen for (e.g. "player_death"). |
