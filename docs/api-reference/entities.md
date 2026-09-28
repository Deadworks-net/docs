---
title: "Entities"
sidebar_label: "Entities"
---

# Entities

> **Namespace:** `DeadworksManaged.Api`

All Source 2 server entities are wrapped by `CBaseEntity` and its subclasses (`CCitadelPlayerPawn`, `CNPC_Trooper`, `CParticleSystem`, …). This page covers what every entity has in common: creation, lifecycle, transform, parenting, and how to escape into raw schema access when the managed API doesn't expose what you need.

## Creation & Lookup

```csharp
var prop = CBaseEntity.CreateByDesignerName("prop_dynamic");
var boss = CBaseEntity.CreateByDesignerName("npc_boss_tier2");

var entity = CBaseEntity.FromHandle(someHandle);
var pawn   = CBaseEntity.FromHandle<CCitadelPlayerPawn>(handle);
```

| Method | Returns | Description |
|---|---|---|
| `CreateByName(string className)` | `CBaseEntity?` | Create by **C++ class name** (e.g. `"info_particle_system"`, `"prop_dynamic"`) |
| `CreateByDesignerName(string designerName)` | `CBaseEntity?` | Create by **designer name**. Many entities in Deadlock are subclasses of other classes. |
| `FromHandle(uint handle)` / `FromHandle<T>(uint)` | `CBaseEntity?` / `T?` | Look up by entity handle |
| `FromIndex(int index)` / `FromIndex<T>(int)` | `CBaseEntity?` / `T?` | Look up by global entity index |

> **Rule of thumb:** prefer `CreateByDesignerName`. Entities that rely on subclass VData (`npc_boss_tier2`, `citadel_breakable_prop`, …) routinely crash when created via `CreateByName` alone because their VData pointer isn't populated before `Spawn()`.

## Common Properties

