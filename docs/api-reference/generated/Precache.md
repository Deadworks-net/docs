---
title: "Precache"
sidebar_label: "Precache"
sidebar_position: 23
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# Precache

> **Namespace:** `DeadworksManaged.Api`

Resource precaching. Call `String)` during `OnPrecacheResources` to ensure particles, models, and other resources are loaded before use.

## Methods

| Method | Description |
|--------|-------------|
| `AddResource(string arg0)` | Precaches a resource by path (e.g. "particles/abilities/bull_drain.vpcf"). Must be called during OnPrecacheResources. |
| `AddHero(string arg0)` | Precaches a single hero by internal name (e.g. "hero_inferno"). Must be called during OnPrecacheResources. |
| `AddHero(Heroes arg0)` | Precaches a hero by enum value. Must be called during OnPrecacheResources. |
| `AddAllHeroes()` | Precaches all heroes. Useful when plugins swap heroes/abilities at runtime. Must be called during OnPrecacheResources. |
