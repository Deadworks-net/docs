---
title: "Heroes"
sidebar_label: "Heroes"
---

# Heroes

> **Namespace:** `DeadworksManaged.Api`

Work with Deadlock hero identities, data, and selection.

## Heroes Enum

Enum of all Deadlock hero identities. Use `HeroTypeExtensions` to convert between enum values and string names.

```csharp
Heroes hero = Heroes.Inferno;
```

## HeroTypeExtensions

Extension methods for the `Heroes` enum.

| Method | Returns | Description |
|--------|---------|-------------|
| `ToHeroName(Heroes)` | `string` | Converts to internal name (e.g. `"hero_inferno"`) |
| `TryParse(string, out Heroes)` | `bool` | Parses name string back to enum |
| `GetHeroData(Heroes)` | `CitadelHeroData?` | Gets native VData for the hero |

### Examples

```csharp
// Enum to string
string name = Heroes.Inferno.ToHeroName();  // "hero_inferno"

// String to enum
if (HeroTypeExtensions.TryParse("hero_inferno", out var hero))
{
    Console.WriteLine($"Found hero: {hero}");
}

// Get hero data
var heroData = Heroes.Inferno.GetHeroData();
```

## CitadelHeroData

Wrapper around native `CitadelHeroData_t` (VData). Obtain via `Heroes.GetHeroData()`.

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `GetField<T>(ReadOnlySpan<byte> fieldName)` | `T` | Read any schema field by name at runtime |

## Hero Selection

Force a player to select a specific hero via [CCitadelPlayerController](players):

```csharp
controller.SelectHero(Heroes.Inferno);
```

### Random Hero Assignment

```csharp
var heroes = Enum.GetValues<Heroes>();
var randomHero = heroes[Random.Shared.Next(heroes.Length)];
controller.SelectHero(randomHero);
```

## Precaching Heroes

Heroes must be precached if you're swapping them at runtime. See [Precaching](precaching):

```csharp
public override void OnPrecacheResources()
{
    // Precache a specific hero
    Precache.AddHero(Heroes.Inferno);
    Precache.AddHero("hero_wraith");

    // Or precache all heroes (for plugins that swap heroes dynamically)
    Precache.AddAllHeroes();
}
```

## See Also

- [Players](players) — `SelectHero` on controllers
- [Precaching](precaching) — Hero precaching
- [Team & Hero Management Guide](../guides/team-and-hero-management) — Practical patterns
