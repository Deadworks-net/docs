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
    public void CmdHello(Caller caller)
    {
        if (caller.Player is not { } player)
            throw new CommandException("Only players can say hello.");

        var msg = new CCitadelUserMsg_HudGameAnnouncement
        {
            TitleLocstring = "HELLO",
            DescriptionLocstring = "Welcome to Deadworks"
        };

        NetMessages.Send(msg, RecipientFilter.Single(player.EntityIndex - 1));
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
public void CmdHeal(Caller caller)
{
    // /heal, !heal, dw_heal
    // /h, !h, dw_h
    // /restore, !restore, dw_restore
}
```

### When a Command Fails

Throw `CommandException` to refuse: its message is the caller's answer, in chat or the console, wherever they typed the command. Any other exception is a bug in your plugin: the server console gets the plugin, command and stack trace, the caller is told `That command failed. The server console has details.`, and the typed command never ends up in public chat.

A command can be `async` if it returns `Task` or `ValueTask`. Code after an `await` carries on on the game thread, on a later tick, so it can touch entities and call the engine as usual (unless you use `ConfigureAwait(false)`). Deadworks follows the command to the end: a `CommandException` thrown after an `await` still becomes the caller's answer, and other exceptions are reported as above.

The player may have left by the time an `await` finishes. `Caller` remembers who ran the command, so it never mixes them up with someone who has joined since: `caller.IsConnected` turns false, `HasPermission` and `CanTarget` refuse, `caller.Player` is `null` and replies go nowhere. `caller.IsConsole` stays false, so a player who left is never mistaken for the console.

```csharp
[Command("stats")]
public async Task CmdStats(Caller caller)
{
    var stats = await _database.LoadStatsAsync(caller.SteamId64);
    caller.Reply($"You've played {stats.Matches} matches."); // nothing happens if they've left
}
```

`async void` commands aren't registered: an exception in one can't be caught and would take the whole server down. The server console says so when the plugin loads.

## CommandAttribute

`[Command]` tells Deadworks to register a method as a command.

| Property | Type | Description |
|----------|------|-------------|
| `Description` | `string` | Short help text shown by `dw_help` |
| `Permission` | `string` | **Coming soon.** Permission a player needs to run it, e.g. `admin.moderation.kick`. Empty means anyone. See [Permissions](permissions). |
| `TargetImmunity` | `TargetImmunity` | **Coming soon.** Whether [`Target`](#target-arguments) arguments skip players the caller can't target. See [Immunity](permissions#immunity). |
| `ServerOnly` | `bool` | Only let the server console run this command. If a player types it in chat, the message goes to chat unchanged. |
| `ChatOnly` | `bool` | Only create `/name` and `!name`. Not even the server console can run it then. |
| `ConsoleOnly` | `bool` | Only create `dw_name`. Players can still run it from their own game console, so it isn't a way to keep a command from them: use `Permission` or `ServerOnly` for that. |
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
[Command("myrcon",
    Description = "Execute a server console command",
    ServerOnly = true,
    ConsoleOnly = true)]
public void CmdMyRcon(Caller caller, params string[] commandParts)
{
    if (commandParts.Length == 0)
        throw new CommandException("Nothing to execute.");

    Server.ExecuteCommand(string.Join(' ', commandParts));
}
```

`ServerOnly = true` matters here: without it, any player could run server commands from their console. **Coming soon:** to let trusted players use it, drop `ServerOnly` and give it a [permission](permissions) instead, e.g. `Permission = "myplugin.rcon"`. The name `myrcon` avoids clashing with the `rcon` command of the Admin plugin that will ship with Deadworks.

## Handler Signatures

Write a normal C# method for your command, and Deadworks fills in the values for you.

### The `Caller` Parameter {#caller}

`Caller` stands for whoever ran the command, a player or the server console. Make it your command's first parameter:

```csharp
[Command("status")]
public void CmdStatus(Caller caller)
{
    if (caller.IsConsole)
        caller.Reply("Called from server console");
    else
        caller.Reply($"Hello, {caller.Name}");
}
```

`caller.Player` is the player's controller, or `null` for the console. `caller.Reply(...)` answers in chat for a player and in the server console for the console, and `caller.HasPermission(...)` is always `true` for the console. See [The `Caller` Parameter](permissions#the-caller-parameter) for every member.

#### Taking a controller instead

Older plugins take the player's controller directly. It still works, but `Caller` is clearer:

- `CCitadelPlayerController caller`: only players can run the command. From the server console, it replies `Only players can run this command.`
- `CCitadelPlayerController? caller`: `null` means the server console, which is easy to miss. Deadworks prints a note for the plugin's author when it loads one.

### Typed Arguments

Deadworks can read typed text arguments for these common types:

- `string`
- `bool`
- `int`, `long`, `uint`, `ulong` (so a SteamID64 can be a number)
- `float`
- `double`
- enums (by name, ignoring case; a number the enum doesn't have is refused)
- any of these as nullable, e.g. `int?`

A parameter of any other type needs a [converter](#custom-converters). Without one, Deadworks says so when the plugin loads, since the command could only ever print its usage.

Optional arguments work the same way they do in normal C#:

```csharp
[Command("givesouls", Description = "Give yourself souls")]
public void CmdGiveSouls(Caller caller, int amount = 50000)
{
    // ...
}
```

If the player types too many arguments, Deadworks will reject the command unless you use one of the options below.

### Target Arguments (Coming Soon) {#target-arguments}

Use `Target` when the caller should pick one or more players:

```csharp
[Command("kick", Permission = "admin.moderation.kick")]
public void CmdKick(Caller caller, Target target)
{
    foreach (var player in target)
        player.Kick();
}
```

Callers can type `@me`, `@all`, `@team`, `@enemy`, `#slot`, a SteamID, or part of a player's name. Use `target.Single()` when the command works on exactly one player. See [Targeting Players and Immunity](permissions#targeting-players-and-immunity).

### `params` Arguments

Use `params T[]` when you want "everything left over":

```csharp
[Command("sayas")]
public void CmdSayAs(Caller caller, string speaker, params string[] messageParts)
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

After that, `MyType` can be used like any other command argument type. If the text isn't valid, throw `CommandException` from the parser to tell the caller what's wrong; any other exception shows them the command's usage.

Your converters are removed when your plugin unloads or hot-reloads, so there's nothing to unregister. Registering a converter for a type another plugin already has replaces theirs, with a warning in the console.

## Argument Parsing

Most of the time, arguments work the way you would expect:

- Spaces split arguments.
- Put text in double quotes if it should stay together.
- In chat, inside quotes, `\"` means a quote character and `\\` means a backslash, and an empty `""` argument is dropped. Console commands are split up by the engine, which doesn't support these escapes.

Examples:

- `dw_givesouls 2500`
- `dw_myrcon "sv_cheats 1"`
- `/sayas announcer "match starts now"`

If the player types the command wrong, Deadworks prints a usage message automatically. For example:

```text
Usage: dw_givesouls [amount=50000]
```

Chat commands send their errors back through chat. Console commands print their errors to console.

**Coming soon:** if the command has a `Permission` the player doesn't hold, they get `You don't have permission to use this command.` and your method doesn't run.

Throw `CommandException` when you want to show a simple user-facing error message:

```csharp
if (commandParts.Length == 0)
    throw new CommandException("Nothing to execute.");
```

## Older Attributes: `[ChatCommand]` and `[ConCommand]` {#chatcommand-and-concommand}

**Coming soon:** the older `[ChatCommand]` and `[ConCommand]` attributes are removed. Code that uses them no longer compiles; switch each one to `[Command]` (with `ChatOnly = true` or `ConsoleOnly = true` if you only want one form).

A plugin DLL built against an older Deadworks that still uses them loads, but those commands aren't registered, and the server console prints an error for each one:

```text
[PluginLoader] ERROR: MyPlugin.CmdHeal uses [ConCommand("heal")], which is no longer supported, so the command was not registered. Rebuild the plugin with [Command].
```
