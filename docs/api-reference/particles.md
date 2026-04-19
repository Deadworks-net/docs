---
title: "Particles"
sidebar_label: "Particles"
---

# Particles

> **Namespace:** `DeadworksManaged.Api`

Create and manage particle effects using the fluent `CParticleSystem` API.

## CParticleSystem

Represents a live `info_particle_system` entity.

### Creating Particles

Use the fluent builder pattern:

```csharp
var particle = CParticleSystem.Create("particles/upgrades/mystical_piano_hit.vpcf")
    .AtPosition(pawn.Position + Vector3.UnitZ * 100)
    .StartActive(true)
    .Spawn();
```

### Instance Methods

| Method | Description |
|--------|-------------|
| `Stop()` | Stops the particle effect without destroying the entity |
| `Start()` | Starts or restarts the particle effect |
| `Destroy()` | Removes this particle system entity from the world |
| `AttachTo(CBaseEntity)` | Attaches particle to parent, inheriting its transform |
| `Detach()` | Detaches particle from its current parent |

### Static Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `Create(string effectName)` | `Builder` | Begins building a new particle system entity |

## Builder

Fluent builder for spawning a `CParticleSystem` entity.

### Builder Methods

| Method | Description |
|--------|-------------|
| `AtPosition(Vector3 pos)` | Sets world-space spawn position |
| `AtPosition(float x, float y, float z)` | Sets spawn position from components |
| `WithAngles(Vector3 angles)` | Sets rotation (pitch, yaw, roll in degrees) |
| `StartActive(bool active)` | Start playing immediately (default `true`) |
| `WithTint(Color color, int controlPoint)` | Apply RGBA tint via control point |
| `WithDataCP(int cp, Vector3 data)` | Set a data control point value |
| `WithControlPoint(int cp, CBaseEntity entity)` | Bind entity to a control point |
| `AttachedTo(CBaseEntity parent)` | Parent the spawned particle to another entity |
| `Spawn()` | Creates the entity and returns `CParticleSystem` |

### Full Example

```csharp
var particle = CParticleSystem.Create("particles/abilities/bull_drain.vpcf")
    .AtPosition(targetPosition)
    .WithAngles(new Vector3(0, 90, 0))
    .StartActive(true)
    .WithTint(Color.Red, 1)
    .WithDataCP(2, new Vector3(100, 0, 0))
    .AttachedTo(targetEntity)
    .Spawn();

// Later: control the particle
particle.Stop();
particle.Start();

// Clean up
particle.Destroy();
```

### Timed Particle with Cleanup

```csharp
var particle = CParticleSystem.Create("particles/upgrades/mystical_piano_hit.vpcf")
    .AtPosition(pawn.Position + Vector3.UnitZ * 100)
    .StartActive(true)
    .Spawn();

// Destroy after 5 seconds
Timer.Once(5.Seconds(), () => particle.Destroy());
```

## Precaching

Particle effects must be precached before use. See [Precaching](precaching.md).

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
    Precache.AddResource("particles/abilities/bull_drain.vpcf");
}
```

## See Also

- [Precaching](precaching.md) — Resource precaching requirement
- [Entities](entities.md) — Base entity operations
- [Roll The Dice Example](../examples/roll-the-dice.md) — Particle effects in practice
