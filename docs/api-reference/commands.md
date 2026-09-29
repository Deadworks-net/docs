---
title: "Commands"
sidebar_label: "Commands"
---

# Commands

> **Namespace:** `DeadworksManaged.Api`

Use `[Command]` when you want one method to work as both a chat command and a console command.

In most cases, one `[Command]` gives you:

- a slash chat command like `/hello`
- a bang chat command like `!hello`
- a console command like `dw_hello`

## Quick Start

```csharp
using DeadworksManaged.Api;

namespace MyPlugin;

public class HelloPlugin : DeadworksPluginBase
{
    public override string Name => "Hello";

    [Command("hello", Description = "Show a welcome message")]
    public void CmdHello(CCitadelPlayerController caller)
    {
        var msg = new CCitadelUserMsg_HudGameAnnouncement
        {
            TitleLocstring = "HELLO",
            DescriptionLocstring = "Welcome to Deadworks"
        };

        NetMessages.Send(msg, RecipientFilter.Single(caller.EntityIndex - 1));
    }
}
```

That single attribute registers three ways to run the same command:

- `/hello` as a chat command
  By default, slash commands are hidden from other players after they run.
- `!hello` as a chat command
  By default, bang commands are still shown in chat to other players.
- `dw_hello` as a console command
  This can be run from the server console, and sometimes from a player's console too.

## How Invocation Works

If you write `[Command("heal")]`, Deadworks creates these command names for you:

| Form | Where it runs | Notes |
|------|---------------|-------|
| `/heal` | Player chat | Hidden from normal chat after it runs |
| `!heal` | Player chat | Still shows in chat unless `SuppressChat = true` |
| `dw_heal` | Console | Console version of the same command |

If you add aliases, every alias gets the same chat and console versions:

```csharp
[Command("heal", "h", "restore")]
public void CmdHeal(CCitadelPlayerController caller)
{
    // /heal, !heal, dw_heal
    // /h, !h, dw_h
    // /restore, !restore, dw_restore
}
```

## CommandAttribute

`[Command]` tells Deadworks to register a method as a command.

