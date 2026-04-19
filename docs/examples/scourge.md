---
title: "Scourge DOT"
sidebar_label: "Scourge DOT"
---

# Example: Scourge DOT Plugin

**Source:** `ScourgePlugin.cs`

A focused plugin that applies a configurable damage-over-time (DOT) effect when players are hit by a specific ability.

## Overview

- **Trigger:** Player hit by `upgrade_discord` ability
- **Effect:** Periodic damage as a fraction of max health
- **Concepts demonstrated:** `OnTakeDamage` hook, `Timer.Sequence`, config with validation, VData checking, entity data cleanup

## Architecture

```
Player takes damage
    │
    ├── OnTakeDamage hook fires
    ├── Check if ability is "upgrade_discord"
    ├── Cancel any existing DOT on this target
    └── Start Timer.Sequence:
        │
        └── Every 200ms (configurable):
            ├── Check if target is alive
            ├── Calculate damage (fraction of max HP)
            ├── Apply damage via Hurt()
            ├── Play sound
            └── Repeat until duration expires
```

## Configuration

Full JSON config with validation:

```csharp
public class ScourgeConfig : BasePluginConfig
{
    [JsonPropertyName("DurationSeconds")]
    public float DurationSeconds { get; set; } = 15f;

    [JsonPropertyName("DamageIntervalMs")]
    public int DamageIntervalMs { get; set; } = 200;

    [JsonPropertyName("DamageFraction")]
    public float DamageFraction { get; set; } = 0.005f;

    [JsonPropertyName("DamageSound")]
    public string DamageSound { get; set; } = "Damage.Send.Crit";

    [JsonPropertyName("DamageSoundVolume")]
    public float DamageSoundVolume { get; set; } = 0.1f;
}
```

### Config Validation in OnConfigParsed

```csharp
public void OnConfigParsed(ScourgeConfig config)
{
    if (config.DurationSeconds < 0.1f) config.DurationSeconds = 0.1f;
    if (config.DamageIntervalMs < 50) config.DamageIntervalMs = 50;
    if (config.DamageFraction <= 0f) config.DamageFraction = 0.005f;
    config.DamageSoundVolume = Math.Clamp(config.DamageSoundVolume, 0f, 1f);
    Config = config;
}
```

## Damage Interception

Uses `OnTakeDamage` to detect a specific ability and start the DOT:

```csharp
public override HookResult OnTakeDamage(TakeDamageEvent args)
{
    // Only trigger for upgrade_discord ability
    if (args.Info.Ability?.SubclassVData?.Name != "upgrade_discord")
        return HookResult.Continue;

    var pawn = args.Entity.As<CCitadelPlayerPawn>();
    if (pawn == null) return HookResult.Continue;

    var attacker = args.Info.Attacker;
    uint victimHandle = pawn.EntityHandle;

    // Cancel existing DOT on this target
    if (_dotTimers.TryGet(pawn, out var existing))
        existing.Cancel();

    // Start new DOT sequence...
    return HookResult.Continue;
}
```

**Key insight:** The hook returns `HookResult.Continue`, allowing the original damage to still be applied. The DOT is an additional effect on top.

## Timer.Sequence for DOT

The DOT uses `Timer.Sequence` for a stateful, repeating effect with automatic termination:

```csharp
int maxTicks = (int)(Config.DurationSeconds * 1000 / Config.DamageIntervalMs);

var handle = Timer.Sequence(step =>
{
    // Stop after max ticks
    if (step.Run > maxTicks)
        return step.Done();

    // Verify target still exists and is alive
    var ent = CBaseEntity.FromHandle(victimHandle);
    if (ent == null || !ent.IsAlive)
        return step.Done();

    // Calculate damage as fraction of max health
    var healthMax = pawn.Controller?.PlayerDataGlobal.HealthMax ?? 0;
    if (healthMax <= 0)
        return step.Done();

    // Apply damage and sound
    ent.Hurt(healthMax * damageFraction, attacker: attacker);
    ent.EmitSound(sound, volume: volume);

    return step.Wait(intervalMs.Milliseconds());
});

_dotTimers[pawn] = handle;
```

### Why Timer.Sequence?

- **Stateful:** `step.Run` tracks how many ticks have passed
- **Self-terminating:** Returns `step.Done()` when target dies or duration expires
- **Variable pacing:** `step.Wait(duration)` allows configurable tick intervals
- **Clean API:** No need to manage counters externally

## Safety Patterns

### Entity Handle Validation

Uses `CBaseEntity.FromHandle(victimHandle)` to verify the entity still exists before each tick. This prevents crashes from accessing deleted entities.

### Cancel on Re-application

If the same target gets hit again, the existing DOT is cancelled before starting a new one:

```csharp
if (_dotTimers.TryGet(pawn, out var existing))
    existing.Cancel();
```

### Cleanup on Unload

```csharp
public override void OnUnload()
{
    _dotTimers.Clear();  // Cancel all active DOTs
}
```

## API Features Used

| Feature | Reference |
|---------|-----------|
| `IPluginConfig<T>`, `OnConfigParsed` | [Configuration](../api-reference/configuration.md) |
| `OnTakeDamage` | [Damage](../api-reference/damage.md) |
| `Timer.Sequence`, `IStep` | [Timers](../api-reference/timers.md) |
| `EntityData<IHandle>` | [Entities](../api-reference/entities.md) |
| `CBaseEntity.FromHandle` | [Entities](../api-reference/entities.md) |
| `Hurt()`, `EmitSound()` | [Entities](../api-reference/entities.md) |
| `SubclassVData` | [Entities](../api-reference/entities.md) |
| `PlayerDataGlobal.HealthMax` | [Players](../api-reference/players.md) |
