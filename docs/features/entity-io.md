---
title: "Entity I/O"
sidebar_label: "Entity I/O"
---

# Entity I/O

> **Namespace:** `DeadworksManaged.Api`

Entities in a map talk to each other with inputs and outputs.

- An **output** is something an entity announces. A trigger fires `OnStartTouch` when something walks into it.
- An **input** is something you tell an entity to do. A button takes `Kill` to remove itself.

Your plugin can listen for both, block them, and send inputs of its own.

## Find an entity's inputs and outputs

The [entity database](https://deadworks.net/db/entities) lists the inputs and outputs of every entity. See [`trigger_multiple`](https://deadworks.net/db/entities/trigger_multiple) for an example.

## Run code when an entity fires an output

Put `[EntityOutputHook]` on a method, with the entity's name and the output's name.

```csharp
[EntityOutputHook("trigger_multiple", "OnStartTouch")]
public HookResult OnTriggerTouched(EntityOutputEvent e)
{
    var pawn = e.Activator?.As<CCitadelPlayerPawn>();
    if (pawn == null) return HookResult.Continue;

    Console.WriteLine($"{pawn.Controller?.PlayerName} walked into a trigger");

    return HookResult.Continue;
}
```

`e.Activator` is whoever set it off, usually a player's hero. `e.Caller` is the entity that fired the output.

## Block an output

Return `HookResult.Stop`, and nothing connected to that output happens.

```csharp
[EntityOutputHook("trigger_multiple", "OnStartTouch")]
public HookResult OnTriggerTouched(EntityOutputEvent e)
{
    return HookResult.Stop;
}
```

## Run code when an entity receives an input

Put `[EntityInputHook]` on a method, with the entity's name and the input's name.

```csharp
[EntityInputHook("func_button", "Kill")]
public HookResult OnButtonKilled(EntityInputEvent e)
{
    Console.WriteLine($"{e.Entity.DesignerName} was told to remove itself");

    return HookResult.Continue;
}
```

`e.Entity` is the entity receiving the input.

## Block an input

Return `HookResult.Stop`, and the entity never receives it.

```csharp
[EntityInputHook("func_button", "Kill")]
public HookResult OnButtonKilled(EntityInputEvent e)
{
    return HookResult.Stop;
}
```

## Run code after an input or output

Add `HookMode.Post` and return `void`. Your method runs once the input or output has already happened, so it can't block it.

```csharp
[EntityInputHook("func_button", "Kill", HookMode.Post)]
public void OnButtonKilled(EntityInputEvent e)
{
    Console.WriteLine("The button is gone");
}
```

## Listen to every entity

Use `"*"` in place of the entity's name, the input or output's name, or both.

```csharp
[EntityOutputHook("*", "OnStartTouch")]
public HookResult OnAnythingTouched(EntityOutputEvent e)
{
    Console.WriteLine($"{e.CallerClass} was touched");

    return HookResult.Continue;
}
```

`e.CallerClass` is the name of the entity that fired the output.

## Read the value sent with an input or output

Some inputs and outputs carry a value. Read it from `e.Value` with the method for its type.

```csharp
[EntityInputHook("*", "SetMessage")]
public HookResult OnSetMessage(EntityInputEvent e)
{
    string text = e.Value.AsString();

    Console.WriteLine($"{e.ClassName} was given the message: {text}");

    return HookResult.Continue;
}
```

There is an `AsInt`, `AsFloat`, `AsBool`, `AsVector3`, `AsColor` and `AsEntity` too. `AsString` works for any type.

Read the value inside your method. `e.Value` stops working once your method returns, so don't keep it for later.

## Start and stop listening from code

Use `EntityIO.HookOutput` or `EntityIO.HookInput`. Each gives you a handle, and the hook stays until you cancel it.

```csharp
var hook = EntityIO.HookOutput("trigger_multiple", "OnStartTouch", e =>
{
    Console.WriteLine("Something walked into a trigger");
});

// Stop listening
hook.Cancel();
```

Return a `HookResult` from the handler if you want to be able to block it.

## Send an input to an entity

```csharp
entity.AcceptInput("Kill");
```

To send a value with it:

```csharp
entity.AcceptInput("SetMessage", value: "ROUND 2");
```

## Run code when a player dies

Players don't fire outputs like `OnDeath`. Use the `player_death` [game event](game-events#run-code-when-a-player-dies) for that.

```csharp
[GameEventHandler("player_death")]
public HookResult OnPlayerDeath(PlayerDeathEvent args)
{
    Console.WriteLine($"{args.UseridController?.PlayerName} died");

    return HookResult.Continue;
}
```
