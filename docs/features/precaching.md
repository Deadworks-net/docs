---
title: "Precaching"
sidebar_label: "Precaching"
---

# Precaching

> **Namespace:** `DeadworksManaged.Api`

Precaching tells the game to load a file while the map is loading, so it is ready when your plugin uses it. Models and particle effects need it.

## Precache a model or particle effect

Override `OnPrecacheResources` and list each file with `Precache.AddResource`.

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("models/hideout/hideout_sandbox_ball.vmdl");
    Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
}
```

This is the only place it works. Calling `Precache.AddResource` anywhere else does nothing.

## Write the path the right way

Use the file's plain name, not the compiled one ending in `_c`.

```csharp
// Right
Precache.AddResource("models/abilities/viscous_cube.vmdl");

// Wrong. It won't load, and may crash when you use it
Precache.AddResource("models/abilities/viscous_cube.vmdl_c");
```

Browse the game's files with [Source2Viewer](https://s2v.app/) to find paths.

## Precache a hero

If your plugin switches players to a hero, precache that hero.

```csharp
public override void OnPrecacheResources()
{
    Precache.AddHero(Heroes.Warden);
    Precache.AddHero(Heroes.Astro);
}
```

## Use your own models, sounds or maps

Precaching only loads files the player already has. To get your own files onto players' computers, see [Uploading Content](../guides/uploading-content).
