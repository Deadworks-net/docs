---
title: "Roll The Dice"
sidebar_label: "Roll The Dice"
---

# Example: Roll The Dice Plugin

**Source:** `RollTheDicePlugin.cs`

A chat command plugin that randomly applies one of several effects to the player.

## Overview

- **Command:** `/rtd` — rolls a random effect for the player
- **Server commands:** `rtd_auto` (toggle auto-roll), `rtd_interval <s>`, `rtd_force [effect]`, `rtd_list`, `rtd_pos`
- **Effects (25+):** Piano Strike, Infinite Stamina, God's Wrath, Metal Skin, Shut Up, Sonic Speed, Naptime, Seasonal Allergies, Health Shot, Soul Jackpot, Lucky Sandvich, Rat Mode, Big Mode, Fattest Man, Shoddy Explosive, All Expenses Paid Trip, Company Holiday, Go To Jail, Hot Tourist Destination, Slow Mo, Fast Krill, Critical Hits, Shadows, Resistant, Freeze, Heavy Bullets, Great Depression, I Like Trains, Phone Home, Revive Kit, Double Roll
- **Concepts demonstrated:** Chat commands, console commands, particles, modifiers, timers, entity data, HUD announcements, AddAbility + AddModifier pattern, SetModifierState, teleportation, timescale manipulation, schema accessors, sell blocking via OnClientConCommand, MoveType freeze

## Architecture

```
Player types /rtd
    │
    ├── Random roll selects an effect
    ├── HUD announcement shows the result
    └── Effect is applied:
        ├── Piano Strike: sound → delay → particle + knockdown
        └── Infinite Stamina: repeating timer → restore stamina every tick
```

## Key Code Walkthrough

### Plugin Setup

```csharp
public class RollTheDicePlugin : DeadworksPluginBase
{
    public override string Name => "Roll The Dice";

    public override void OnPrecacheResources()
    {
        // Must precache particle effects before use
        Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
    }
}
```

### Chat Command with Random Selection

```csharp
[ChatCommand("rtd")]
public HookResult CmdRollTheDice(ChatCommandContext ctx)
{
    var pawn = ctx.Controller?.GetHeroPawn();
    if (pawn == null) return HookResult.Handled;

    // Define effects as name + action pairs
    var effects = new (string Name, Action<CCitadelPlayerPawn> Apply)[]
    {
        ("Mystical Piano Strike", ApplyPianoStrike),
        ("Infinite Stamina", ApplyInfiniteStamina),
    };

    var roll = effects[_rng.Next(effects.Length)];

    // Show the result to the player
    var msg = new CCitadelUserMsg_HudGameAnnouncement
    {
        TitleLocstring = "ROLL THE DICE",
        DescriptionLocstring = roll.Name
    };
    NetMessages.Send(msg, RecipientFilter.Single(ctx.Message.SenderSlot));

    roll.Apply(pawn);
    return HookResult.Handled;
}
```

### Effect 1: Multi-Step Timed Sequence

The Piano Strike demonstrates chaining timed actions:

```csharp
private void ApplyPianoStrike(CCitadelPlayerPawn pawn)
{
    // 1. Play warning sound immediately
    pawn.EmitSound("Mystical.Piano.AOE.Warning");

    // 2. After 1.7 seconds...
    Timer.Once(1700.Milliseconds(), () =>
    {
        // 3. Spawn particle effect above player
        var particle = CParticleSystem.Create("particles/upgrades/mystical_piano_hit.vpcf")
            .AtPosition(pawn.Position + Vector3.UnitZ * 100)
            .StartActive(true)
            .Spawn();

        // 4. Play explosion sound
        pawn.EmitSound("Mystical.Piano.AOE.Explode");

        // 5. Apply knockdown modifier
        using var kv = new KeyValues3();
        kv.SetFloat("duration", 3.0f);
        pawn.AddModifier("modifier_citadel_knockdown", kv);

        // 6. Clean up particle after 5 seconds
        if (particle != null)
            Timer.Once(5.Seconds(), () => particle.Destroy());
    });
}
```

### Effect 2: Per-Entity Timer with Cleanup

Infinite Stamina uses `EntityData<IHandle?>` to track timers per player:

```csharp
private readonly EntityData<IHandle?> _staminaTimers = new();

private void ApplyInfiniteStamina(CCitadelPlayerPawn pawn)
{
    // Repeat every tick: restore stamina and enable movement
    var timer = Timer.Every(1.Ticks(), () =>
    {
        if (pawn.Health <= 0) return;

        var stamina = pawn.AbilityComponent.ResourceStamina;
        stamina.LatchValue = stamina.MaxValue;
        stamina.CurrentValue = stamina.MaxValue;

        var mp = pawn.ModifierProp;
        mp?.SetModifierState(EModifierState.UnlimitedAirJumps, true);
        mp?.SetModifierState(EModifierState.UnlimitedAirDashes, true);
    });

    // Track the timer per-entity
    _staminaTimers[pawn] = timer;

    // Auto-cancel after 20 seconds
    Timer.Once(20.Seconds(), () =>
    {
        if (_staminaTimers.TryGet(pawn, out var t) && t == timer)
        {
            timer.Cancel();
            _staminaTimers.Remove(pawn);

            pawn.ModifierProp?.SetModifierState(EModifierState.UnlimitedAirJumps, false);
            pawn.ModifierProp?.SetModifierState(EModifierState.UnlimitedAirDashes, false);
        }
    });
}
```

## Advanced Patterns

### AddAbility + AddModifier (Model Scale, Item Buffs)

Some game modifiers need a parent ability to function properly. The pattern: add the item ability, apply the modifier referencing it, then optionally remove the ability.

