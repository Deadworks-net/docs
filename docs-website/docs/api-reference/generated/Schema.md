---
title: "Schema Accessors"
sidebar_label: "Schema Accessors"
sidebar_position: 29
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# SchemaAccessor

> **Namespace:** `DeadworksManaged.Api`

Reads and writes a single networked schema field of type `T`. Resolves the field offset once on first access and caches it. Use UTF-8 string literals (`"ClassName"u8`) for *className* and *fieldName*.

## Constructors

| Method | Description |
|--------|-------------|
| `SchemaAccessor(ReadOnlySpan<byte> className, ReadOnlySpan<byte> fieldName, int networkStateChangedOffset)` | *className*: UTF-8 null-terminated class name (e.g. `"CBaseEntity"u8`).. *fieldName*: UTF-8 null-terminated field name (e.g. `"m_iHealth"u8`).. *networkStateChangedOffset*: Optional offset passed to NotifyStateChanged for custom chain offsets. |

## Methods

| Method | Description |
|--------|-------------|
| `GetAddress(IntPtr arg0)` | Returns the raw pointer to the field on *entity*. |
| `Get(IntPtr arg0)` | Reads the field value from *entity*. |
| `Set(IntPtr arg0, T arg1)` | Writes the field value to *entity*, notifying the network state if the field is networked. |

---

## SchemaStringAccessor

> **Namespace:** `DeadworksManaged.Api`

Write-only schema accessor for CUtlSymbolLarge (string) fields. Calls native SetSchemaString.

### Methods

| Method | Description |
|--------|-------------|
| `Set(IntPtr arg0, string arg1)` | Sets the CUtlSymbolLarge string field on *entity* to *value*. |

---

## SchemaArrayAccessor

> **Namespace:** `DeadworksManaged.Api`

Schema accessor for array-typed fields. Reads/writes at offset + index * sizeof(T).

### Methods

| Method | Description |
|--------|-------------|
| `Get(IntPtr arg0, int arg1)` | Reads element *index* from the array field on *entity*. |
| `Set(IntPtr arg0, int arg1, T arg2)` | Writes element *index* in the array field on *entity*, notifying network state if needed. |
