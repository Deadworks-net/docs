---
title: "CCitadelPlayerController"
sidebar_label: "CCitadelPlayerController"
sidebar_position: 6
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# CCitadelPlayerController

> **Namespace:** `DeadworksManaged.Api`

Deadlock-specific player controller. Provides access to player data, hero selection, team changes, and console messaging.

## Methods

| Method | Description |
|--------|-------------|
| `GetHeroPawn()` | Returns the player's current hero pawn, or null if they have none. |
| `ChangeTeam(int arg0)` | Moves this player to the specified team. |
| `SelectHero(Heroes arg0)` | Forces the player to select the specified hero. |
| `PrintToConsole(string arg0)` | Sends a message to this player's console via "echo" client command. |
| `PrintToConsoleAll(string arg0)` | Sends a message to all connected players' consoles. |

---

## CBasePlayerController

> **Namespace:** `DeadworksManaged.Api`

Base player controller entity. Manages the link between a player slot and their pawn.

### Methods

| Method | Description |
|--------|-------------|
| `SetPawn(CBasePlayerPawn arg0, bool arg1, bool arg2, bool arg3, bool arg4)` | Assigns a new pawn to this controller, optionally transferring team and movement state. |

---

## PlayerDataGlobal

> **Namespace:** `DeadworksManaged.Api`

Wraps the networked PlayerDataGlobal_t struct on a player controller — provides read access to stats like kills, gold, level, and damage.
