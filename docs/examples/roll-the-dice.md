---
title: "Roll The Dice"
sidebar_label: "Roll The Dice"
---

# Example: Roll The Dice

A minimal command plugin that applies a random effect to the player. Covers command registration, HUD announcements, sounds, particles, modifiers, and timers in one small file.

## What It Does

- Player runs `/rtd` or `!rtd`
- The plugin rolls a random effect and shows a HUD announcement naming the roll
- The effect plays a warning sound, waits 1.7 seconds, spawns a particle, plays an impact sound, and knocks the player down for 3 seconds
- The particle auto-cleans after 5 seconds

Extend the `effects` array with more `(name, apply)` tuples to add rolls.

## Key Pieces

| Concept | Where |
|---|---|
| Command | `[Command("rtd")]` |
| HUD announcement | `CCitadelUserMsg_HudGameAnnouncement` via `NetMessages.Send` |
| Sound | `pawn.EmitSound(...)` |
| Particles | `CParticleSystem.Create(...).AtPosition(...).Spawn()` |
| Modifier | `pawn.AddModifier("modifier_citadel_knockdown", kv)` with a `duration` |
| Delayed work | `Timer.Once(..., () => ...)` for both the impact delay and the particle cleanup |
| Precaching | `Precache.AddResource` in `OnPrecacheResources` - required before `CParticleSystem.Create` |

## Full Source

```csharp
using DeadworksManaged.Api;
using System.Numerics;

namespace RollTheDicePlugin;

public class RollTheDicePlugin : DeadworksPluginBase {
    public override string Name => "Roll The Dice";

    private static readonly Random _rng = new();

    public override void OnLoad(bool isReload) => Console.WriteLine(isReload ? "RTD reloaded!" : "RTD loaded!");
    public override void OnUnload() => Console.WriteLine("RTD unloaded!");

    public override void OnPrecacheResources() {
        Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
    }

    [Command("rtd", Description = "Roll a random effect on yourself")]
    public void CmdRollTheDice(CCitadelPlayerController caller) {
        var pawn = caller.GetHeroPawn();
        if (pawn == null) return;

        var effects = new (string Name, Action<CCitadelPlayerPawn> Apply)[] {
            ("Mystical Piano Strike", ApplyPianoStrike)
        };

        var roll = effects[_rng.Next(effects.Length)];

        var msg = new CCitadelUserMsg_HudGameAnnouncement {
            TitleLocstring = "ROLL THE DICE",
            DescriptionLocstring = roll.Name
        };
        NetMessages.Send(msg, RecipientFilter.Single(caller.EntityIndex - 1));

        roll.Apply(pawn);
    }

    private void ApplyPianoStrike(CCitadelPlayerPawn pawn) {
        pawn.EmitSound("Mystical.Piano.AOE.Warning");
        Timer.Once(1700.Milliseconds(), () => {
            var particle = CParticleSystem.Create("particles/upgrades/mystical_piano_hit.vpcf")
                .AtPosition(pawn.Position + Vector3.UnitZ * 100)
                .StartActive(true)
                .Spawn();

            pawn.EmitSound("Mystical.Piano.AOE.Explode");
            using var kv = new KeyValues3();
            kv.SetFloat("duration", 3.0f);
            pawn.AddModifier("modifier_citadel_knockdown", kv);

            if (particle != null) {
                Timer.Once(5.Seconds(), () => particle.Destroy());
            }
        });
    }
}
```

## See Also

- [Commands](../api-reference/commands)
- [Modifiers](../api-reference/modifiers)
- [Particles](../api-reference/particles)
- [Timers](../api-reference/timers)
- [Precaching](../api-reference/precaching)
