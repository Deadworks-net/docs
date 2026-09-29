---
title: "Commands"
sidebar_label: "Commands"
---

# Commands

> **Namespace:** `DeadworksManaged.Api`

The `[Command]` attribute registers a plugin method as a chat command and a console command at the same time.

One `[Command("hello")]` gives you:

- a slash chat command, `/hello`
- a bang chat command, `!hello`
- a console command, `dw_hello`

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

        NetMessages.Send(msg, RecipientFilter.Single(player.Slot));
    }
}
```

That single attribute registers three ways to run the same method:

- `/hello` in chat. The typed message is hidden from other players.
- `!hello` in chat. The typed message is shown to other players, unless you set `SuppressChat = true`.
- `dw_hello` in a console. The server console can run it, and so can a player from their own game console unless the command is `ServerOnly` or needs a permission they don't have.

## How Invocation Works

If you write `[Command("heal")]`, Deadworks creates these command names for you:

| Form | Where it runs | Notes |
|------|---------------|-------|
| `/heal` | Player chat | Hidden from chat |
| `!heal` | Player chat | Shown in chat unless `SuppressChat = true` |
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

:::note
If two plugins register the same name, both methods run, and the console prints a warning when the second one loads. Rename one of them.
:::

### When a Command Fails

Throw `CommandException` to refuse: its message is the caller's answer, in chat or the console, wherever they typed the command. Any other exception is treated as a bug in your plugin: the server console gets the plugin, command and stack trace, and the caller is told `That command failed. The server console has details.`

A command can be `async` if it returns `Task` or `ValueTask`. Code after an `await` continues on the game thread, on a later tick, so it can touch entities and call the engine as usual (unless you use `ConfigureAwait(false)`). Deadworks follows the command to the end: a `CommandException` thrown after an `await` still becomes the caller's answer, and other exceptions are reported as above.

The player may have left by the time an `await` finishes. `Caller` remembers who ran the command, so it never mixes them up with someone who has joined since: `caller.IsConnected` turns false, `HasPermission` and `CanTarget` refuse, `caller.Player` is `null` and replies go nowhere. `caller.IsConsole` stays false, so a player who left is never mistaken for the console.

```csharp
[Command("stats")]
public async Task CmdStats(Caller caller)
{
    var stats = await _database.LoadStatsAsync(caller.SteamId64);
    caller.Reply($"You've played {stats.Matches} matches."); // nothing happens if they've left
}
```

`async void` commands aren't registered, because an exception in one can't be caught and would crash the server. The server console says so when the plugin loads.

## CommandAttribute

`[Command]` registers a method as a command. The first argument is the command's name; any further arguments are aliases.

| Property | Type | Description |
|----------|------|-------------|
| `Description` | `string` | Sets the help text shown by `dw_help`. |
| `Permission` | `string` | **Coming soon.** Sets the permission a player needs to run it, e.g. `admin.moderation.kick`. Empty means anyone. See [Permissions](permissions). |
| `TargetImmunity` | `TargetImmunity` | **Coming soon.** Sets whether [`Target`](#target-arguments) arguments skip players the caller can't target. See [Immunity](permissions#immunity). |
| `ServerOnly` | `bool` | Lets only the server console run the command. A player who types it in chat sends an ordinary chat message; one who types it in their console gets no reply. |
| `ChatOnly` | `bool` | Creates only `/name` and `!name`. Not even the server console can run it then. |
| `ConsoleOnly` | `bool` | Creates only `dw_name`. Players can still run it from their own game console, so use `Permission` or `ServerOnly` to keep it from them. |
| `SuppressChat` | `bool` | Hides `!name` from chat, like `/name`. |
| `Hidden` | `bool` | Leaves the command out of `dw_help`. |

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

`Caller` stands for whoever ran the command, a player or the server console (which includes RCON). Make it your command's first parameter:

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

Deadworks parses arguments of these types:

- `string`
- `bool` (`true`, `false`, `1` or `0`)
- `int`, `long`, `uint`, `ulong` (so a SteamID64 can be a number)
- `float`, `double` (always with `.` as the decimal point, whatever the server's locale)
- enums (by name, ignoring case; a number the enum doesn't have is refused)
- any of these as nullable, e.g. `int?`

A parameter of any other type needs a [converter](#custom-converters). Without one, Deadworks warns when the plugin loads, since the command could only ever print its usage.

Optional arguments work the same way they do in normal C#:

```csharp
[Command("givesouls", Description = "Give yourself souls")]
public void CmdGiveSouls(Caller caller, int amount = 50000)
{
    // ...
}
```

If the caller types more arguments than the method takes, Deadworks prints the usage instead of running it, unless the method has a [`params`](#params-arguments) or [`rawArgs`](#rawargs) parameter.

### Target Arguments (Coming Soon) {#target-arguments}

Use `Target` when the caller should pick one or more players:

```csharp
[Command("mykick", Permission = "myplugin.kick")]
public void CmdKick(Caller caller, Target target)
{
    foreach (var player in target)
        player.Kick();
}
```

Callers can type `@me`, `@all`, `@team`, `@enemy`, `#slot`, a SteamID, or part of a player's name. If nobody matches, the caller is told why and your method doesn't run, so a `Target` always holds at least one player. Use `target.Single()` when the command works on exactly one player. See [Targeting Players and Immunity](permissions#targeting-players-and-immunity).

