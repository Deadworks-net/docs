---
title: "Entities"
sidebar_label: "Entities"
---

# Entities

> **Namespace:** `DeadworksManaged.Api`

The entity system provides managed wrappers around Source 2 entities. All entities derive from `CBaseEntity`.

## CBaseEntity

Base managed wrapper for all Source 2 entities. Provides common operations: health, team, lifecycle, modifiers, schema access.

### Static Methods (Creation & Lookup)

| Method | Returns | Description |
|--------|---------|-------------|
| `CreateByName(string className)` | `CBaseEntity?` | Creates a new entity by its **C++ class name** (e.g. `"info_particle_system"`, `"prop_dynamic"`) |
| `CreateByDesignerName(string designerName)` | `CBaseEntity?` | Creates by **designer name** — resolves the base class, then writes `m_nSubclassID` + `m_pSubclassVData` so VData is available before `Spawn()`. Prefer this for subclassed designer-named entities (`npc_boss_tier2`, `citadel_breakable_prop`, `point_worldtext`, etc.) — these frequently crash when created via `CreateByName` alone. |
| `FromHandle(uint entityHandle)` | `CBaseEntity?` | Gets entity by its entity handle |
| `FromHandle<T>(uint entityHandle)` | `T?` | Gets typed entity by handle (avoids manual cast) |
| `FromIndex(int index)` | `CBaseEntity?` | Gets entity by its global entity index |
| `FromIndex<T>(int index)` | `T?` | Gets typed entity by index |

> **Rule of thumb:** use `CreateByDesignerName` unless you have a specific reason not to. It works for plain C++ class names too (it falls back to `CreateByName` when no subclass mapping exists).

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Name` | `string` | Entity targetname (set in Hammer or code) |
| `DesignerName` | `string` | The designer/map name (e.g. `"npc_boss_tier3"`, `"player"`) |
| `Classname` | `string` | The C++ DLL class name (e.g. `"CCitadelPlayerPawn"`) |
| `EntityHandle` | `uint` | The entity handle (CEntityHandle as uint32) |
| `EntityIndex` | `int` | The entity index (lower 14 bits of handle) |
| `Health` | `int` | Current health (get/set) |
| `MaxHealth` | `int` | Maximum health (get/set) |
| `Position` | `Vector3` | World position (from BodyComponent) |
| `TeamNum` | `int` | Team number (get/set) |
| `LifeState` | `LifeState` | Life state enum (Alive, Dying, Dead, Respawnable, Respawning) |
| `IsAlive` | `bool` | Shorthand for `LifeState == Alive` |
| `ModifierProp` | `CModifierProperty?` | Modifier state flags manager |
| `BodyComponent` | `CBodyComponent?` | Body component with scene node |
| `SubclassVData` | `CEntitySubclassVDataBase?` | VData subclass info (`.Name` for VData key) |

### Type Checking & Casting

```csharp
// Check if entity is a specific type
if (entity.Is<CCitadelPlayerPawn>())
{
    var pawn = entity.As<CCitadelPlayerPawn>();
    // pawn is typed, or null if cast failed
}
```

| Method | Returns | Description |
|--------|---------|-------------|
| `Is<T>()` | `bool` | Check if entity's native type matches T's class name |
| `As<T>()` | `T?` | Cast to T if native type matches, otherwise `null` |

### Lifecycle

| Method | Description |
|--------|-------------|
| `Remove()` | Marks entity for removal at end of current frame |
| `Spawn()` | Queues and executes entity spawn |
| `Spawn(void* keyValues)` | Spawn with CEntityKeyValues |

:::caution Entity Removal
Calling `Remove()` immediately after `CreateByName()` on certain entity types (e.g. `info_particle_system`) can crash the server with `WriteEnterPVS: GetEntServerClass failed`. Always delay removal by at least 1 tick:
```csharp
Timer.Once(1.Ticks(), () => entity.Remove());
```
:::

### Spawning Props With a Model

`prop_dynamic` and `prop_physics_override` need the model supplied via a `CEntityKeyValues` bag before `Spawn()`. Calling `SetModel()` on a plain `CreateByName("prop_dynamic")` before spawn produces the purple-checkerboard error model.

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("models/hideout/hideout_sandbox_ball.vmdl");
}

[ChatCommand("ball")]
public HookResult CmdBall(ChatCommandContext ctx)
{
    var pos = ctx.Controller?.GetHeroPawn()?.Position ?? Vector3.Zero;

    var prop = CBaseEntity.CreateByDesignerName("prop_dynamic");
    if (prop == null) return HookResult.Handled;

    var ekv = new CEntityKeyValues();
    ekv.SetString("model", "models/hideout/hideout_sandbox_ball.vmdl");
    ekv.SetVector("origin", pos + new Vector3(0, 0, 128));
    prop.Spawn(ekv);

    return HookResult.Handled;
}
```

