---
title: "Damage"
sidebar_label: "Damage"
---

# Damage

> **Namespace:** `DeadworksManaged.Api`

Intercept, modify, and apply damage to entities.

## OnTakeDamage Hook

Override in your plugin to intercept all damage on the server:

```csharp
public override HookResult OnTakeDamage(TakeDamageEvent ev)
{
    // ev.Entity — the entity taking damage
    // ev.DamageInfo — full damage descriptor

    // Block damage to bosses
    if (ev.Entity.DesignerName == "npc_boss_tier3")
        return HookResult.Stop;

    return HookResult.Handled;
}
```

### TakeDamageEvent

| Property | Type | Description |
|----------|------|-------------|
| `Entity` | `CBaseEntity` | The entity taking damage |
| `Info` | `CTakeDamageInfo` | Full damage descriptor (attacker, inflictor, amount, flags) |

:::caution Property Name
The property is `Info`, **not** `DamageInfo`. Use `ev.Info.Attacker`, `ev.Info.Damage`, etc.
:::

## Applying Damage

### Simple: Hurt()

Convenience wrapper for applying damage. All parameters except `damage` are optional:

```csharp
// Minimal — damage is self-inflicted with no attacker credit
pawn.Hurt(50f);

// Attacker credited — shows in the kill feed
target.Hurt(100f, attacker: shooter);

// Full control
entity.Hurt(
    100f,           // damage amount
    attacker,       // attacking entity (defaults to the victim if omitted)
    inflictor,      // entity that caused damage (weapon, projectile)
    ability,        // ability entity
    damageType: 0   // DamageTypes_t bits (int)
);
```

> If `attacker` is null, the framework treats it as self-damage (attacker = victim). Earlier builds would crash instead — if you're on an older Deadworks version and see an `AccessViolationException` in `Hurt`, update or pass `attacker: pawn`.

:::caution Hurt() Cannot Kill
`Hurt()` caps damage at 1 HP — even `Hurt(99999f, ...)` leaves the target alive at 1 HP. To guarantee a kill, use `CTakeDamageInfo` with `TakeDamageFlags.ForceDeath | TakeDamageFlags.AllowSuicide` (the `AllowSuicide` flag is required when victim == attacker):

```csharp
using var info = new CTakeDamageInfo(damage: 10000f, attacker: pawn);
info.DamageFlags |= TakeDamageFlags.AllowSuicide | TakeDamageFlags.ForceDeath;
pawn.TakeDamage(info);
```
:::

### Advanced: CTakeDamageInfo

For full control, create a `CTakeDamageInfo`:

```csharp
using var damageInfo = new CTakeDamageInfo(
    damage: 200f,
    attacker: attackerEntity,
    inflictor: inflictorEntity,
    ability: abilityEntity,
    damageType: 0
);

targetEntity.TakeDamage(damageInfo);
// damageInfo is disposed automatically via using
```

### CTakeDamageInfo

| Method/Constructor | Description |
|-------------------|-------------|
| `new CTakeDamageInfo(float damage, CBaseEntity? attacker, CBaseEntity? inflictor, CBaseEntity? ability, int damageType)` | Create new (must dispose) |
| `FromExisting(nint)` | Wrap existing pointer (non-owning, e.g. from hook) — *internal* |

**Important:** When creating via constructor, always use `using` or call `Dispose()`.

#### Properties (Verified)

| Property | Type | Description |
|----------|------|-------------|
| `Damage` | `float` | Damage amount (get/set) |
| `TotalledDamage` | `float` | Totalled damage (mirrors Damage on creation) |
| `DamageFlags` | `TakeDamageFlags` | Damage flags (get/set) |
| `DamageType` | `int` | Damage type bits (get/set) |
| `Attacker` | `CBaseEntity?` | The attacking entity |
| `Inflictor` | `CBaseEntity?` | The inflictor entity |
| `Ability` | `CBaseEntity?` | The ability entity |
| `Originator` | `CBaseEntity?` | The originator (usually null on creation) |

## TakeDamageFlags_t

Bit flags that modify how damage is applied (uint64):

