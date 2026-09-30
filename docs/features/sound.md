---
title: "Sound"
sidebar_label: "Sound"
---

# Sound

> **Namespace:** `DeadworksManaged.Api`

Deadlock plays sounds by name. Each sound the game knows is a **soundevent**, such as `Mystical.Piano.AOE.Explode`. You can play any of them, but you can't play a sound file directly.

## Play a sound on a player

```csharp
pawn.EmitSound("Mystical.Piano.AOE.Warning");
```

The sound comes from the player, and everyone nearby hears it. It works on any [entity](entities), not just players.

To change how it sounds:

```csharp
pawn.EmitSound("Damage.Send.Crit", pitch: 100, volume: 0.5f, delay: 0f);
```

`pitch` is 100 for normal. `volume` goes from 0 to 1. `delay` is how many seconds to wait before it starts.

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

Both take a `volume` and a `pitch` too. Here, 1 is normal for both.

```csharp
Sounds.Play("Damage.Send.Crit", RecipientFilter.All, volume: 0.5f, pitch: 1.2f);
```

## Stop a sound

`Sounds.Play` and `Sounds.PlayAt` give you back an id. Keep it, and use it to stop the sound.

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
- Type `soundinfo <name>` in the server console to check that a name is real.
