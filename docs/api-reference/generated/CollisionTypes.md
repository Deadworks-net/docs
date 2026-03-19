---
title: "Collision Types"
sidebar_label: "Collision Types"
sidebar_position: 18
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# RayType_t

> **Namespace:** `DeadworksManaged.Api`

Shape type used for VPhys2 trace queries.

---

## CollisionGroup

> **Namespace:** `DeadworksManaged.Api`

Collision group that determines which objects interact with each other in the physics simulation.

---

## InteractionLayer

> **Namespace:** `DeadworksManaged.Api`

Individual content/interaction layers used to build `MaskTrace` bitmasks for trace queries.

---

## MaskTrace

> **Namespace:** `DeadworksManaged.Api`

Bitmask combining `InteractionLayer` values to specify which content layers a trace interacts with.

---

## RnQueryObjectSet

> **Namespace:** `DeadworksManaged.Api`

Bitmask controlling which object sets (static, dynamic, locatable) are included in a trace query.

---

## CollisionFunctionMask_t

> **Namespace:** `DeadworksManaged.Api`

Flags controlling which collision callbacks are enabled on a physics object.

---

## NameMatchType

> **Namespace:** `DeadworksManaged.Api`

String comparison mode used when matching entity designer names in trace results.

---

## RnCollisionAttr_t

> **Namespace:** `DeadworksManaged.Api`

Collision attributes of a physics body: interaction layer masks, entity/owner IDs, and collision group.

---

## RnQueryShapeAttr_t

> **Namespace:** `DeadworksManaged.Api`

Query attributes for a VPhys2 shape trace: which layers and object sets to consider, entities to skip, and flags like `HitSolid` and `HitTrigger`. Default-constructed with sensible defaults (hit solid, ignore disabled pairs, all object sets).
