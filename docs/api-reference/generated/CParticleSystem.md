---
title: "CParticleSystem"
sidebar_label: "CParticleSystem"
sidebar_position: 9
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# CParticleSystem

> **Namespace:** `DeadworksManaged.Api`

Represents a live `info_particle_system` entity. Obtain instances via `Spawn`.

## Methods

| Method | Description |
|--------|-------------|
| `Stop()` | Stops the particle effect without destroying the entity. |
| `Start()` | Starts or restarts the particle effect. |
| `Destroy()` | Removes this particle system entity from the world. |
| `AttachTo(CBaseEntity parent)` | Attaches this particle system to *parent*, inheriting its transform. |
| `Detach()` | Detaches this particle system from its current parent. |
| `Create(string effectName)` | Begins building a new particle system entity. |
