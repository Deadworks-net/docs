---
title: "Heroes"
sidebar_label: "Heroes"
sidebar_position: 20
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# Heroes

> **Namespace:** `DeadworksManaged.Api`

Enum of all Deadlock hero identities. Use `HeroTypeExtensions` to convert to/from hero name strings.

---

## HeroTypeExtensions

> **Namespace:** `DeadworksManaged.Api`

Extension methods for converting `Heroes` enum values to/from hero name strings and fetching VData.

### Methods

| Method | Description |
|--------|-------------|
| `ToHeroName(Heroes arg0)` | Converts a `Heroes` value to its internal hero name string (e.g. "hero_inferno"). |
| `TryParse(string arg0, Heroes@ arg1)` | Tries to parse a hero name string (e.g. "hero_inferno") back to a `Heroes` enum value. |
| `GetHeroData(Heroes arg0)` | Get the native CitadelHeroData_t VData for this hero type. Returns null if not found. |

---

## CitadelHeroData

> **Namespace:** `DeadworksManaged.Api`

Wrapper around native CitadelHeroData_t (VData). Obtain via HeroType.GetHeroData().

### Methods

| Method | Description |
|--------|-------------|
| `GetField<T>(ReadOnlySpan<byte> arg0)` | Read any schema field by name at runtime. |
