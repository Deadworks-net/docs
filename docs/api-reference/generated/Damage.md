---
title: "Damage"
sidebar_label: "Damage"
sidebar_position: 19
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# CTakeDamageInfo

> **Namespace:** `DeadworksManaged.Api`

Wraps the native CTakeDamageInfo damage descriptor. Can be owned (created via constructor, must be Disposed) or non-owning (obtained from an OnTakeDamage hook). Exposes attacker, inflictor, ability, damage amount, type, and flags.

## Constructors

| Method | Description |
|--------|-------------|
| `CTakeDamageInfo(float arg0, CBaseEntity arg1, CBaseEntity arg2, CBaseEntity arg3, int arg4)` | Creates a new native CTakeDamageInfo. Must be disposed after use. |

## Methods

| Method | Description |
|--------|-------------|
| `FromExisting(IntPtr arg0)` | Wraps an existing native CTakeDamageInfo pointer (non-owning, e.g. from OnTakeDamage hook). |

---

## TakeDamageFlags

> **Namespace:** `DeadworksManaged.Api`

Flags that modify how damage is applied, processed, or reported (suppress effects, force death, crit immunity, etc.).

---

## TakeDamageEvent

> **Namespace:** `DeadworksManaged.Api`

Event data passed to `TakeDamageEvent)`. Contains the target entity and full damage info.

---

## ModifyCurrencyEvent

> **Namespace:** `DeadworksManaged.Api`

Event data passed to `ModifyCurrencyEvent)`. Contains the pawn, currency type, amount, and source of the change.
