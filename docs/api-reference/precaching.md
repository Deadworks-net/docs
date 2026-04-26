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

## What Happens If You Skip Precaching

If a resource isn't precached before you try to use it, the symptoms are:

- **Models** — the entity spawns with the purple-checkerboard error model
- **Particles** — nothing renders, or silent fallback to a generic particle

If you see error models after adding a prop spawn, the first thing to check is whether you listed the model in `OnPrecacheResources`.

## File Path Format

Use the uncompiled path (`.vmdl`, `.vpcf`, `.vmat`), **not** the compiled variant (`.vmdl_c`, `.vpcf_c`). The engine resolves precache requests by the source path; passing `_c` suffixes silently fails or crashes on spawn.

```csharp
// Correct
Precache.AddResource("models/abilities/viscous_cube.vmdl");

// Wrong — will not precache, may crash on use
Precache.AddResource("models/abilities/viscous_cube.vmdl_c");
```

## Custom Content For Clients

Deadworks runs on the server, but the **client still has to own the files** — models, sounds, custom maps. Deadlock's client has no built-in "download from server" path, unlike Source 1 games. This means:

- If you want a custom map, **every player must install it** (such as via the Deadworks Launcher)
- Custom skins, fonts in `.vmat`, and custom sounds all require client-side installation
- `point_worldtext` fonts come from the player's **operating system** font library — you can't ship a font via the server. Stick to common Windows fonts (Arial, Segoe UI, Comic Sans MS, Consolas…)

## See Also

- [Particles](particles) — Particle effects require precaching
- [World Text](world-text) — Fonts are resolved from the client's OS
- [Heroes](heroes) — Hero precaching for dynamic selection