| Flag | Value | Description |
|------|-------|-------------|
| `DFLAG_NONE` | 0 | No flags |
| `DFLAG_SUPPRESS_HEALTH_CHANGES` | 1 | Don't change health |
| `DFLAG_SUPPRESS_PHYSICS_FORCE` | 2 | No knockback |
| `DFLAG_SUPPRESS_EFFECTS` | 4 | No visual effects |
| `DFLAG_PREVENT_DEATH` | 8 | Cannot kill (clamp to 1HP) |
| `DFLAG_FORCE_DEATH` | 16 | Guarantee kill |
| `DFLAG_ALWAYS_GIB` | 32 | Always gib on death |
| `DFLAG_NEVER_GIB` | 64 | Never gib on death |
| `DFLAG_SUPPRESS_DAMAGE_MODIFICATION` | 256 | Ignore armor/resist |
| `DFLAG_RADIUS_DMG` | 1024 | Area/splash damage |
| `DFLAG_ALLOW_SUICIDE` | 262144 | Allow self-kill |
| `DFLAG_SUPPRESS_KILL_CREDIT` | 4194304 | No kill credit |
| `DFLAG_SUPPRESS_DEATH_CREDIT` | 8388608 | No death credit |
| `DFLAG_HEAVY_MELEE` | 8589934592 | Heavy melee hit |
| `DFLAG_LIGHT_MELEE` | 17179869184 | Light melee hit |

:::tip
Combine `DFLAG_FORCE_DEATH | DFLAG_ALLOW_SUICIDE` (16 + 262144 = 262160) for guaranteed kills.
:::

## DamageTypes_t

Bit flags for damage type classification:

| Flag | Value | Description |
|------|-------|-------------|
| `DMG_GENERIC` | 0 | Generic damage |
| `DMG_BULLET` | 2 | Bullet damage |
| `DMG_SLASH` | 4 | Slash/melee |
| `DMG_BURN` | 8 | Fire/burn |
| `DMG_FALL` | 32 | Fall damage |
| `DMG_BLAST` | 64 | Explosion |
| `DMG_SHOCK` | 256 | Shock/electric |
| `DMG_HEADSHOT` | 524288 | Headshot |
| `DMG_CRIT` | 1048576 | Critical hit |
| `DMG_DOT` | 4194304 | Damage over time |
| `DMG_LETHAL` | 16777216 | Lethal flag — does NOT bypass 1HP cap via `Hurt()` |

## OnModifyCurrency Hook

Intercept currency changes (gold, ability points):

```csharp
public override HookResult OnModifyCurrency(ModifyCurrencyEvent ev)
{
    // ev.Pawn — the player pawn
    // ev.CurrencyType — ECurrencyType (EGold, EAbilityPoints)
    // ev.Amount — the amount being added/removed
    // ev.Source — ECurrencySource (EPlayerKill, EOrbPlayer, EItemPurchase, etc.)

    // Block all currency gain except starting gold
    if (ev.Source != ECurrencySource.EStartingAmount)
        return HookResult.Stop;

    return HookResult.Handled;
}
```

### ModifyCurrencyEvent

| Property | Type | Description |
|----------|------|-------------|
| `Pawn` | `CCitadelPlayerPawn` | The player pawn |
| `CurrencyType` | `ECurrencyType` | Type of currency |
| `Amount` | `int` | Amount being modified |
| `Source` | `ECurrencySource` | Reason for the change |

## DOT (Damage Over Time) Pattern

Using [Timer.Sequence](timers) for periodic damage:

```csharp
Timer.Sequence(step =>
{
    if (target.Health <= 0)
        return step.Done();

    float damage = target.Controller?.PlayerDataGlobal?.MaxHealth * 0.005f ?? 10f;
    target.Hurt(damage, attacker, attacker, null);
    target.EmitSound("Damage.Send.Crit");

    if (step.Run >= maxTicks)
        return step.Done();

    return step.Wait(200.Milliseconds());
});
```

See the [Scourge Example](../examples/scourge) for a complete DOT plugin.

## See Also

- [Plugin Base](plugin-base) — `OnTakeDamage` and `OnModifyCurrency` hooks
- [Entities](entities) — `Hurt()` and `TakeDamage()` on `CBaseEntity`
- [Players](players) — Currency types and management
- [Scourge Example](../examples/scourge) — Complete DOT implementation
