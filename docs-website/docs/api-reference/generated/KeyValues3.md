---
title: "KeyValues3"
sidebar_label: "KeyValues3"
sidebar_position: 22
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# KeyValues3

> **Namespace:** `DeadworksManaged.Api`

Wraps a native KeyValues3 handle. Create with `new KeyValues3()`, set typed members, pass to `Int32)`, then dispose. Must be disposed explicitly — no finalizer (unsafe to call native from GC thread).

## Constructors

| Method | Description |
|--------|-------------|
| `KeyValues3()` | Allocates a new native KeyValues3 object. |

## Properties

| Property | Description |
|----------|-------------|
| `IsValid` | `true` if the underlying native handle is still alive (i.e. not yet disposed). |

## Methods

| Method | Description |
|--------|-------------|
| `Dispose()` | Frees the native KeyValues3 object. Must be called after the KV3 has been consumed by the engine. |
| `SetString(string key, string value)` | Sets a string value on the KV3 object. |
| `SetBool(string key, bool value)` | Sets a boolean value on the KV3 object. |
| `SetInt(string key, int value)` | Sets a signed 32-bit integer value on the KV3 object. |
| `SetUInt(string key, uint value)` | Sets an unsigned 32-bit integer value on the KV3 object. |
| `SetInt64(string key, long value)` | Sets a signed 64-bit integer value on the KV3 object. |
| `SetUInt64(string key, ulong value)` | Sets an unsigned 64-bit integer value on the KV3 object. |
| `SetFloat(string key, float value)` | Sets a single-precision floating-point value on the KV3 object. |
| `SetDouble(string key, double value)` | Sets a double-precision floating-point value on the KV3 object. |
| `SetVector(string key, Vector3 value)` | Sets a 3D vector value on the KV3 object. |
