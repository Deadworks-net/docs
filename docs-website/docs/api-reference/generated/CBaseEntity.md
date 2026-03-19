---
title: "CBaseEntity"
sidebar_label: "CBaseEntity"
sidebar_position: 4
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# CBaseEntity

> **Namespace:** `DeadworksManaged.Api`

Base managed wrapper for all Source 2 entities. Provides common operations: health, team, lifecycle, modifiers, schema access.

## Properties

| Property | Description |
|----------|-------------|
| `DesignerName` | The designer/map name (e.g. "npc_boss_tier3", "player"). |
| `Classname` | The C++ DLL class name (e.g. "CCitadelPlayerPawn", "CBaseEntity"). |
| `EntityHandle` | Gets the entity handle (CEntityHandle as uint32) for this entity. |
| `EntityIndex` | Gets the entity index (lower 14 bits of the handle). |

## Methods

| Method | Description |
|--------|-------------|
| `CreateByName(string arg0)` | Creates a new entity by class name (e.g. "info_particle_system"). Returns null on failure. |
| `FromHandle(uint arg0)` | Gets an entity by its entity handle (CEntityHandle as uint32). Returns null if invalid. |
| `FromIndex(int arg0)` | Gets an entity by its global entity index. Returns null if the index is invalid or the entity doesn't exist. |
| `Is<T>()` | Check if this entity's native type matches T's class name. |
| `As<T>()` | Cast this entity to T if the native type matches, otherwise null. |
| `Remove()` | Marks this entity for removal at the end of the current frame (UTIL_Remove). |
| `Spawn()` | Queues and executes entity spawn. |
| `Spawn(void* arg0)` | Queues and executes entity spawn with CEntityKeyValues. |
| `Teleport(Vector3? arg0, Vector3? arg1, Vector3? arg2)` | Teleports this entity. Pass null for any parameter to leave it unchanged. |
| `AcceptInput(string arg0, CBaseEntity arg1, CBaseEntity arg2, string arg3)` | Fires an entity input (e.g. "Start", "Stop", "SetParent"). |
| `SetParent(CBaseEntity arg0)` | Sets this entity's parent via AcceptInput("SetParent", activator: parent, value: "!activator"). |
| `ClearParent()` | Clears this entity's parent. |
| `AddModifier(string arg0, KeyValues3 arg1, CBaseEntity arg2, CBaseEntity arg3, int arg4)` | Adds a modifier by VData name (e.g. "modifier_ui_hud_message"). |
| `EmitSound(string arg0, int arg1, float arg2, float arg3)` | Plays a sound event on this entity. |
| `Hurt(float arg0, CBaseEntity arg1, CBaseEntity arg2, CBaseEntity arg3, int arg4)` | Applies damage to this entity using UTIL_InflictGenericDamage (convenience wrapper around `CTakeDamageInfo)`). |
| `TakeDamage(CTakeDamageInfo arg0)` | Applies damage to this entity using an existing `CTakeDamageInfo` struct. |
| `GetField<T>(ReadOnlySpan<byte> arg0, ReadOnlySpan<byte> arg1)` | Read any schema field by class and field name. For repeated access, prefer a static `SchemaAccessor` instead. |
| `SetField<T>(ReadOnlySpan<byte> arg0, ReadOnlySpan<byte> arg1, T arg2)` | Write any schema field by class and field name. For repeated access, prefer a static `SchemaAccessor` instead. |

---

## NativeEntity

> **Namespace:** `DeadworksManaged.Api`

Base class for all managed wrappers around native C++ entity/object pointers.

### Properties

| Property | Description |
|----------|-------------|
| `Handle` | Raw pointer to the native object. |
| `IsValid` | True if the pointer is non-null. |

---

## CGameSceneNode

> **Namespace:** `DeadworksManaged.Api`

Scene graph node that holds the entity's world transform and absolute origin.

---

## CBodyComponent

> **Namespace:** `DeadworksManaged.Api`

Body component attached to an entity, providing access to the `CGameSceneNode` and world position.

---

## CEntitySubclassVDataBase

> **Namespace:** `DeadworksManaged.Api`

Wraps CEntitySubclassVDataBase — the VData subclass pointer stored on an entity, providing its design-time name.