### `params` Arguments

Use `params T[]` as the last parameter to collect every remaining argument:

```csharp
[Command("sayas")]
public void CmdSayAs(Caller caller, string speaker, params string[] messageParts)
{
    var text = string.Join(' ', messageParts);
}
```

### `rawArgs`

Add a `string[]` parameter named `rawArgs` to get every argument as typed, including the ones bound to other parameters. With it, extra arguments aren't refused:

```csharp
[Command("debugargs")]
public void CmdDebugArgs(string[] rawArgs)
{
    foreach (var arg in rawArgs)
        Console.WriteLine(arg);
}
```

### Custom Converters

To use your own type as a command argument, register a parser in `OnLoad`:

```csharp
public override void OnLoad(bool isReload)
{
    CommandConverters.Register<MyType>(MyType.Parse);
}
```

After that, `MyType` can be used like any other argument type. If the text isn't valid, throw `CommandException` from the parser to tell the caller what's wrong; any other exception shows them the command's usage.

Your converters are removed when your plugin unloads or hot-reloads, so there's nothing to unregister. A converter applies to every plugin's commands, so register them for your own types: one for a shared type such as `TimeSpan` replaces any other plugin's, with a warning in the console. Registering one for a type Deadworks already parses (numbers, `bool`, `string`, enums, `Caller`, `Target` or `CCitadelPlayerController`) throws `ArgumentException`.

## Argument Parsing

Arguments are split like this:

- Spaces split arguments.
- Text in double quotes stays together as one argument.
- In chat, inside quotes, `\"` means a quote character and `\\` means a backslash, and an empty `""` argument is dropped. Console commands are split up by the engine, which doesn't support these escapes.

Examples:

- `dw_givesouls 2500`
- `dw_myrcon "sv_cheats 1"`
- `/sayas announcer "match starts now"`

If the arguments don't fit the method, Deadworks prints a usage line built from the parameter names and defaults. For example:

```text
Usage: dw_givesouls [amount=50000]
```

Chat commands send their errors back through chat. Console commands print their errors to the console they were typed in.

**Coming soon:** if the command has a `Permission` the player doesn't hold, they get `You don't have permission to use this command.` and your method doesn't run. A player Steam hasn't confirmed yet gets `You don't have permission to use this command yet: your roles apply once Steam has confirmed your account, a few seconds after joining.` instead.

Throw `CommandException` to show the caller a short error message:

```csharp
if (commandParts.Length == 0)
    throw new CommandException("Nothing to execute.");
```

## Older Attributes: `[ChatCommand]` and `[ConCommand]` {#chatcommand-and-concommand}

**Coming soon:** the older `[ChatCommand]` and `[ConCommand]` attributes are removed. Code that uses them doesn't compile; switch each one to `[Command]` (with `ChatOnly = true` or `ConsoleOnly = true` if you only want one form).

A plugin DLL built against an older Deadworks that still uses them loads, but those commands aren't registered, and the server console prints an error for each one:

```text
[PluginLoader] ERROR: MyPlugin.CmdHeal uses [ConCommand("heal")], which is no longer supported, so the command was not registered. Rebuild the plugin with [Command].
```
