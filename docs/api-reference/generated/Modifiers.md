---
title: "Modifiers"
sidebar_label: "Modifiers"
sidebar_position: 8
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# CModifierProperty

> **Namespace:** `DeadworksManaged.Api`

Wraps CModifierProperty — manages modifier state bits on an entity. Uses CNetworkVarChainer to chain network notifications to the owning entity.

## Methods

| Method | Description |
|--------|-------------|
| `SetModifierState(EModifierState arg0, bool arg1)` | Sets or clears the specified modifier state bit on this entity, notifying the network if changed. |
| `HasModifierState(EModifierState arg0)` | Returns true if the specified modifier state bit is currently set on this entity. |

---

## EModifierState

> **Namespace:** `DeadworksManaged.Api`

All modifier state flags that can be toggled on an entity via `CModifierProperty`. Contains 302 values covering movement, visibility, combat, and hero-specific states.

---

## CBaseModifier

> **Namespace:** `DeadworksManaged.Api`

Wraps a native CBaseModifier instance — a buff/debuff applied to an entity via `Int32)`.

---

## EKnockDownTypes

> **Namespace:** `DeadworksManaged.Api`

Knockdown animation type applied to a hero.
