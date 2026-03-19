---
title: "CCitadelPlayerPawn"
sidebar_label: "CCitadelPlayerPawn"
sidebar_position: 7
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# CCitadelPlayerPawn

> **Namespace:** `DeadworksManaged.Api`

Deadlock hero pawn. The in-game physical representation of a player. Provides currency, abilities, movement state, stamina, and eye angles.

## Properties

| Property | Description |
|----------|-------------|
| `EyeAngles` | Networked eye angles (quantized to 11 bits, ~0.18° precision). Use ViewAngles for raw precision. |
| `EyePosition` | Eye position (AbsOrigin + ViewOffset). This is where the camera sits. |
| `CameraAngles` | Client camera angles for SourceTV/spectating. |
| `ViewAngles` | Raw server-side view angles from CUserCmd (v_angle). Full float precision, no quantization. |

## Methods

| Method | Description |
|--------|-------------|
| `ModifyCurrency(ECurrencyType arg0, int arg1, ECurrencySource arg2, bool arg3, bool arg4, bool arg5)` | Adds or removes currency from this pawn (e.g. gold, ability points). Use negative *amount* to spend. |
| `ResetHero(bool arg0)` | Full pawn-level hero reset: clears loadout, removes items, re-adds starting abilities from VData, resets level. |
| `RemoveAbility(string arg0)` | Removes an ability from this pawn by internal ability name. Returns true on success. |
| `AddAbility(string arg0, UInt16 arg1)` | Adds an ability to this pawn by internal ability name into the given slot. Returns the new ability entity, or null on failure. |

---

## CBasePlayerPawn

> **Namespace:** `DeadworksManaged.Api`

Base player pawn entity. Provides access to the owning controller.

---

## CCitadelAbilityComponent

> **Namespace:** `DeadworksManaged.Api`

Ability component on a player pawn. Provides access to stamina/ability resources and the list of equipped abilities.

---

## AbilityResource

> **Namespace:** `DeadworksManaged.Api`

Wraps AbilityResource_t — stamina or ability resource with latch-based networking. This is an embedded struct, not an entity — setters use raw pointer writes since NotifyStateChanged requires the owning entity, not the struct address.

---

## CCitadel_Ability_Jump

> **Namespace:** `DeadworksManaged.Api`

Jump ability entity tracking air jump/wall jump counters for a hero.

---

## CCitadel_Ability_Dash

> **Namespace:** `DeadworksManaged.Api`

Dash ability entity tracking consecutive air/down dash counters for a hero.
