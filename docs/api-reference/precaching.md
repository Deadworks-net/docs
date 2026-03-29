---
title: "Precaching"
sidebar_label: "Precaching"
---

# Precaching

> **Namespace:** `DeadworksManaged.Api`

Resources (particles, models, heroes) must be precached during map load before they can be used at runtime.

## When to Precache

Override `OnPrecacheResources()` in your plugin — it is called during map load:

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
    Precache.AddResource("particles/abilities/bull_drain.vpcf");
    Precache.AddHero(Heroes.Inferno);
}
```

**Important:** All `Precache` methods must be called inside `OnPrecacheResources()`. Calling them at other times has no effect.

## Precache Methods

| Method | Description |
|--------|-------------|
| `AddResource(string path)` | Precache a resource by path (particles, models, etc.) |
| `AddHero(string heroName)` | Precache a hero by internal name (e.g. `"hero_inferno"`) |
| `AddHero(Heroes hero)` | Precache a hero by enum value (calls `hero.ToHeroName()` internally) |

## Resource Paths

Resources use Valve's VPK path format:

```csharp
// Particle effects
Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
Precache.AddResource("particles/abilities/bull_drain.vpcf");

// Models (if needed)
Precache.AddResource("models/props/my_model.vmdl");
```

## Hero Precaching

If your plugin swaps heroes or abilities at runtime, you must precache them:

```csharp
public override void OnPrecacheResources()
{
    // Precache specific heroes
    Precache.AddHero(Heroes.Inferno);
    Precache.AddHero(Heroes.Wraith);

    // Precache additional heroes as needed
    Precache.AddHero("hero_astro");  // by string name
}
```

## See Also

- [Plugin Base](plugin-base) — `OnPrecacheResources()` lifecycle hook
- [Particles](particles) — Particle effects require precaching
- [Heroes](heroes) — Hero precaching for dynamic selection
