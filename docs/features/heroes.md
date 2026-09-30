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
| `ToDisplayName(Heroes)` | `string` | Converts to localized display name (e.g. `"Grey Talon"` for `Orion`) |
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

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `IsValid` | `bool` | Whether the hero data pointer is valid |
| `HeroID` | `int` | Internal hero ID |
| `Disabled` | `bool` | Whether hero is disabled |
| `PlayerSelectable` | `bool` | Whether players can select this hero |
| `InDevelopment` | `bool` | Whether hero is still in development |
| `Complexity` | `int` | Hero complexity rating |
| `NewPlayerRecommended` | `bool` | Recommended for new players |
| `AvailableInGame` | `bool` | Computed — true if selectable, not disabled, not development-only |

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

Heroes must be precached if you're swapping them at runtime. See [Precaching](precaching).

Deadworks currently automatically precaches all heroes.

## See Also

- [Players](players) — `SelectHero` on controllers
- [Precaching](precaching) — Hero precaching
- [Team & Hero Management Guide](../guides/team-and-hero-management) — Practical patterns
