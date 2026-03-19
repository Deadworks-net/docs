---
title: "Players Utility"
sidebar_label: "Players Utility"
sidebar_position: 31
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# Players

> **Namespace:** `DeadworksManaged.Api`

Static helpers to enumerate all connected player controllers and pawns.

## Fields

| Property | Description |
|----------|-------------|
| `MaxSlots` | Maximum number of player slots on the server. |

## Methods

| Method | Description |
|--------|-------------|
| `GetAll()` | Returns all currently connected player controllers. |
| `GetAllPawns()` | Returns the hero pawn for every connected player that has one. |
| `FromSlot(int arg0)` | Returns the player controller in the given slot, or null if the slot is empty. |
