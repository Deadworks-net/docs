---
title: "Commands"
sidebar_label: "Commands"
---

# Commands

> **Namespace:** `DeadworksManaged.Api`





## Quick Start

```csharp
using DeadworksManaged.Api;

namespace MyPlugin;

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

That gives you three ways to run the same method:

- `/hello` in chat. Other players don't see the typed message.
- `!hello` in chat. Other players see the typed message.
- `dw_hello` in the console.

## CommandAttribute



| Setting | Type | Description |
|---------|------|-------------|
| `Description` | `string` | Short help text shown by `dw_help` |
| `ChatOnly` | `bool` | Only create `/name` and `!name` |
| `ConsoleOnly` | `bool` | Only create `dw_name`. Players can still run it from their own console |
| `ServerOnly` | `bool` | Only let the server console run it |
| `SuppressChat` | `bool` | Hide the typed `!name` message from chat, like `/name` |
| `Hidden` | `bool` | Leave the command out of `dw_help` |

To limit a command to certain players, see [Permissions](permissions) (coming soon).

## Caller

Make `Caller` the first parameter. It is whoever ran the command: a player, or the server console.

| Member | Returns | Description |
|--------|---------|-------------|
| `Player` | `CCitadelPlayerController?` | The player, or `null` for the console |
| `IsConsole` | `bool` | Whether the server console ran it |
| `Name` | `string` | The player's name, or `"Console"` |
| `Reply(string message)` | `void` | Answer in chat for a player, or in the server console |

## Arguments

Add more parameters and Deadworks fills them in from what the caller typed.

Supported parameter types are:

- `string`
- `bool`
- `int`, `long`, `uint`, `ulong`
- `float`, `double`
- enums

```csharp
[Command("givesouls", Description = "Give yourself souls")]
public void CmdGiveSouls(Caller caller, int amount = 50000)
{
    // ...
}
```

A parameter with a default value is optional.

For example:

- `/givesouls`
- `/givesouls 2500`
- `dw_givesouls 2500`

If the arguments don't fit, Deadworks prints the usage instead of running your method:

```text
Usage: dw_givesouls [amount=50000]
```

To take any number of arguments, make the last parameter `params string[]`. The caller can put text with spaces in double quotes to keep it as one argument.

## When a Command Fails

Throw `CommandException` to stop and tell the caller why. They see your message wherever they typed the command.

```csharp
[Command("heal")]
public void CmdHeal(Caller caller)
{
    if (caller.Player is not { } player)
        throw new CommandException("Only players can heal.");

    // ...
}
```

Any other exception is logged to the server console, and the caller is told the command failed.

A command can be `async` if it returns `Task`. Code after an `await` continues on the game thread.
