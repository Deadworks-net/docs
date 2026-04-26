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
| `ServerOnly` | `bool` | Only let the server console run this command |
| `ChatOnly` | `bool` | Only create `/name` and `!name` |
| `ConsoleOnly` | `bool` | Only create `dw_name` |
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
public void CmdRcon(CCitadelPlayerController? caller, params string[] commandParts)
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

If the same command should also work from the server console, use `CCitadelPlayerController?` instead:

```csharp
[Command("status")]
public void CmdStatus(CCitadelPlayerController? caller)
{
    if (caller == null)
        Console.WriteLine("Called from server console");
}
```

If you use `CCitadelPlayerController` without `?`, only players can run the command.

If you use `CCitadelPlayerController?`, then:

- a player call gives you that player in `caller`
- a server console call gives you `caller == null`

### Typed Arguments

Deadworks can read typed text arguments for these common types:

- `string`
- `bool`
- `int`
- `long`
- `float`
- `double`
- enums

Optional arguments work the same way they do in normal C#:

```csharp
[Command("givegold", Description = "Give yourself gold")]
public void CmdGiveGold(CCitadelPlayerController caller, int amount = 50000)
{
    // ...
}
```

If the player types too many arguments, Deadworks will reject the command unless you use one of the options below.

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

After that, `MyType` can be used like any other command argument type.

## Argument Parsing

Most of the time, arguments work the way you would expect:

- Spaces split arguments.
- Put text in double quotes if it should stay together.
- Inside quotes, `\"` means a quote character and `\\` means a backslash.

Examples:

- `dw_givegold 2500`
- `dw_rcon "sv_cheats 1"`
- `/sayas announcer "match starts now"`

If the player types the command wrong, Deadworks prints a usage message automatically. For example:

```text
Usage: givegold [amount:int=50000]
```

Chat commands send their errors back through chat. Console commands print their errors to console.

Throw `CommandException` when you want to show a simple user-facing error message:

```csharp
if (commandParts.Length == 0)
    throw new CommandException("Nothing to execute.");
```
