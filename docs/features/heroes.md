---
title: "Heroes"
sidebar_label: "Heroes"
---

# Heroes

> **Namespace:** `DeadworksManaged.Api`

Every hero is a value of the `Heroes` enum, like `Heroes.Haze`.

The enum uses the game's internal names, which are not always the names players see. Infernus is `Heroes.Inferno`, and Grey Talon is `Heroes.Orion`.

## Find a hero

The [hero database](https://deadworks.net/db/heroes) lists every hero with the name players see and the `Heroes` value to use in code.

## Make a player play a hero

```csharp
controller.SelectHero(Heroes.Inferno);
```

## Find out which hero a player is

```csharp
var pawn = controller.GetHeroPawn();
if (pawn == null) return;

if (pawn.HeroID == Heroes.Inferno)
{
    // They are playing Infernus
}
```

## Show a hero's name

Use `ToDisplayName()` to get the name players see.

```csharp
string name = Heroes.Orion.ToDisplayName(); // "Grey Talon"

caller.Reply($"You are playing {pawn.HeroID.ToDisplayName()}.");
```

## Give a player a random hero

Not every hero in the enum can be played, so pick from the ones that can.

```csharp
var heroes = Enum.GetValues<Heroes>()
    .Where(h => h.GetHeroData()?.AvailableInGame == true)
    .ToArray();

var hero = heroes[Random.Shared.Next(heroes.Length)];

controller.SelectHero(hero);
```

## Check whether a hero can be played

```csharp
var data = Heroes.Inferno.GetHeroData();

if (data?.AvailableInGame == true)
{
    // Players can pick this hero
}
```

`GetHeroData()` also tells you more about the hero, such as `Complexity` and `NewPlayerRecommended`.

## Run code once a player's new hero is ready

`SelectHero` doesn't change the hero straight away. To do something to the new hero, such as giving it items, wait for it with `OnceHeroInitialized`.

```csharp
var pawn = controller.GetHeroPawn();
if (pawn == null) return;

pawn.OnceHeroInitialized(() =>
{
    pawn.AddItem("upgrade_sprint_booster");
});

controller.SelectHero(Heroes.Inferno);
```

## Reset a player's hero

```csharp
pawn.ResetHero();
```

This removes their items, puts back their starting abilities and resets their level.

## Stop players changing hero

Block the `selecthero` command.

```csharp
public override HookResult OnClientConCommand(ClientConCommandEvent e)
{
    if (e.Command == "selecthero")
        return HookResult.Stop;

    return HookResult.Continue;
}
```

## Turn a hero into its internal name, or back

```csharp
string name = Heroes.Inferno.ToHeroName(); // "hero_inferno"

if (HeroTypeExtensions.TryParse("hero_inferno", out var hero))
{
    // hero is Heroes.Inferno
}
```