| Property | Type | Description |
|----------|------|-------------|
| `Description` | `string` | Short help text shown by `dw_help` |
| `Permission` | `string` | **Coming soon.** Permission a player needs to run it, e.g. `admin.moderation.kick`. Empty means anyone. See [Permissions](permissions). |
| `TargetImmunity` | `TargetImmunity` | **Coming soon.** Whether [`Target`](#target-arguments) arguments skip players the caller can't target. See [Immunity](permissions#immunity). |
| `ServerOnly` | `bool` | Only let the server console (and RCON) run this command, whatever permissions a player has |
| `ChatOnly` | `bool` | Only create `/name` and `!name`. The server console can't run it then. |
| `ConsoleOnly` | `bool` | Only create `dw_name`. Players can still run it from their own game console, so use `Permission` or `ServerOnly` to keep it from them. |
| `SuppressChat` | `bool` | Hide `!name` from chat after it runs |
| `Hidden` | `bool` | Do not show this command in `dw_help` |

### Common Patterns

```csharp
[Command("cvardump",
    Description = "Dump all ConVars and ConCommands to a JSON file",
    ServerOnly = true,
    ConsoleOnly = true)]
public void CmdCvarDump(string outputPath = "")
{
    // Server console only
}
```

```csharp
[Command("rcon", Description = "Execute a server console command", SuppressChat = true)]
public void CmdRcon(Caller caller, params string[] commandParts)
{
    if (commandParts.Length == 0)
        throw new CommandException("Nothing to execute.");

    Server.ExecuteCommand(string.Join(' ', commandParts));
}
```

## Handler Signatures

Write a normal C# method for your command, and Deadworks fills in the values for you.

### Caller Injection

If your command needs a player, use `CCitadelPlayerController`:

```csharp
[Command("werewolf")]
public void CmdWerewolf(CCitadelPlayerController caller)
{
    var pawn = caller.GetHeroPawn();
    if (pawn == null)
        return;

    // ...
}
```

If the same command should also work from the server console, take a `Caller` instead:

```csharp
[Command("status")]
public void CmdStatus(Caller caller)
{
    caller.Reply(caller.IsConsole ? "Called from the server console" : $"Called by {caller.Name}");
}
```

- `CCitadelPlayerController caller`: only players can run it. The server console is told the command is for players only.
- `Caller caller` (**coming soon**): players and the server console. `caller.IsConsole`, `caller.Player`, `caller.Reply(...)` and `caller.HasPermission(...)` work for both. See [Caller](permissions#caller).
- `CCitadelPlayerController? caller`: the older way to allow the console, where `null` means the console. It still works, but Deadworks suggests `Caller` at load, since a player whose controller couldn't be found would look like the console too.

### Typed Arguments

Deadworks can read typed text arguments for these common types:

- `string`
- `bool`
- `int`, `long`, `uint`, `ulong`
- `float`, `double`
- enums
- `Target`, for picking players (coming soon, [below](#target-arguments))

Optional arguments work the same way they do in normal C#:

```csharp
[Command("givesouls", Description = "Give yourself souls")]
public void CmdGiveSouls(CCitadelPlayerController caller, int amount = 50000)
{
    // ...
}
```

If the player types too many arguments, Deadworks will reject the command unless you use one of the options below. A parameter of a type Deadworks can't parse, and that has no [converter](#custom-converters), is reported in the server console when the plugin loads.

### Target Arguments (Coming Soon) {#target-arguments}

Use `Target` when the caller should pick one or more players:

```csharp
[Command("kick", Permission = "admin.moderation.kick")]
public void CmdKick(Caller caller, Target target)
{
    foreach (var player in target)
        player.Kick("Kicked by an admin");
}
```

Callers can type `@me`, `@all`, `@team`, `@enemy`, `#slot`, a SteamID, or part of a player's name. Use `target.Single()` when the command works on exactly one player. See [Targeting Players and Immunity](permissions#picking-players-target).

### `params` Arguments

Use `params T[]` when you want "everything left over":

```csharp
[Command("sayas")]
public void CmdSayAs(CCitadelPlayerController caller, string speaker, params string[] messageParts)
{
    var text = string.Join(' ', messageParts);
}
```

### `rawArgs`

Use a parameter literally named `rawArgs` with type `string[]` if you want the split-up arguments exactly as Deadworks sees them:

```csharp
[Command("debugargs")]
public void CmdDebugArgs(string[] rawArgs)
{
    foreach (var arg in rawArgs)
        Console.WriteLine(arg);
}
```

### Custom Converters

If you want to use your own custom type in a command, register a parser in `OnLoad`:

```csharp
public override void OnLoad(bool isReload)
{
    CommandConverters.Register<MyType>(MyType.Parse);
}
```

After that, `MyType` can be used like any other command argument type. A parser can throw `CommandException` to tell the caller what's wrong with their input; anything else shows the usage line.

- Converters apply to every plugin's commands, so prefer registering them for your own types.
- They're removed automatically when your plugin unloads.
- Types Deadworks already parses (numbers, `bool`, `string`, enums, `Target`, `Caller`) can't have a converter: `Register` throws.

## Argument Parsing

Most of the time, arguments work the way you would expect:

- Spaces split arguments.
- Put text in double quotes if it should stay together.
- Inside quotes, `\"` means a quote character and `\\` means a backslash.

Examples:

- `dw_givesouls 2500`
- `dw_rcon "sv_cheats 1"`
- `/sayas announcer "match starts now"`

If the player types the command wrong, Deadworks prints a usage message automatically. For example:

```text
Usage: givesouls [amount=50000]
```

Chat commands send their errors back through chat. Console commands print their errors to console.

**Coming soon:** if the command has a `Permission` the player doesn't hold, they get `You don't have permission to use this command.` and your method doesn't run.

## Errors

Throw `CommandException` to stop the command and show the caller a message:

```csharp
if (commandParts.Length == 0)
    throw new CommandException("Nothing to execute.");
```

It's an answer, not an error, so nothing is logged. Any other exception is logged with its stack trace in the server console, and the caller is only told the command failed.

## Async Commands (Coming Soon)

A command can return `Task` (or `ValueTask`) and `await`, for example to read a database:

```csharp
[Command("stats")]
public async Task CmdStats(Caller caller)
{
    var stats = await _db.LoadStatsAsync(caller.SteamId64);
    caller.Reply($"You've played {stats.Matches} matches.");
}
```

- Every `await` comes back on the game thread, so you can use the game API after it as usual.
- `CommandException` and other errors are handled the same as in a normal command, even after an `await`.
- The player may have left by the time an `await` finishes. `caller.Reply` then goes nowhere rather than to whoever took their slot; check `caller.IsConnected` before acting for them.
- `async void` commands aren't registered, since an exception in one would crash the server. Return `Task`.

## Older Attributes

`[ChatCommand]` and `[ConCommand]` are replaced by `[Command]`. **Coming soon:** they're compile errors, and commands a plugin built against an older Deadworks declares with them aren't registered, because they would skip permission checks. The server console names each one at load. Rebuild the plugin with `[Command]`.
