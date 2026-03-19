---
title: "Tracing"
sidebar_label: "Tracing"
sidebar_position: 16
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# Trace

> **Namespace:** `DeadworksManaged.Api`

Static API for VPhys2 ray and shape casting. All methods are no-ops if the physics query system is not yet ready.

## Methods

| Method | Description |
|--------|-------------|
| `TraceShape(Vector3 arg0, Vector3 arg1, Ray_t arg2, CTraceFilter arg3, CGameTrace@ arg4)` | Executes a raw VPhys2 trace using the provided ray shape and filter, writing results into *trace*. |
| `SimpleTrace(Vector3 arg0, Vector3 arg1, RayType_t arg2, RnQueryObjectSet arg3, MaskTrace arg4, MaskTrace arg5, MaskTrace arg6, CollisionGroup arg7, CGameTrace@ arg8, CBaseEntity arg9, CBaseEntity arg10)` | Convenience trace that constructs a `CTraceFilter` and `Ray_t` from individual parameters, optionally ignoring up to two entities. |
| `SimpleTraceAngles(Vector3 arg0, Vector3 arg1, RayType_t arg2, RnQueryObjectSet arg3, MaskTrace arg4, MaskTrace arg5, MaskTrace arg6, CollisionGroup arg7, CGameTrace@ arg8, CBaseEntity arg9, CBaseEntity arg10, float arg11)` | Like `CBaseEntity)` but takes pitch/yaw angles instead of an end point, projecting *maxDistance* units forward. |
| `Ray(Vector3 arg0, Vector3 arg1, MaskTrace arg2, CBaseEntity arg3)` | Fires a simple line ray from *start* to *end*. Returns a `TraceResult` with hit position and fraction. |

---

## TraceResult

> **Namespace:** `DeadworksManaged.Api`

Simplified trace result returned by `CBaseEntity)`. Contains the hit position, fraction, and full `CGameTrace` data.

---

## CGameTrace

> **Namespace:** `DeadworksManaged.Api`

Result of a VPhys2 shape trace. Check `DidHit` and inspect `HitPoint`, `HitNormal`, and `HitEntity`.

---

## CTraceFilter

> **Namespace:** `DeadworksManaged.Api`

Trace filter passed to VPhys2 TraceShape. Embeds a vtable pointer (managed vtable with a destructor and ShouldHitEntity callback) and a `RnQueryShapeAttr_t`. Construct with `new CTraceFilter()` for entity-aware filtering.
