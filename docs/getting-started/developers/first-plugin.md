---
title: "Your first plugin"
sidebar_label: "2. Your first plugin"
---

# Your first plugin

Build a small plugin with two chat commands. Before you start, follow [Project setup](setup).

## The smallest plugin

A plugin is a class that inherits from `DeadworksPluginBase`. The only thing it must have is a `Name`.

```csharp
using DeadworksManaged.Api;

namespace MyFirstPlugin;

public class MyFirstPlugin : DeadworksPluginBase
{
    public override string Name => "My First Plugin";

    public override void OnLoad(bool isReload)
    {
        Console.WriteLine("My First Plugin loaded!");
    }
}
```

`OnLoad` runs when Deadworks loads your plugin. Build the project and copy the `.dll` into the `plugins` folder. The message appears in the server console. If you set up auto-deploy in [Project setup](setup), building does the copy for you.

You don't need to restart the server when you change your plugin. Replace the `.dll`, and Deadworks swaps in the new version.

## Add a command

Put `[Command]` on a method. `Caller` is whoever ran the command.

```csharp
[Command("hello", Description = "Say hello")]
public void CmdHello(Caller caller)
{
    caller.Reply($"Hello, {caller.Name}!");
}
```

Join your server and type `/hello` in chat. The plugin replies to you.

## Do something to the player

`caller.Player` is the player who ran the command. `GetHeroPawn()` returns their hero in the world. Most of what you do to a player, you do to their hero.

```csharp
[Command("heal", Description = "Heal yourself to full")]
public void CmdHeal(Caller caller)
{
    var pawn = caller.Player?.GetHeroPawn();
    if (pawn == null)
        throw new CommandException("You need a hero to do that.");

    pawn.Heal(pawn.GetMaxHealth());

    caller.Reply("You are back to full health.");
}
```

Throwing `CommandException` stops the command and shows its message to the player.

## The whole plugin

```csharp
using DeadworksManaged.Api;

namespace MyFirstPlugin;

public class MyFirstPlugin : DeadworksPluginBase
{
    public override string Name => "My First Plugin";

    public override void OnLoad(bool isReload)
    {
        Console.WriteLine("My First Plugin loaded!");
    }

    [Command("hello", Description = "Say hello")]
    public void CmdHello(Caller caller)
    {
        caller.Reply($"Hello, {caller.Name}!");
    }

    [Command("heal", Description = "Heal yourself to full")]
    public void CmdHeal(Caller caller)
    {
        var pawn = caller.Player?.GetHeroPawn();
        if (pawn == null)
            throw new CommandException("You need a hero to do that.");

        pawn.Heal(pawn.GetMaxHealth());

        caller.Reply("You are back to full health.");
    }
}
```

## Next steps

- [Commands](../../features/commands) to take arguments and limit who can run a command
- [Players](../../features/players) for more you can do to a player
- [Chat](../../features/chat) to send messages to everyone
- [Example plugins](https://github.com/Deadworks-net/deadworks/tree/main/examples/plugins) in the Deadworks repository
