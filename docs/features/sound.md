---
title: "Sound"
sidebar_label: "Sound"
---

# Sound

> **Namespace:** `DeadworksManaged.Api`

Deadlock plays sounds by name. Each sound the game knows is a **soundevent**, such as `Mystical.Piano.AOE.Explode`. A plugin can play any soundevent. It can't play a sound file directly.

## Play a sound on a player

```csharp
pawn.EmitSound("Mystical.Piano.AOE.Warning");
```

The sound comes from the player. Everyone nearby hears it. `EmitSound` works on any [entity](entities), not only players.

To change how it sounds:

```csharp
pawn.EmitSound("Damage.Send.Crit", pitch: 100, volume: 0.5f, delay: 0f);
```

A `pitch` of `100` is normal. `volume` ranges from `0` to `1`. `delay` is the number of seconds before the sound starts.

## Play a sound to everyone

Use `Sounds.Play`. Each player hears it as if it were right next to them, wherever they are.

```csharp
using DeadworksManaged.Api.Sounds;

Sounds.Play("Mystical.Piano.AOE.Warning", RecipientFilter.All);
```

## Play a sound only one player can hear

```csharp
Sounds.Play("Damage.Send.Crit", RecipientFilter.Single(controller.Slot));
```

To make it come from an entity, but still only for that player, use `PlayAt`:

```csharp
Sounds.PlayAt("Damage.Send.Crit", pawn.EntityIndex, RecipientFilter.Single(controller.Slot));
```

Both also take `volume` and `pitch`.

:::note
`Sounds.Play` and `Sounds.PlayAt` treat `1` as normal for both `volume` and `pitch`. A `pitch` of `100` here is not normal pitch, unlike `EmitSound`.
:::

```csharp
Sounds.Play("Damage.Send.Crit", RecipientFilter.All, volume: 0.5f, pitch: 1.2f);
```

## Stop a sound

`Sounds.Play` and `Sounds.PlayAt` return an id. Keep it to stop the sound later.

```csharp
uint guid = Sounds.Play("Mystical.Piano.AOE.Warning", RecipientFilter.All);

SoundEvent.Stop(guid, RecipientFilter.All);
```

To stop every copy of a sound coming from one entity:

```csharp
SoundEvent.StopByName("Mystical.Piano.AOE.Warning", pawn.EntityIndex, RecipientFilter.All);
```

## Change a sound while it plays

```csharp
new SoundEvent("Mystical.Piano.AOE.Warning") { Volume = 0.2f }
    .SetParams(guid, RecipientFilter.All);
```

## Play a sound at a place in the world

Create a `point_soundevent` entity where you want the sound.

```csharp
var sound = CBaseEntity.CreateByDesignerName("point_soundevent");
if (sound == null) return;

var ekv = new CEntityKeyValues();
ekv.SetString("soundName", "Mystical.Piano.AOE.Explode");
ekv.SetBool("startOnSpawn", true);
ekv.SetVector("origin", position);

// Remove the entity when the sound finishes
sound.AcceptInput("addoutput", value: "OnSoundFinished>!self>Kill>>0>-1");
sound.Spawn(ekv);
```

## Find a sound to play

- Browse the game's files with [Source2Viewer](https://s2v.app/). Sounds are listed in the `soundevents_*.vsndevts_c` files.
- Type `soundinfo <name>` in the server console to check that a name exists.