**Model path gotchas:**

- Use the `.vmdl` path, **not** `.vmdl_c`. The compiled-asset suffix (`_c`) will crash the server on spawn.
- The model must be precached in `OnPrecacheResources` — runtime precache after map load isn't reliable.
- Browse available models at [s2v.app](https://s2v.app/).

For a rigid, frozen prop you can stand on:

```csharp
var prop = CBaseEntity.CreateByDesignerName("prop_physics_override");
var ekv = new CEntityKeyValues();
ekv.SetString("model", "models/abilities/viscous_cube.vmdl");
ekv.SetBool("massless", true);
ekv.SetVector("origin", pos);
prop.Spawn(ekv);
prop.AcceptInput("DisableMotion"); // freeze in place
```

**Disabling collision:** setting `"solid" = 0` in the EKV does **not** reliably disable collision on `prop_dynamic`. Fire the input after spawn instead:

```csharp
prop.AcceptInput("DisableCollision");
```

### Transform

```csharp
// Teleport entity — pass null to leave component unchanged
entity.Teleport(
    position: new Vector3(100, 200, 300),
    angles: null,    // keep current angles
    velocity: null   // keep current velocity
);

// Set velocity via Teleport (confirmed working)
entity.Teleport(null, null, new Vector3(0, 0, 1500)); // launch upward
```

#### Velocity via Schema

Reading velocity works via schema accessors. Writing via schema does **not** reliably override the engine — use `Teleport` instead.

```csharp
private static readonly SchemaAccessor<Vector3> _vecVelocity =
    new("CBaseEntity"u8, "m_vecVelocity"u8);
private static readonly SchemaAccessor<Vector3> _vecAbsVelocity =
    new("CBaseEntity"u8, "m_vecAbsVelocity"u8);

// Read current velocity
Vector3 vel = _vecVelocity.Get(entity.Handle);
Vector3 absVel = _vecAbsVelocity.Get(entity.Handle);
```

:::caution
`m_flSpeed` always reads `0` — it appears unused by the engine. Calculate speed from velocity instead: `velocity.Length()`.
:::

:::caution
`RenderFx` and `RenderMode` schema fields (`m_nRenderFX`, `m_nRenderMode`) have **no visible effect** when set on players server-side. These are likely client-only rendering properties.
:::

:::caution Model Swapping on Players
`AcceptInput("SetModel")` crashes the server. The `SetModel(string)` method exists on `CBaseEntity` but has not been verified safe on player pawns. `modifier_citadel_animalcurse` applies C++ effects but no model change. `modifier_citadel_cheater_curse` turns the player into a frog but the model never reverts — use with caution.
:::

### Parenting

```csharp
entity.SetParent(parentEntity);  // Attach to parent
entity.ClearParent();            // Detach
```

### Entity I/O

```csharp
entity.AcceptInput("Start", activator, caller, "value");
```

### Modifiers

Add modifiers (buffs/debuffs) to entities. See [Modifiers](modifiers) for full details.

```csharp
// Simple overload
using var kv = new KeyValues3();
kv.SetFloat("duration", 5.0f);
entity.AddModifier("modifier_citadel_knockdown", kv);

// Overload with ability values (used for modifiers that read VData ability values)
var abilityValues = new Dictionary<string, float> { { "TechDamage", 50f } };
entity.AddModifier("modifier_my_custom", abilityValues, kv, caster: attacker);
```

| Overload | Description |
|----------|-------------|
| `AddModifier(string name, KeyValues3? kv, CBaseEntity? caster, CBaseEntity? ability, int team)` | Simple modifier |
| `AddModifier(string name, Dictionary<string, float> abilityValues, KeyValues3? kv, CBaseEntity? caster, CBaseEntity? ability, int team)` | With ability value overrides |

### Audio

```csharp
entity.EmitSound("Mystical.Piano.AOE.Explode");
entity.EmitSound("Damage.Send.Crit", pitch: 100, volume: 0.5f, soundLevel: 75f);
```

### Damage

```csharp
// Simple damage
entity.Hurt(100f, attacker, inflictor, ability, damageType: 0);

// Full control via CTakeDamageInfo — see Damage docs
entity.TakeDamage(damageInfo);
```

See [Damage](damage) for full details.

### Schema Access

Read/write any networked schema field by class and field name:

```csharp
// Read a field
int health = entity.GetField<int>("CBaseEntity"u8, "m_iHealth"u8);

// Write a field
entity.SetField<int>("CBaseEntity"u8, "m_iHealth"u8, 500);
```

For repeated access, use a static `SchemaAccessor<T>` instead:

```csharp
private static readonly SchemaAccessor<int> _health =
    new("CBaseEntity"u8, "m_iHealth"u8);

// Usage
int hp = _health.Get(entity.Handle);
_health.Set(entity.Handle, 500);
```

#### MoveType

The `m_MoveType` and `m_nActualMoveType` schema fields control how an entity moves. Set both every tick to override the engine's movement system.

**MoveType_t enum:**

| Value | Name | Effect via Schema |
|-------|------|-------------------|
| `0` | `MOVETYPE_NONE` | No movement |
| `1` | `MOVETYPE_OBSOLETE` | Obsolete |
| `2` | `MOVETYPE_WALK` | Normal walking (default) |
| `3` | `MOVETYPE_FLY` | Fly, no gravity |
| `4` | `MOVETYPE_FLYGRAVITY` | Fly with gravity |
| `5` | `MOVETYPE_VPHYSICS` | Physics-driven |
| `6` | `MOVETYPE_PUSH` | Push movement |
| `7` | `MOVETYPE_NOCLIP` | Noclip (free flight, no collision) |
| `8` | `MOVETYPE_OBSERVER` | Observer/spectator — **freezes** the player in place |
| `9` | `MOVETYPE_STEP` | Step movement |
| `10` | `MOVETYPE_SYNC` | Sync movement |
| `11` | `MOVETYPE_CUSTOM` | Custom movement |

```csharp
private static readonly SchemaAccessor<byte> _moveType = new("CBaseEntity"u8, "m_MoveType"u8);
private static readonly SchemaAccessor<byte> _actualMoveType = new("CBaseEntity"u8, "m_nActualMoveType"u8);

// Freeze a player (MOVETYPE_OBSERVER locks position)
private void FreezePlayer(CCitadelPlayerPawn pawn, float durationSeconds)
{
    const byte MOVETYPE_OBSERVER = 8;
    const byte MOVETYPE_WALK = 2;

    var timer = Timer.Every(1.Ticks(), () =>
    {
        if (!pawn.IsValid || pawn.Health <= 0) return;
        _moveType.Set(pawn.Handle, MOVETYPE_OBSERVER);
        _actualMoveType.Set(pawn.Handle, MOVETYPE_OBSERVER);
    });

    Timer.Once(((int)durationSeconds).Seconds(), () =>
    {
        timer.Cancel();
        if (!pawn.IsValid) return;
        _moveType.Set(pawn.Handle, MOVETYPE_WALK);
        _actualMoveType.Set(pawn.Handle, MOVETYPE_WALK);
    });
}
```

> **Note:** `MOVETYPE_NOCLIP` (7) grants true noclip flight with no collision. `MOVETYPE_OBSERVER` (8) freezes the player in place despite previously being misidentified as noclip.

## Entities (Static Class)

Enumerate all server entities.

```csharp
// All entities
foreach (var entity in Entities.All) { }

// By C++ class type
foreach (var pawn in Entities.ByClass<CCitadelPlayerPawn>()) { }

// By designer name
foreach (var boss in Entities.ByDesignerName("npc_boss_tier3")) { }
```

| Method | Returns | Description |
|--------|---------|-------------|
| `Entities.All` | `IEnumerable<CBaseEntity>` | All valid entities on the server |
| `Entities.ByClass<T>()` | `IEnumerable<T>` | Entities matching native type T |
| `Entities.ByDesignerName(string)` | `IEnumerable<CBaseEntity>` | Entities with given designer name |

## EntityData\<T\>

Dictionary-like store that associates per-entity data with entities by their handle. **Automatically removes entries when an entity is deleted.**

```csharp
private readonly EntityData<IHandle?> _timers = new();

// Store data
_timers[entity] = timerHandle;

// Retrieve safely
if (_timers.TryGet(entity, out var value))
{
    // Use value
}

// Remove
_timers.Remove(entity);
```

| Method | Description |
|--------|-------------|
| `this[entity]` | Set value for entity |
| `TryGet(entity, out T)` | Try to get value, returns `true` if found |
| `GetOrAdd(entity, defaultValue)` | Get existing or insert default, returns value |
| `GetOrAdd(entity, factory)` | Get existing or create via factory func, returns value |
| `Has(entity)` | Returns `true` if entity has an entry |
| `Remove(entity)` | Remove entry for entity |
| `Clear()` | Remove all entries |

## Schema Accessors

For advanced access to entity fields not exposed by the managed API.

### SchemaAccessor\<T\>

Reads and writes a single networked schema field. Resolves offset once on first access and caches it.

```csharp
// Use UTF-8 string literals for class and field names
private static readonly SchemaAccessor<int> _maxHealth =
    new("CBaseEntity"u8, "m_iMaxHealth"u8);
```

### SchemaStringAccessor

Write-only accessor for `CUtlSymbolLarge` (string) fields:

```csharp
private static readonly SchemaStringAccessor _name =
    new("CBaseEntity"u8, "m_iszPrivateVScripts"u8);

_name.Set(entity.Handle, "my_script");
```

### SchemaArrayAccessor\<T\>

Reads/writes array-typed fields:

```csharp
private static readonly SchemaArrayAccessor<float> _dmgTypes =
    new("CBaseEntity"u8, "m_flDamageTypes"u8);

float val = _dmgTypes.Get(entity.Handle, index: 0);
```

## Common Entity Types

Entity types found on a typical Deadlock server (from `CBaseEntity.FromIndex` iteration):

| Class | Designer | Description |
|-------|----------|-------------|
| `CCitadelPlayerPawn` | `player` | Player hero entity |
| `CCitadelPlayerController` | - | Player controller |
| `CNPC_Trooper` | - | Lane troopers |
| `CNPC_TrooperNeutral` | - | Neutral camp NPCs |
| `CNPC_TrooperBoss` | - | Trooper boss |
| `CNPC_Boss_Tier2` | `npc_boss_tier2` | Tier 2 (lane) guardian |
| `CNPC_Boss_Tier3` | `npc_boss_tier3` | Tier 3 (base) patron |
| `CNPC_BarrackBoss` | - | Barracks walker |
| `CNPC_MidBoss` | - | Mid boss (Rejuvenator) |
| `CNPC_BaseDefenseSentry` | - | Base defense turrets |
| `CNPC_Neutral_Bug` | - | Neutral jungle bugs |
| `CCitadel_BreakableProp` | - | Breakable props (boxes, crates) |
| `CDynamicProp` | - | Dynamic props |
| `CParticleSystem` | - | Particle effect entities |
| `CWorld` | `worldent` | The world entity |
| `CCitadelZipLineNode` | - | Zipline nodes |
| `CItemXP` | - | Soul orb pickups |

## NativeEntity

Base class for all managed wrappers around native C++ entity/object pointers.

| Property | Type | Description |
|----------|------|-------------|
| `Handle` | `IntPtr` | Raw pointer to the native object |
| `IsValid` | `bool` | `true` if the pointer is non-null |

:::warning `IsValid` is a null-check, not a liveness-check
`IsValid` only tells you whether the managed wrapper has a non-null pointer. It returns `true` even after the underlying entity has been `Remove()`d or the player has disconnected. To check whether an entity still actually exists, round-trip through the entity handle table:

```csharp
bool IsAlive(CBaseEntity? e) =>
    e != null && CBaseEntity.FromHandle(e.EntityHandle) != null;

// or for a typed check
bool Exists(CBaseEntity? e) => e?.As<CBaseEntity>() != null;
```

The `FromHandle` round-trip consults the engine's entity table, so it returns `null` once the entity is gone. Use this whenever you're holding an entity reference across ticks (in a timer, cached field, or collection).
:::

## CEntitySubclassVDataBase

Wraps the VData subclass pointer stored on an entity, providing its design-time name.

## See Also

- [Players](players) — Player-specific entity types
- [Modifiers](modifiers) — Adding buffs/debuffs via `AddModifier`
- [Damage](damage) — Applying damage to entities
- [Entity I/O](entity-io) — Hooking entity inputs/outputs
