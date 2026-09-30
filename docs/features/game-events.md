---
title: "Game Events"
sidebar_label: "Game Events"
---

# Game Events

> **Namespace:** `DeadworksManaged.Api`

A game event is a notice the game sends out when something happens: a player dies, picks a hero, or uses an ability. Your plugin can listen for any of them.

## Find an event

The [event database](https://deadworks.net/db/events) lists every event in the game. Each event has its own page, such as [`player_death`](https://deadworks.net/db/events/player_death), that shows its fields.

Some useful ones:

- `player_death` when a hero dies
- `player_respawned` when a player respawns
- `player_hero_changed` when a player picks or changes hero
- `player_used_ability` when a player uses an ability, shoots or melees
- `ability_added` when a player gets an ability or an item

## Run code when an event happens

Put `[GameEventHandler]` on a method, with the event's name. Every event has a class to go with it.

```csharp
[GameEventHandler("player_hero_changed")]
public HookResult OnPlayerHeroChanged(PlayerHeroChangedEvent args)
{
    var pawn = args.Userid?.As<CCitadelPlayerPawn>();
    if (pawn == null) return HookResult.Continue;

    // The player has a hero now

    return HookResult.Continue;
}
```



## Run code when a player dies

```csharp
[GameEventHandler("player_death")]
public HookResult OnPlayerDeath(PlayerDeathEvent args)
{
    var victim = args.UseridController;
    var killer = args.AttackerController;

    // killer is null when they weren't killed by a player
    if (victim == null || killer == null) return HookResult.Continue;

    Console.WriteLine($"{killer.PlayerName} killed {victim.PlayerName}");

    if (args.Headshot)
        Console.WriteLine("It was a headshot.");

    return HookResult.Continue;
}
```

`args.UseridPawn` and `args.AttackerPawn` are their heroes.



## Run code when a player spawns

Listen for `player_respawned`. It fires each time a player comes back to life.

```csharp
[GameEventHandler("player_respawned")]
public HookResult OnPlayerRespawned(PlayerRespawnedEvent args)
{
    var pawn = args.Userid?.As<CCitadelPlayerPawn>();
    if (pawn == null) return HookResult.Continue;

    pawn.Teleport(position: new Vector3(100, 200, 300));

    return HookResult.Continue;
}
```

Don't use `player_spawn` for this. The first time a player joins, it fires before their hero is ready.

## Run code when a player uses an ability

```csharp
[GameEventHandler("player_used_ability")]
public HookResult OnPlayerUsedAbility(PlayerUsedAbilityEvent args)
{
    var pawn = args.Player?.As<CCitadelPlayerPawn>();
    if (pawn == null) return HookResult.Continue;

    Console.WriteLine($"{pawn.Controller?.PlayerName} used {args.Abilityname}");

    return HookResult.Continue;
}
```

The [abilities database](https://deadworks.net/db/abilities) lists every ability name.

## Run code when a player attacks

`player_used_ability` also fires for gunshots and melee hits.

```csharp
[GameEventHandler("player_used_ability")]
public HookResult OnPlayerAttacked(PlayerUsedAbilityEvent args)
{
    if (args.Abilityname.StartsWith("citadel_weapon_"))
    {
        // They fired their gun
    }

    if (args.Annotation == "heavy_melee")
    {
        // They did a heavy melee
    }

    if (args.Annotation == "light_melee")
    {
        // They did a light melee
    }

    return HookResult.Continue;
}
```

## Run code when a player gets an item

`ability_added` fires for abilities and items. Item names start with `upgrade_`.

```csharp
[GameEventHandler("ability_added")]
public HookResult OnAbilityAdded(AbilityAddedEvent args)
{
    var pawn = args.Userid?.As<CCitadelPlayerPawn>();
    var name = args.Ability?.SubclassVData?.Name;
    if (pawn == null || name == null) return HookResult.Continue;

    if (name == "upgrade_unstoppable")
        Console.WriteLine($"{pawn.Controller?.PlayerName} got Unstoppable!");

    return HookResult.Continue;
}
```

## Read an event's fields by name

You don't normally need to do this. The event's class already has a property for each field. Only do it when an event has no class, or its class has a field typed wrong.

Take a `GameEvent` and read each field by its name. The names are on the event's database page, and capitals matter.

```csharp
[GameEventHandler("player_used_ability")]
public HookResult OnAbility(GameEvent ev)
{
    var name = ev.GetString("abilityname", "");

    Console.WriteLine($"Someone used {name}");

    return HookResult.Continue;
}
```

There is a `GetInt`, `GetFloat`, `GetBool`, `GetPlayerPawn`, `GetPlayerController` and `GetEHandle` too.

## Fire an event yourself

Create one of the game's events, fill in its fields, and fire it.

```csharp
var ev = GameEvents.Create("player_hintmessage");
if (ev != null)
{
    ev.SetString("hintmessage", "Hello");
    ev.Fire();
}
```

`Create` returns `null` when the game has no event with that name, so you can't make up new ones. Don't use `ev` again after `Fire()`.