```csharp
// Rat Mode: shrink player to 0.5x scale
var ability = pawn.AddAbility("upgrade_shrink_ray", 0);
if (ability == null) return;

using var kv = new KeyValues3();
kv.SetFloat("duration", 30.0f);
pawn.AddModifier("modifier_shrink_ray", kv, pawn, ability);
pawn.RemoveAbility("upgrade_shrink_ray"); // Safe: modifier reads ability once
```

See [Modifiers — AddAbility + AddModifier Pattern](../api-reference/modifiers#addability--addmodifier-pattern) for full details.

### SetModifierState (Visibility, Silence, Movement)

Toggle gameplay states directly without needing a VData modifier:

```csharp
// Exposed: visible through walls for 30s
pawn.ModifierProp.SetModifierState(EModifierState.VisibleToEnemy, true);
pawn.ModifierProp.SetModifierState(EModifierState.GlowThroughWallsToEnemy, true);

Timer.Once(30.Seconds(), () => {
    pawn.ModifierProp?.SetModifierState(EModifierState.VisibleToEnemy, false);
    pawn.ModifierProp?.SetModifierState(EModifierState.GlowThroughWallsToEnemy, false);
});
```

### Blocking Item Sales (OnClientConCommand)

Effects that give items via `AddAbility` (Critical Hits, Shoddy Explosive, Fattest Man) must prevent the player from selling the item — selling causes a crash when timers reference the removed ability. Block using `OnClientConCommand`:

```csharp
private static readonly HashSet<string> _rtdAbilityNames = new(StringComparer.OrdinalIgnoreCase) {
    "upgrade_critshot",
    "upgrade_unstable_concoction",
    "upgrade_personal_rejuvenator",
};

public override HookResult OnClientConCommand(ClientConCommandEvent e)
{
    // Block selling RTD-given items (selling crashes timers that reference the ability)
    if (e.Command == "sellitem" && e.Args.Length >= 2 && _rtdAbilityNames.Contains(e.Args[1]))
        return HookResult.Stop;

    return HookResult.Continue;
}
```

**Key insight:** The sell command is `sellitem` with the ability VData name as `Args[1]` (e.g. `sellitem upgrade_critshot`).

### Freeze via MoveType Schema

Setting `m_MoveType` to `MOVETYPE_OBSERVER` (8) every tick freezes the player in place:

```csharp
private static readonly SchemaAccessor<byte> _moveType = new("CBaseEntity"u8, "m_MoveType"u8);
private static readonly SchemaAccessor<byte> _actualMoveType = new("CBaseEntity"u8, "m_nActualMoveType"u8);

private void ApplyFreeze(CCitadelPlayerPawn pawn)
{
    const byte MOVETYPE_OBSERVER = 8;
    const byte MOVETYPE_WALK = 2;

    var timer = Timer.Every(1.Ticks(), () =>
    {
        if (!pawn.IsValid || pawn.Health <= 0) return;
        _moveType.Set(pawn.Handle, MOVETYPE_OBSERVER);
        _actualMoveType.Set(pawn.Handle, MOVETYPE_OBSERVER);
    });

    Timer.Once(5.Seconds(), () =>
    {
        timer.Cancel();
        if (!pawn.IsValid) return;
        _moveType.Set(pawn.Handle, MOVETYPE_WALK);
        _actualMoveType.Set(pawn.Handle, MOVETYPE_WALK);
    });
}
```

> **Note:** `MOVETYPE_OBSERVER` (8) freezes the player in place. `MOVETYPE_NOCLIP` (7) grants true noclip flight with no collision. Both must be reapplied every tick as the game resets them.

### Timescale Stacking

Multiple timescale effects stack multiplicatively using a shared list:

```csharp
private readonly List<float> _activeTimescales = new();

private void ApplyTimescaleEffect(float multiplier) {
    _activeTimescales.Add(multiplier);
    RecalcTimescale(); // Multiply all active scales together

    Timer.Once(10.Seconds(), () => {
        _activeTimescales.Remove(multiplier);
        RecalcTimescale();
    });
}

private void RecalcTimescale() {
    var scale = 1.0f;
    foreach (var m in _activeTimescales) scale *= m;
    ConVar.Find("host_timescale")?.SetFloat(scale);
}
```

## API Features Used

| Feature | Reference |
|---------|-----------|
| `DeadworksPluginBase` | [Plugin Base](../api-reference/plugin-base) |
| `[ChatCommand]`, `[ConCommand]` | [Chat Commands](../api-reference/chat-commands) |
| `CParticleSystem.Create()` | [Particles](../api-reference/particles) |
| `Timer.Once`, `Timer.Every` | [Timers](../api-reference/timers) |
| `KeyValues3`, `AddModifier` | [Modifiers](../api-reference/modifiers) |
| `AddAbility` + `AddModifier` | [Modifiers — AddAbility Pattern](../api-reference/modifiers#addability--addmodifier-pattern) |
| `SetModifierState` | [Modifiers — EModifierState](../api-reference/modifiers#emodifierstate-reference) |
| `EntityData<T>` | [Entities](../api-reference/entities) |
| `SchemaAccessor<T>` | [Entities — Schema Access](../api-reference/entities#schema-accessors) |
| `NetMessages.Send` | [Networking](../api-reference/networking) |
| `ConVar.Find` | Server ConVars |
| `Precache.AddResource` | [Precaching](../api-reference/precaching) |
| `OnClientConCommand` | [Console Commands — Blocking](../api-reference/console-commands#blocking-client-commands) |
| `m_MoveType` SchemaAccessor | [Entities — MoveType](../api-reference/entities#movetype-freeze-players) |
