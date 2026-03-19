---
title: "Trace Shapes"
sidebar_label: "Trace Shapes"
sidebar_position: 17
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# Ray_t

> **Namespace:** `DeadworksManaged.Api`

Union ray descriptor for VPhys2 trace queries. Set the active shape via one of the `Init` overloads or the static factory methods. The `Type` field indicates which union member is valid.

---

## LineTrace

> **Namespace:** `DeadworksManaged.Api`

Shape data for a line (ray) trace with an optional radius for a swept sphere.

---

## SphereTrace

> **Namespace:** `DeadworksManaged.Api`

Shape data for a sphere trace at a fixed center point.

---

## HullTrace

> **Namespace:** `DeadworksManaged.Api`

Shape data for an AABB hull trace swept along a ray.

---

## CapsuleTrace

> **Namespace:** `DeadworksManaged.Api`

Shape data for a capsule trace between two center points with a radius.

---

## MeshTrace

> **Namespace:** `DeadworksManaged.Api`

Shape data for a convex mesh trace with bounds and a vertex array.

---

## BBox_t

> **Namespace:** `DeadworksManaged.Api`

Axis-aligned bounding box with min/max corners.

---

## CTransform

> **Namespace:** `DeadworksManaged.Api`

Position + orientation transform (translation and quaternion rotation).
