---
title: "Players"
sidebar_label: "Players"
---

# Players

> **Namespace:** `DeadworksManaged.Api`

Each player has two parts:

- a **controller**, which is the person: their name, SteamID and team
- a **pawn**, which is their hero in the world: its health, position, items and abilities

Most of what you do to a player, you do to their pawn.

## Get every player

```csharp
foreach (var controller in Players.GetAll())
{
    var pawn = controller.GetHeroPawn();
    if (pawn == null) continue;

    // ...
}
```

`GetHeroPawn()` returns `null` when the player has no hero yet, so check it.

## Get the player who ran a command

```csharp
[Command("heal")]
public void CmdHeal(Caller caller)
{
    var pawn = caller.Player?.GetHeroPawn();
    if (pawn == null)
        throw new CommandException("You need a hero to do that.");

    pawn.Heal(pawn.GetMaxHealth());
}
```

`caller.Player` is the controller. See [Commands](commands).

## Get a player's name or SteamID

```csharp
string name = controller.PlayerName;
ulong steamId = controller.PlayerSteamId;
int slot = controller.Slot;
```

To go the other way, `Players.FromSlot(slot)` returns the controller in a slot, or `null`.

:::tip Use `Permissions.GetSteamId64(slot)` for anything that matters
Plugins can change `PlayerSteamId`. A controller can also pass to a different player across reconnects. For bans, rewards or saved data, use `Permissions.GetSteamId64(controller.Slot)`, or `caller.SteamId64` in a command. It returns the SteamID the player connected with. It's `0` for bots.
:::

## Know when Steam has confirmed a player

A few seconds after a player joins, Steam confirms their account. Until then, their [roles and permissions](../guides/admins-and-permissions) don't apply. `Players.IsAuthorized(slot)` returns whether that has happened. `OnClientAuthorized` runs when it does:

```csharp
public override void OnClientAuthorized(ClientAuthorizedEvent args)
{
    Console.WriteLine($"{args.Controller?.PlayerName} ({args.SteamId64}) was confirmed by Steam");
}
```

See [`ClientAuthorizedEvent`](/api-reference/events/clientauthorizedevent) for details.

## Heal or damage a player

```csharp
pawn.Heal(pawn.GetMaxHealth()); // back to full
pawn.Hurt(100f);                // take 100 damage
```

See [Damage](damage) to credit the damage to an attacker.

## Give a player souls

```csharp
int souls = pawn.GetCurrency(ECurrencyType.EGold);
pawn.SetCurrency(ECurrencyType.EGold, souls + 5000);
```

Use `ECurrencyType.EAbilityPoints` for ability points.

## Give or take an item

```csharp
pawn.AddItem("upgrade_sprint_booster");
pawn.RemoveItem("upgrade_sprint_booster");
```

The [abilities database](https://deadworks.net/db/abilities) lists the name of every item. See [Abilities & items](abilities) for more you can do with items.

## Change a player's abilities

```csharp
pawn.RemoveAbility("ability_priest_weaponswap");
pawn.AddAbility("ability_familiar_ability01", slot: 3);
```

The [abilities database](https://deadworks.net/db/abilities) lists ability names too.

To unlock and fully upgrade a hero's four main abilities:

```csharp
foreach (var ability in pawn.AbilityComponent.Abilities)
{
    if (ability.IsSignature)
        ability.UpgradeBits = 0b11111;
}
```

## Set a player's level

```csharp
pawn.Level = 10;
```

## Move a player

```csharp
pawn.Teleport(
    position: new Vector3(100, 200, 300),
    angles: null,
    velocity: null);
```

Pass `null` for anything you want to leave alone. `pawn.Position` is where they are now.

## Change a player's hero or team

```csharp
controller.SelectHero(Heroes.Inferno);
controller.ChangeTeam(2); // 2 is Amber, 3 is Sapphire
```

See [Heroes](heroes) for picking a random hero and stopping players changing hero.

## Put a joining player on the smaller team

Count the players on each team, then move the new player to the one with fewer.

```csharp
public override void OnClientFullConnect(ClientFullConnectEvent args)
{
    var controller = args.Controller;
    if (controller == null) return;

    int amber = 0, sapphire = 0;

    foreach (var other in Players.GetAll())
    {
        var pawn = other.GetHeroPawn();
        if (pawn == null) continue;

        if (pawn.TeamNum == 2) amber++;
        else if (pawn.TeamNum == 3) sapphire++;
    }

    controller.ChangeTeam(amber <= sapphire ? 2 : 3);
}
```

## Reset a player

```csharp
pawn.ResetHero();
```

`ResetHero()` removes their items and restores their starting abilities.

## Read a player's stats

```csharp
var stats = controller.PlayerDataGlobal;
if (stats == null) return;

Console.WriteLine($"{stats.PlayerKills} kills, {stats.Deaths} deaths, {stats.GoldNetWorth} souls");
```

## Do something when a player joins or leaves

```csharp
public override void OnClientFullConnect(ClientFullConnectEvent args)
{
    Console.WriteLine($"{args.Controller?.PlayerName} joined");
}

public override void OnClientDisconnect(ClientDisconnectedEvent args)
{
    Console.WriteLine($"{args.Controller?.PlayerName} left");
}
```

## Send a player a message

```csharp
Chat.PrintToChat(controller, "Welcome to the server!");
```

## See also

- [Chat](chat): message everyone and read what players say
- [Heroes](heroes): pick heroes and block hero changes
- [How permissions work](../guides/admins-and-permissions): roles, permissions and immunity