| Property | Type | Description |
|---|---|---|
| `Name` | `string` | Entity targetname |
| `DesignerName` | `string` | Designer/map name (`"npc_boss_tier3"`, `"player"`) |
| `Classname` | `string` | C++ class name (`"CCitadelPlayerPawn"`) |
| `EntityHandle` | `uint` | Full 32-bit entity handle |
| `EntityIndex` | `int` | Index (lower 14 bits of handle) |
| `Position` | `Vector3` | World position (via `BodyComponent.SceneNode.AbsOrigin`) |
| `AbsVelocity` | `Vector3` | Absolute velocity (get/set). See [Transform](#transform) for the caveats around writing it. |
| `TeamNum` | `int` | Team index (get/set) |
| `Health` | `int` | Current health (get/set). See [Health](#health) |
| `MaxHealth` | `int` | Raw max-health field (read-only). Use `GetMaxHealth()` instead |
| `GetMaxHealth()` | `int` | Max health, including items and buffs on heroes |
| `Heal(float amount)` | `int` | Heal, capped at max health; returns the amount actually healed |
| `LifeState` / `IsAlive` | `LifeState` / `bool` | Lifecycle state (`Alive`, `Dying`, `Dead`, `Respawnable`, `Respawning`) |
| `IsOnGround` | `bool` | `true` when `m_hGroundEntity` is valid |
| `GroundEntity` | `CBaseEntity?` | The entity the pawn is standing on, or `null` if airborne |
| `ModifierProp` | `CModifierProperty?` | Entry point for modifiers and state flags — see [Modifiers](modifiers) |
| `BodyComponent` | `CBodyComponent?` | Scene node, transform, model |
| `SubclassVData` | `CEntitySubclassVDataBase?` | Subclass VData pointer; `.Name` returns the designer key |

### Type Checking & Casting

```csharp
if (entity.Is<CCitadelPlayerPawn>())
{
    var pawn = entity.As<CCitadelPlayerPawn>();
    // pawn is typed, or null if the cast failed
}
```

| Method | Description |
|---|---|
| `Is<T>()` | Native class name matches `T` |
| `As<T>()` | Typed wrapper, or `null` if the cast would fail |

## Health

```csharp
// Top a pawn back up to full
pawn.Heal(pawn.GetMaxHealth());

int missing = pawn.GetMaxHealth() - pawn.Health;
```

| Member | Use it for |
|---|---|
| `Health` | Reading current health. Setting it changes the number directly: it isn't capped at max health and doesn't count as a heal or as damage. |
| `GetMaxHealth()` | Max health. On heroes this includes items and buffs. |
| `MaxHealth` | Rarely needed. Read-only, and on heroes it isn't kept up to date with items and buffs, so use `GetMaxHealth()`. |
| `Heal(float amount)` | Healing. Capped at `GetMaxHealth()`; returns how much was actually added. |

To damage or kill, use [`Hurt()`](damage#applying-damage) rather than setting `Health`, so the game runs its normal damage and death handling.

**`Heal()` gotchas:**

- The amount is truncated, so `Heal(10.9f)` adds 10.
- At or above max health it adds nothing and returns 0. It doesn't remove overheal.
- It returns 0 without healing on entities that can't take damage.
- A negative amount isn't rejected: it lowers health.

### Watching heals

Heals show up in `OnModifierEvent` as one of two events, depending on where they came from:

| Event | Raised by | What you get |
|---|---|---|
| `HealthTaken` | `Heal()` calls | `args.Damage` with `Victim`, `HealthRequested` and `HealthApplied` |
| `UnitHealed` | The game's own healing, which doesn't go through `Heal()` | `args.Target` is the healed entity and `args.Caster` is the healer, which can be null |

```csharp
public override void OnModifierEvent(ModifierEvent args)
{
    if (args.Event == EModifierEvent.HealthTaken && args.Damage is { } heal)
    {
        // A Heal() call.
        // heal.Victim          - the entity being healed
        // heal.HealthRequested - the amount asked for
        // heal.HealthApplied   - what actually landed after the max-health cap
    }
    else if (args.Event == EModifierEvent.UnitHealed)
    {
        // The game healed args.Target. args.Caster is the healer, if there is one.
    }
}
```

`HealthTaken` fires even when nothing was healed (`HealthApplied` is 0), for example on a target already at full health.

## Lifecycle

| Method | Description |
|---|---|
| `Spawn()` | Queue and execute spawn |
| `Spawn(CEntityKeyValues)` | Spawn with key-values (model path, origin, custom params) |
| `Remove()` | Mark for removal at end of frame (`UTIL_Remove`) |

:::caution `Remove()` immediately after `CreateByName()`
Some entity types (`info_particle_system`, projectiles) crash with `WriteEnterPVS: GetEntServerClass failed` if removed on the same tick they were created. Delay by at least one tick:

```csharp
Timer.Once(1.Ticks(), () => entity.Remove());
```
:::

## Spawning Props With a Model

`prop_dynamic` and `prop_physics_override` need the model path supplied via `CEntityKeyValues` **before** `Spawn()`. Calling `SetModel()` on a freshly-created prop prior to spawn shows the purple-checkerboard error model.

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("models/hideout/hideout_sandbox_ball.vmdl");
}

[Command("ball")]
public void CmdBall(CCitadelPlayerController caller)
{
    var pos = caller.GetHeroPawn()?.Position ?? Vector3.Zero;

    var prop = CBaseEntity.CreateByDesignerName("prop_dynamic");
    if (prop == null) return;

    var ekv = new CEntityKeyValues();
    ekv.SetString("model", "models/hideout/hideout_sandbox_ball.vmdl");
    ekv.SetVector("origin", pos + new Vector3(0, 0, 128));
    prop.Spawn(ekv);
}
```

**Model-path rules:**

- Use the `.vmdl` path — **not** `.vmdl_c`. The compiled suffix crashes the server on spawn.
- The model must be listed in `OnPrecacheResources`. Runtime precache after map load isn't reliable.
- Browse available models using [Source2Viewer](https://s2v.app/).

### Frozen physics prop

```csharp
var prop = CBaseEntity.CreateByDesignerName("prop_physics_override");
var ekv = new CEntityKeyValues();
ekv.SetString("model", "models/abilities/viscous_cube.vmdl");
ekv.SetBool("massless", true);
ekv.SetVector("origin", pos);
prop.Spawn(ekv);
prop.AcceptInput("DisableMotion"); // lock in place
```

### Disabling collision

`"solid" = 0` in the EKV does **not** disable collision on `prop_dynamic`. Fire the input after spawn:

```csharp
prop.AcceptInput("DisableCollision");
```

## Transform

```csharp
// Teleport — pass null to leave a component unchanged
entity.Teleport(
    position: new Vector3(100, 200, 300),
    angles:   null,
    velocity: null);

// Set velocity mid-flight via Teleport
entity.Teleport(null, null, new Vector3(0, 0, 1500));
```

Reading velocity is straightforward (`entity.AbsVelocity`). Writing via the `AbsVelocity` setter works for simple cases, but for projectiles and anything driven by the physics path, **use `Teleport(velocity: …)`** — it's the only write that routes through the engine cleanly.

Camera and view angles are networked separately from entity angles. `Teleport(angles: …)` rotates the model, not the client's camera. For player view control see [Networking — Set client camera angles](networking#set-client-camera-angles).

### Model swapping

```csharp
pawn.SetModel("models/heroes_wip/werewolf/werewolf.vmdl"); // precache first
```

See the shipped `SetModelPlugin` example for a complete command that swaps the player to a werewolf model.

## Parenting

```csharp
entity.SetParent(parentEntity); // implemented via AcceptInput("SetParent", …)
entity.ClearParent();
```

Parented children are removed automatically when the parent is removed — handy for pawn-attached UI (`point_worldtext` nametags, timer overlays). See [World Text — Nametag pattern](world-text#nametag-pattern).

## Entity I/O

```csharp
entity.AcceptInput("Start", activator, caller, "value");
```

See [Entity I/O](entity-io) for hooking inputs and outputs rather than just firing them.

## Modifiers

Entities expose modifiers through two surfaces:

- `entity.AddModifier(…)` / `entity.RemoveModifier(…)` — apply and remove by name or instance
- `entity.ModifierProp` — state flags (`SetModifierState`) and the list of currently-active modifiers

Both overloads of `AddModifier` live on `CBaseEntity`:

```csharp
// Plain
using var kv = new KeyValues3();
kv.SetFloat("duration", 5.0f);
entity.AddModifier("modifier_citadel_knockdown", kv);

// With per-instance ability-value overrides (for modifiers that read
// values off their owning ability)
entity.AddModifier("ability_doorman_bomb/debuff",
    abilityValues: new() { ["SlowPercent"] = 100.0f },
    kv: kv);
```

Full reference: [Modifiers](modifiers).

## Damage

```csharp
entity.Hurt(100f);                                   // self-damage, default attribution
entity.Hurt(100f, attacker: shooter);                // credited to shooter
entity.TakeDamage(customTakeDamageInfo);             // full CTakeDamageInfo control
```

Full reference: [Damage](damage).

## Audio

```csharp
entity.EmitSound("Mystical.Piano.AOE.Explode");
entity.EmitSound("Damage.Send.Crit", pitch: 100, volume: 0.5f, delay: 0f);
```

Full reference: [Sound](sound) — covers global sound, per-client limitations, and soundevent discovery.

---

## Schema Access (Advanced)

:::note Advanced
Raw schema access requires some engine knowledge — you're reading and writing the game's networked fields directly. If you're not sure whether this is the right approach for what you're trying to do, ask in the Deadworks Discord.
:::

When the managed API doesn't expose the field you need, you can read or write it by class + field name.

### One-off reads and writes

```csharp
int health = entity.GetField<int>("CBaseEntity"u8, "m_iHealth"u8);
entity.SetField<int>("CBaseEntity"u8, "m_iHealth"u8, 500);
```

### Cached accessors (preferred for hot paths)

`SchemaAccessor<T>` resolves the offset once and caches it — use this whenever the access happens in a loop, timer, or tick hook.

```csharp
private static readonly SchemaAccessor<int> _health =
    new("CBaseEntity"u8, "m_iHealth"u8);

int hp = _health.Get(entity.Handle);
_health.Set(entity.Handle, 500);
```

#### Variants

| Accessor | Use for |
|---|---|
| `SchemaAccessor<T>` | Single-value fields of unmanaged type (`int`, `float`, `Vector3`, `byte`, …) |
| `SchemaStringAccessor` | `CUtlSymbolLarge` string fields (write-only) |
| `SchemaArrayAccessor<T>` | Array-typed fields — use an `index` parameter |

---

## `Entities` (Static Class)

Iterate entities currently on the server.

```csharp
foreach (var e in Entities.All) { … }
foreach (var p in Entities.ByClass<CCitadelPlayerPawn>()) { … }
foreach (var b in Entities.ByDesignerName("npc_boss_tier3")) { … }
```

| Member | Returns | Description |
|---|---|---|
| `Entities.All` | `IEnumerable<CBaseEntity>` | All valid server entities |
| `Entities.ByClass<T>()` | `IEnumerable<T>` | Filter by native C++ type |
| `Entities.ByDesignerName(string)` | `IEnumerable<CBaseEntity>` | Filter by designer name |

## `EntityData<T>`

Per-entity keyed storage that auto-evicts entries when the entity is deleted. Use this instead of stashing entity references in a plain `Dictionary` — the latter leaks or holds stale handles.

```csharp
private readonly EntityData<IHandle?> _timers = new();

_timers[entity] = timerHandle;

if (_timers.TryGet(entity, out var value)) { … }

_timers.Remove(entity);
```

| Method | Description |
|---|---|
| `this[entity]` | Set value |
| `TryGet(entity, out T)` | Try-get, returns `true` on hit |
| `GetOrAdd(entity, defaultValue)` / `GetOrAdd(entity, factory)` | Get existing or insert |
| `Has(entity)` | Does an entry exist |
| `Remove(entity)` / `Clear()` | Remove one / all |

## NativeEntity (Base)

`CBaseEntity` inherits from `NativeEntity`, the minimal wrapper over a native pointer. You'll only touch this directly when writing custom schema wrappers.

| Property | Type | Description |
|---|---|---|
| `Handle` | `nint` | Raw pointer to the native object |
| `IsValid` | `bool` | Non-null pointer check (see note below) |

:::info `IsValid` on entities is a real liveness check
On the base `NativeEntity`, `IsValid` only verifies the wrapper's pointer is non-null. `CBaseEntity` **overrides** it to re-resolve the entity through the handle table (serial-number aware), so on entities `IsValid` correctly returns `false` after the entity has been `Remove()`d or a player disconnects. `Handle` likewise re-resolves on every access.

When holding an entity reference across ticks (timer callbacks, cached fields, collections), check `IsValid` — or `IsAlive` if you also need it to still be living — before touching it.
:::

## See Also

- [Players](players) — `CCitadelPlayerPawn`, `CCitadelPlayerController`, ability and currency helpers
- [Modifiers](modifiers) — `AddModifier`, `EModifierState`, `CModifierProperty`
- [Damage](damage) — `Hurt`, `CTakeDamageInfo`, `OnTakeDamage`
- [Sound](sound) — `EmitSound`, global/per-client playback recipes
- [Entity I/O](entity-io) — Hooking designer inputs and outputs
- [Tracing](tracing) — Ray and shape traces for LOS, collision, aim
