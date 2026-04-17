---
title: "Roll The Dice"
sidebar_label: "Roll The Dice"
---

# Example: Roll The Dice

A minimal chat command plugin that applies a random effect to the player. Covers chat commands, HUD announcements, sounds, particles, modifiers, and timers in one small file.

## What It Does

- Player types `/rtd` in chat
- Plugin rolls a random effect (just one in this example — Mystical Piano Strike) and shows a HUD announcement naming the roll
- Effect plays a warning sound, waits 1.7 seconds, spawns a particle, plays an impact sound, and knocks the player down for 3 seconds
- Particle auto-cleans after 5 seconds

Extend the `effects` array with more `(name, apply)` tuples to add rolls.

## Key Pieces

| Concept | Where |
|---|---|
| Chat command | `[ChatCommand("rtd")]` |
| HUD announcement | `CCitadelUserMsg_HudGameAnnouncement` via `NetMessages.Send` |
| Sound | `pawn.EmitSound(...)` |
| Particles | `CParticleSystem.Create(...).AtPosition(...).Spawn()` |
| Modifier | `pawn.AddModifier("modifier_citadel_knockdown", kv)` with a `duration` |
| Delayed work | `Timer.Once(..., () => ...)` for both the impact delay and the particle cleanup |
| Precaching | `Precache.AddResource` in `OnPrecacheResources` — required before `CParticleSystem.Create` |

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

    [ChatCommand("rtd")]
    public HookResult CmdRollTheDice(ChatCommandContext ctx) {
        var pawn = ctx.Controller?.GetHeroPawn();
        if (pawn == null) return HookResult.Handled;

        var effects = new (string Name, Action<CCitadelPlayerPawn> Apply)[] {
            ("Mystical Piano Strike", ApplyPianoStrike)
        };

        var roll = effects[_rng.Next(effects.Length)];

        var msg = new CCitadelUserMsg_HudGameAnnouncement {
            TitleLocstring = "ROLL THE DICE",
            DescriptionLocstring = roll.Name
        };
        NetMessages.Send(msg, RecipientFilter.Single(ctx.Message.SenderSlot));

        roll.Apply(pawn);
        return HookResult.Handled;
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

- [Chat Commands](../api-reference/chat-commands)
- [Modifiers](../api-reference/modifiers)
- [Particles](../api-reference/particles)
- [Timers](../api-reference/timers)
- [Precaching](../api-reference/precaching)
