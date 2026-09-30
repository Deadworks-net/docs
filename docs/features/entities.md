---
title: "Entities"
sidebar_label: "Entities"
---

# Entities

> **Namespace:** `DeadworksManaged.Api`

An entity is anything in the game world: a player's hero, a trooper, a boss, a prop, a particle effect. In code, every one of them is a `CBaseEntity`.

## See what you can create

The [entity database](https://deadworks.net/db/entities) lists every entity the Deadlock server can create.

Each entity has its own page, such as [`prop_dynamic`](https://deadworks.net/db/entities/prop_dynamic), that shows:

- its **name**, which you pass to `CreateByDesignerName`
- its **keyvalues**, the settings you give it when it spawns
- its **inputs**, the things you can tell it to do
- its **outputs**, the things it tells you about

## Create an entity

Create it, fill in its keyvalues, then spawn it.

```csharp
var prop = CBaseEntity.CreateByDesignerName("prop_dynamic");
if (prop == null) return;

var ekv = new CEntityKeyValues();
ekv.SetString("model", "models/hideout/hideout_sandbox_ball.vmdl");
ekv.SetVector("origin", new Vector3(100, 200, 300));
prop.Spawn(ekv);
```

The database shows which `Set...` method to use for each keyvalue.

A model has to be loaded before you can use it. List it in `OnPrecacheResources`, and use the `.vmdl` path, not `.vmdl_c`:

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("models/hideout/hideout_sandbox_ball.vmdl");
}
```

## Find entities

```csharp
// Every entity with one name
foreach (var boss in Entities.ByDesignerName("npc_boss_tier3"))
{
    // ...
}

// Every entity of one type
foreach (var pawn in Entities.ByClass<CCitadelPlayerPawn>())
{
    // ...
}

// Everything
foreach (var entity in Entities.All)
{
    // ...
}
```

## Check what an entity is

```csharp
var pawn = entity.As<CCitadelPlayerPawn>();
if (pawn != null)
{
    // It's a player's hero
}
```

`entity.DesignerName` is its name, like `"npc_boss_tier3"`.

## Move an entity

```csharp
entity.Teleport(
    position: new Vector3(100, 200, 300),
    angles: null,
    velocity: null);
```

Pass `null` for anything you want to leave alone. `entity.Position` is where it is now.

## Remove an entity

```csharp
entity.Remove();
```

Don't remove an entity on the same tick you created it. Wait a tick:

```csharp
Timer.Once(1.Ticks(), () => entity.Remove());
```

## Tell an entity to do something

Fire one of its inputs with `AcceptInput`. The inputs are listed on its database page.

```csharp
prop.AcceptInput("DisableCollision");
```

To run code when an entity fires an output, see [Entity I/O](entity-io).

## Attach one entity to another

```csharp
entity.SetParent(parentEntity);
entity.ClearParent();
```

An attached entity is removed when its parent is removed.

## Heal or damage an entity

```csharp
entity.Heal(entity.GetMaxHealth()); // back to full
entity.Hurt(100f);                  // take 100 damage
```

`entity.Health` is its current health. See [Damage](damage) to credit the damage to an attacker.

## Keep an entity for later

An entity can be removed at any time. If you keep one in a field or use it in a timer, check `IsValid` before you touch it.

```csharp
Timer.Once(5.Seconds(), () =>
{
    if (!entity.IsValid) return;

    entity.Remove();
});
```

## Store a value for each entity

Use `EntityData<T>`. Entries are removed for you when the entity is removed.

```csharp
private readonly EntityData<int> _hits = new();

_hits[entity] = 5;

if (_hits.TryGet(entity, out var hits))
{
    // ...
}
```
