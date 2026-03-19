---
title: "Entities"
sidebar_label: "Entities"
sidebar_position: 5
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# Entities

> **Namespace:** `DeadworksManaged.Api`

Provides enumeration over all server entities. Uses the existing GetEntityByIndex native callback.

## Properties

| Property | Description |
|----------|-------------|
| `All` | Enumerates all valid entities on the server. |

## Methods

| Method | Description |
|--------|-------------|
| `ByClass<T>()` | Enumerates all entities whose native DLL class matches `T`. |
| `ByDesignerName(string name)` | Enumerates all entities with the given designer name (e.g. `"trigger_multiple"`, `"npc_boss_tier3"`). |

---

## EntityData

> **Namespace:** `DeadworksManaged.Api`

Dictionary-like store that associates arbitrary per-entity data with entities by their handle. Automatically removes entries when an entity is deleted.

---

## EntityDataRegistry

> **Namespace:** `DeadworksManaged.Api`

Global registry of all active `EntityData` stores. Notifies them when an entity is deleted to purge stale entries.

---

## IEntityData

> **Namespace:** `DeadworksManaged.Api`

Internal interface for entity-keyed data stores, allowing cleanup on entity deletion.
