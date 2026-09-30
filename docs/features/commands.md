---
title: "Commands"
sidebar_label: "Commands"
---

# Commands

> **Namespace:** `DeadworksManaged.Api`

A command runs a method in your plugin when someone types its name in chat or the console.

## Add a command

Put `[Command]` on a method.

```csharp
public class MyPlugin : DeadworksPluginBase
{
    public override string Name => "My Plugin";

    [Command("hello", Description = "Say hello")]
    public void CmdHello(Caller caller)
    {
        caller.Reply($"Hello, {caller.Name}!");
    }
}
```

That gives you three ways to run it:

- `/hello` in chat. Other players don't see the typed message.
- `!hello` in chat. Other players see the typed message.
- `dw_hello` in the console.

`Description` is the help text shown by `dw_help`.

## Reply to whoever ran it

Make `Caller` the first parameter. It is whoever ran the command: a player, or the server console.

```csharp
caller.Reply("Done.");
```

A player sees the reply in chat. The server console sees it in the console.

## Get the player who ran it

```csharp
[Command("heal")]
public void CmdHeal(Caller caller)
{
    var pawn = caller.Player?.GetHeroPawn();
    if (pawn == null)
        throw new CommandException("Only players can heal.");

    pawn.Heal(pawn.GetMaxHealth());
}
```

`caller.Player` is `null` when the server console ran the command. See [Players](players) for what you can do with one.

## Refuse with a message

Throw `CommandException`. The caller sees your message wherever they typed the command, and the rest of your method doesn't run.

```csharp
throw new CommandException("You can't do that right now.");
```

## Take arguments

Add more parameters, and Deadworks fills them in from what the caller typed.

```csharp
[Command("givesouls", Description = "Give yourself souls")]
public void CmdGiveSouls(Caller caller, int amount = 50000)
{
    // ...
}
```

```text
/givesouls
/givesouls 2500
```

A parameter can be a `string`, a `bool`, a number or an enum. One with a default value is optional.

If what they typed doesn't fit, Deadworks shows them the usage and doesn't run your method:

```text
Usage: dw_givesouls [amount=50000]
```

## Take a whole sentence

Make the last parameter `params string[]` to collect everything else the caller typed.

```csharp
[Command("sayas")]
public void CmdSayAs(Caller caller, string speaker, params string[] messageParts)
{
    var text = string.Join(' ', messageParts);
}
```

```text
/sayas announcer the match starts now
```

## Give a command a second name

Add more names after the first.

```csharp
[Command("heal", "h")]
```

Now `/h`, `!h` and `dw_h` work too.

## Make a command chat only or console only

```csharp
[Command("hello", ChatOnly = true)]    // only /hello and !hello
[Command("hello", ConsoleOnly = true)] // only dw_hello
```

Players can still run a `ConsoleOnly` command from their own game console.

## Only let the server console run a command

```csharp
[Command("cvardump", ServerOnly = true)]
```

To limit a command to certain players instead, see [Permissions](permissions) (coming soon).

## Hide a command

```csharp
[Command("secret", Hidden = true)]       // left out of dw_help
[Command("secret", SuppressChat = true)] // typing !secret isn't shown in chat
```

## Wait for something slow

A command can be `async` if it returns `Task`. Code after an `await` continues on the game thread, so it can touch the game as usual.

```csharp
[Command("stats")]
public async Task CmdStats(Caller caller)
{
    var stats = await _database.LoadStatsAsync(caller.SteamId64);
    caller.Reply($"You've played {stats.Matches} matches.");
}
```

If the player has left by then, the reply does nothing.
