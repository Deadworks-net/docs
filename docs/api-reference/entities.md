---
title: "Entities"
sidebar_label: "Entities"
---

# Entities

> **Namespace:** `DeadworksManaged.Api`

An entity is anything in the game world: a player, a trooper, a prop, a particle effect. Every entity is a `CBaseEntity`.

## What You Can Create

The [entity database](https://deadworks.net/db/entities) lists every entity the Deadlock server can create.

Each entity has its own page, such as [`prop_dynamic`](https://deadworks.net/db/entities/prop_dynamic), that tells you what you can do with it:

| On the page | Use it with |
|-------------|-------------|
| Name | `CBaseEntity.CreateByDesignerName(name)` |
| Keyvalues | `CEntityKeyValues`, with the `Set...` method shown next to each one |
| Inputs | `entity.AcceptInput(name)` |
| Outputs | [Entity I/O](entity-io) |

## Quick Start

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("models/hideout/hideout_sandbox_ball.vmdl");
}

[Command("ball")]
public void CmdBall(Caller caller)
{
    var pos = caller.Player?.GetHeroPawn()?.Position ?? Vector3.Zero;

    var prop = CBaseEntity.CreateByDesignerName("prop_dynamic");
    if (prop == null) return;

    var ekv = new CEntityKeyValues();
    ekv.SetString("model", "models/hideout/hideout_sandbox_ball.vmdl");
    ekv.SetVector("origin", pos + new Vector3(0, 0, 128));
    prop.Spawn(ekv);
}
```

That spawns a ball above the player who typed `/ball`.

Set the model in the keyvalues before `Spawn()`. Use the `.vmdl` path, not `.vmdl_c`, and precache it first.

## Creating and Finding

| Method | Returns | Description |
|--------|---------|-------------|
| `CBaseEntity.CreateByDesignerName(string name)` | `CBaseEntity?` | Create an entity. Use this one |
| `CBaseEntity.CreateByName(string className)` | `CBaseEntity?` | Create by class name. Some entities crash when made this way |
| `CBaseEntity.FromHandle<T>(uint handle)` | `T?` | Find by entity handle |
| `CBaseEntity.FromIndex<T>(int index)` | `T?` | Find by entity index |
| `Entities.All` | `IEnumerable<CBaseEntity>` | Every entity on the server |
| `Entities.ByClass<T>()` | `IEnumerable<T>` | Every entity of one type |
| `Entities.ByDesignerName(string name)` | `IEnumerable<CBaseEntity>` | Every entity with one name |

```csharp
foreach (var boss in Entities.ByDesignerName("npc_boss_tier3"))
{
    // ...
}
```

## CBaseEntity

Every entity has these, whether it is a player, a trooper or a prop.

| Member | Description |
|--------|-------------|
| `Spawn(CEntityKeyValues)` | Put a created entity into the world |
| `Remove()` | Delete the entity. Wait a tick after creating it |
| `IsValid` | Whether the entity still exists. Check it before using one you kept |
| `DesignerName` | The entity's name, like `"npc_boss_tier3"` |
| `Position` | Where it is in the world |
| `TeamNum` | Its team |
| `IsAlive` | Whether it is alive |
| `Health` | Its current health |
| `GetMaxHealth()` | Its max health, including items and buffs |
| `Heal(float amount)` | Heal it, up to max health. Returns the amount healed |
| `AcceptInput(string name)` | Fire one of its inputs |
| `SetParent(CBaseEntity)` | Attach it to another entity |
| `Is<T>()` | Whether it is a `T` |
| `As<T>()` | The entity as a `T`, or `null` |

```csharp
foreach (var boss in Entities.ByDesignerName("npc_boss_tier3"))
{
    boss.Heal(boss.GetMaxHealth());
}
```

To damage or kill an entity, use [`Hurt()`](damage#applying-damage) instead of setting `Health`.

## Transform

Use `Teleport` to move an entity. Pass `null` for anything you want to leave alone.

```csharp
entity.Teleport(
    position: new Vector3(100, 200, 300),
    angles: null,
    velocity: null);
```

Read velocity with `entity.AbsVelocity`. Set it with `Teleport(velocity: ...)`.

## EntityData

Use `EntityData<T>` to keep a value for each entity. Entries are removed for you when the entity is deleted.

```csharp
private readonly EntityData<int> _kills = new();

_kills[pawn] = 5;

if (_kills.TryGet(pawn, out var kills))
{
    // ...
}
```

| Member | Description |
|--------|-------------|
| `this[entity]` | Set the value |
| `TryGet(entity, out T)` | Get the value, if there is one |
| `GetOrAdd(entity, defaultValue)` | Get the value, or add one |
| `Has(entity)` | Whether there is a value |
| `Remove(entity)` | Remove the value |
