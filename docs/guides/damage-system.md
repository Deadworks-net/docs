---
title: "Damage System"
sidebar_label: "Damage System"
---

# Damage System Guide

This guide covers intercepting, modifying, and applying damage in Deadworks plugins.

## Intercepting Damage

Override `OnTakeDamage` to intercept all damage on the server:

```csharp
public override HookResult OnTakeDamage(TakeDamageEvent ev)
{
    var entity = ev.Entity;
    var damageInfo = ev.Info;

    // Block damage to boss NPCs
    if (entity.DesignerName == "npc_boss_tier3")
        return HookResult.Stop;

    // Allow all other damage
    return HookResult.Handled;
}
```

### Filtering by Ability

Check which ability caused the damage using VData:

```csharp
public override HookResult OnTakeDamage(TakeDamageEvent ev)
{
    // Get the VData name of the ability that caused damage
    var vdata = ev.Info.Ability?.SubclassVData;
    if (vdata?.Name == "upgrade_discord")
    {
        // Apply special effect for this specific ability
        ApplyDOTEffect(ev.Entity, ev.Info.Attacker);
    }

    return HookResult.Handled;
}
```

## Applying Damage

### Simple: Hurt()

The easiest way to damage an entity:

```csharp
entity.Hurt(100f, attacker, inflictor, ability, damageType: 0);
```

:::caution Hurt() Cannot Kill
`Hurt()` caps damage at 1 HP regardless of the amount — `Hurt(99999f, ...)` will leave the target at 1 HP, not kill them. To guarantee a kill, use `CTakeDamageInfo` with `ForceDeath | AllowSuicide` flags (see below).
:::

### Guaranteed Kill

Use `CTakeDamageInfo` with `ForceDeath | AllowSuicide` to ensure death:

```csharp
[ConCommand("dw_killme")]
public void OnKillMe(ConCommandContext ctx)
{
    var pawn = ctx.Controller?.GetHeroPawn();
    if (pawn == null) return;

    using var dmgInfo = new CTakeDamageInfo(99999f, attacker: pawn);
    dmgInfo.DamageFlags |= TakeDamageFlags.ForceDeath | TakeDamageFlags.AllowSuicide;
    pawn.TakeDamage(dmgInfo);
}
```

### Advanced: CTakeDamageInfo

For full control over damage parameters:

```csharp
using var info = new CTakeDamageInfo(
    damage: 200f,
    attacker: attackerEntity,
    inflictor: inflictorEntity,
    ability: null,
    damageType: 0
);
targetEntity.TakeDamage(info);
```

## Damage Over Time (DOT)

Use `Timer.Sequence` for periodic damage:

```csharp
private readonly EntityData<IHandle?> _dotTimers = new();

private void ApplyDOT(CBaseEntity target, CBaseEntity attacker, float duration, float interval, float fraction)
{
    // Cancel existing DOT on this target
    if (_dotTimers.TryGet(target, out var existing))
        existing?.Cancel();

    int maxTicks = (int)(duration * 1000 / interval);

    var timer = Timer.Sequence(step =>
    {
        // Stop if target is dead
        if (target.Health <= 0)
            return step.Done();

        // Calculate damage as fraction of max health
        var maxHealth = target.As<CCitadelPlayerPawn>()?.Controller?.PlayerDataGlobal?.MaxHealth ?? 1000;
        float damage = maxHealth * fraction;

        target.Hurt(damage, attacker, attacker, null);
        target.EmitSound("Damage.Send.Crit");

        if (step.Run >= maxTicks)
            return step.Done();

        return step.Wait((int)interval.Milliseconds());
    });

    _dotTimers[target] = timer;
}
```

### Complete DOT Plugin

See the [Scourge Example](../examples/scourge) for a full implementation with configuration.

## Currency Interception

Control gold and ability point flow:

```csharp
public override HookResult OnModifyCurrency(ModifyCurrencyEvent ev)
{
    // Block all currency gain
    return HookResult.Stop;
}
```

### Selective Currency Control

```csharp
public override HookResult OnModifyCurrency(ModifyCurrencyEvent ev)
{
    // Only allow starting gold, block everything else
    if (ev.Source == ECurrencySource.EStartingAmount)
        return HookResult.Handled;

    return HookResult.Stop;
}
```

### Re-issuing Currency

After blocking natural currency gain, issue custom amounts:

```csharp
[GameEventHandler("player_hero_changed")]
public HookResult OnHeroChanged(GameEvent ev)
{
    var pawn = ev.GetPlayerPawn("player") as CCitadelPlayerPawn;
    if (pawn == null) return HookResult.Handled;

    // Give custom starting currency
    pawn.ModifyCurrency(ECurrencyType.EGold, 15000, ECurrencySource.ECheats, false, false, false);
    pawn.ModifyCurrency(ECurrencyType.EAbilityPoints, 17, ECurrencySource.ECheats, false, false, false);

    return HookResult.Handled;
}
```

## See Also

- [Damage API Reference](../api-reference/damage) — Full API details
- [Timers](../api-reference/timers) — Timer.Sequence for DOT
- [Players](../api-reference/players) — Currency types and management
- [Scourge Example](../examples/scourge) — Complete DOT plugin
