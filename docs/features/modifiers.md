---
title: "Modifiers"
sidebar_label: "Modifiers"
---

# Modifiers

> **Namespace:** `DeadworksManaged.Api`

A modifier is a buff or debuff on an entity: a stun, a slow, a shield, a burn. The game already has hundreds of them, and you can put any of them on a player.

## Find a modifier

The [modifier database](https://deadworks.net/db/modifiers) lists every modifier in the game, with the name to pass to `AddModifier`.

Each modifier has its own page, such as [`modifier_citadel_knockdown`](https://deadworks.net/db/modifiers/modifier_citadel_knockdown), that shows what it does and the values it uses.

## Add a modifier to a player

```csharp
pawn.AddModifier("modifier_citadel_knockdown");
```

This knocks the player down. It works on any [entity](entities), not just players.

## Make a modifier last a set time

Put a `duration`, in seconds, in a `KeyValues3` and pass it along.

```csharp
using var kv = new KeyValues3();
kv.SetFloat("duration", 3.0f);

pawn.AddModifier("modifier_citadel_knockdown", kv);
```

Always create a `KeyValues3` with `using`, as above, so it is cleaned up afterwards.

## Remove a modifier

```csharp
pawn.RemoveModifier("modifier_citadel_knockdown");
```

`AddModifier` also gives you back the modifier it added. Keep that to remove exactly that one later:

```csharp
var modifier = pawn.AddModifier("modifier_citadel_knockdown", kv);

pawn.RemoveModifier(modifier);
```

## Check whether a player has a modifier

```csharp
if (pawn.ModifierProp.HasModifier("modifier_citadel_knockdown"))
{
    // ...
}
```

To see every modifier on a player:

```csharp
foreach (var modifier in pawn.ModifierProp.Modifiers)
    Console.WriteLine(modifier.SubclassVData?.Name);
```

## Use a modifier that belongs to an ability

Some modifiers read their numbers, like how much to slow by, from the ability or item they come from. Give them those numbers yourself with `abilityValues`.

```csharp
pawn.AddModifier("ability_doorman_bomb/debuff", kv: kv,
    abilityValues: new() { ["SlowPercent"] = 100.0f });
```

The modifier's database page shows the values it uses.

## Turn a state on or off

A state is a simple on or off switch on an entity, like "has unlimited air jumps". You can set one without adding a modifier.

```csharp
pawn.ModifierProp.SetModifierState(EModifierState.UnlimitedAirJumps, true);
pawn.ModifierProp.SetModifierState(EModifierState.UnlimitedAirJumps, false);
```

To check one:

```csharp
bool on = pawn.ModifierProp.HasModifierState(EModifierState.UnlimitedAirJumps);
```

Some useful states:

- `Immobilized` stops all movement
- `UnlimitedAirJumps` and `UnlimitedAirDashes`
- `InfiniteClip` gives infinite ammo with no reloading
- `VisibleToEnemy` shows the player on the enemy's minimap
- `UnitStatusHealthHidden` hides the health bar above the hero
- `FriendlyFireEnabled` lets bullets hurt teammates
