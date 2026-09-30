---
title: "Particles"
sidebar_label: "Particles"
---

# Particles

> **Namespace:** `DeadworksManaged.Api`

A particle effect is a visual effect in the world, like an explosion, a beam or a glow. The game's effects are `.vpcf` files, and you can play any of them.

## Play a particle effect

First, tell the game to load the effect. Use the `.vpcf` path, not `.vpcf_c`.

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
}
```

Then create it where you want it.

```csharp
var particle = CParticleSystem.Create("particles/upgrades/mystical_piano_hit.vpcf")
    .AtPosition(pawn.Position + Vector3.UnitZ * 100)
    .Spawn();
```

This plays the effect just above the player. See [Precaching](precaching) for more on loading.

## Find an effect to play

Browse the game's files with [Source2Viewer](https://s2v.app/). Effects are under `particles/`.

## Attach an effect to a player

Use `AttachedTo`, and the effect follows them around.

```csharp
var particle = CParticleSystem.Create("particles/abilities/bull_drain.vpcf")
    .AttachedTo(pawn)
    .Spawn();
```

It works with any [entity](entities), not just players.

To attach or let go of an effect that already exists:

```csharp
particle.AttachTo(pawn);
particle.Detach();
```

## Remove an effect

```csharp
particle.Destroy();
```

To remove it after a while, use a [timer](timers):

```csharp
Timer.Once(5.Seconds(), () => particle.Destroy());
```

## Turn an effect off and on

```csharp
particle.Stop();
particle.Start();
```

To create an effect that doesn't play until you call `Start()`, add `StartActive(false)`:

```csharp
var particle = CParticleSystem.Create("particles/abilities/bull_drain.vpcf")
    .AtPosition(position)
    .StartActive(false)
    .Spawn();
```

## Rotate an effect

```csharp
var particle = CParticleSystem.Create("particles/abilities/bull_drain.vpcf")
    .AtPosition(position)
    .WithAngles(new Vector3(0, 90, 0))
    .Spawn();
```

The angles are pitch, yaw and roll, in degrees.

## Change an effect's colour

```csharp
var particle = CParticleSystem.Create("particles/abilities/bull_drain.vpcf")
    .AtPosition(position)
    .WithTint(Color.Red, 1)
    .Spawn();
```

The number is the control point the effect reads its colour from. It depends on the effect, and not every effect has one.

## Set an effect's control points

Many effects read extra values, such as a size or an end point, from numbered control points. Which numbers an effect uses depends on the effect.

```csharp
var particle = CParticleSystem.Create("particles/abilities/bull_drain.vpcf")
    .AtPosition(position)
    .WithDataCP(2, new Vector3(100, 0, 0)) // give control point 2 a value
    .WithControlPoint(1, targetEntity)     // make control point 1 follow an entity
    .Spawn();
```
