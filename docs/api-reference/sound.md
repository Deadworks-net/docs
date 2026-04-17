---
title: "Sound"
sidebar_label: "Sound"
---

# Sound

> **Namespace:** `DeadworksManaged.Api`

Deadlock's audio system exposes one primary way to play sounds: **soundevents** — named entries in the game's audio manifest (e.g. `Mystical.Piano.AOE.Explode`, `Male.AnnTemp.Core_Damaged`). You cannot play raw `.vsnd` files directly.

## Playing a Soundevent on an Entity

The simplest case — play a sound on a pawn, NPC, or world entity:

```csharp
pawn.EmitSound("Mystical.Piano.AOE.Warning");
pawn.EmitSound("Damage.Send.Crit", pitch: 100, volume: 0.5f, delay: 0f);
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `soundName` | `string` | — | Full soundevent name |
| `pitch` | `int` | `100` | 100 = normal pitch |
| `volume` | `float` | `1.0` | 0.0–1.0 |
| `delay` | `float` | `0.0` | Seconds before the sound actually starts |

The sound plays in 3D space attached to the entity. Nearby players hear it with positional falloff.

## Playing a Soundevent Globally (Any Position)

`EmitSound` requires an entity. For a sound that plays from an arbitrary world position, spawn a `point_soundevent` and let it clean itself up:

```csharp
void PlayAt(string soundName, Vector3 position)
{
    var sound = CBaseEntity.CreateByDesignerName("point_soundevent");
    if (sound == null) return;

    var ekv = new CEntityKeyValues();
    ekv.SetString("soundName", soundName);
    ekv.SetBool("startOnSpawn", true);
    ekv.SetVector("origin", position);

    // Auto-remove after playback finishes so we don't leak entities.
    sound.AcceptInput("addoutput", value: "OnSoundFinished>!self>Kill>>0>-1");
    sound.Spawn(ekv);
}
```

## "Announcer-Style" Global Sound (No Position)

There is no first-class API for playing a sound globally with no spatial component. Two workarounds:

1. **Use a global/UI soundevent** (announcer clips, UI dings — the Deadlock announcer line soundevents are authored as 2D) via the `point_soundevent` recipe above. Positional falloff won't apply because the underlying soundevent doesn't request it.
2. **Send a client `play` concommand** to every player. This works but **bypasses the user's volume settings**, which is obnoxious — use only as a temporary hack during prototyping:

    ```csharp
    foreach (var controller in Players.GetAll())
        Server.ClientCommand(controller.EntityIndex, $"play {soundName}");
    ```

## Per-Player Sound (Limited)

There is **no supported way** to play a soundevent that only one player can hear. The obvious schema flags — `m_flClientCullRadius` and `m_bToLocalPlayer` on `point_soundevent` — don't actually gate audibility in testing. If you need a strictly-private sound, the `play` client concommand is the only approach, with the same volume-bypass warning above.

## Silent Soundevent Problems

If `EmitSound` appears to return success but you hear nothing:

- **Check the volume on the soundevent itself.** Some internal soundevents are authored at very low dB (`Music.Base.Attack` is `-6` dB). The `volume` parameter multiplies an already-quiet source.
- **Verify with `soundinfo <soundname>` in the console** — it will tell you whether the soundevent resolved to a playable sound and at what volume.
- **Soundevents that are 3D-positional are inaudible when the listener is far from the entity.** Attach to the player pawn or use the global recipe above.

## Custom Soundevents

Adding a brand-new soundevent currently requires replacing an existing `.vsndevts` file in the game's VPK — the game does not read soundevents from an addon-local path. This is fragile (breaks when multiple plugins want custom sounds) and is not recommended for public servers yet.

## Finding Soundevent Names

- `soundinfo <name>` in the server console — tests whether a name resolves and prints its sound file
- Extract `soundevents_*.vsndevts_c` with [source2viewer-cli](https://github.com/ValveResourceFormat/ValveResourceFormat) or browse via [s2v.app](https://s2v.app/)
- In-game community references sometimes list popular ones (announcer lines, hero abilities)

## See Also

- [Entities](entities) — `EmitSound` is defined on `CBaseEntity`
- [Precaching](precaching) — Soundevents usually don't need precaching, but the underlying `.vsnd` files sometimes do
