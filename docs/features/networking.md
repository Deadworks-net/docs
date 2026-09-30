---
title: "Networking"
sidebar_label: "Networking"
---

# Networking

> **Namespace:** `DeadworksManaged.Api`

The server and each player's game talk to each other with net messages. Your plugin can send its own, and read or block the ones already being sent.

## See what messages exist

The [protobuf database](https://deadworks.net/db/protobufs) lists every net message in the game and the fields each one has.

## Send a message to everyone

Create the message, fill in its fields, and send it.

```csharp
var msg = new CCitadelUserMsg_HudGameAnnouncement
{
    TitleLocstring = "GAME OVER",
    DescriptionLocstring = "The match has ended"
};

NetMessages.Send(msg, RecipientFilter.All);
```

This one shows a large announcement on the screen.

## Send a message to one player

```csharp
NetMessages.Send(msg, RecipientFilter.Single(controller.Slot));
```

## Send a message to some players

Start with an empty `RecipientFilter` and add the players you want.

```csharp
var filter = new RecipientFilter();

foreach (var controller in Players.GetAll())
{
    if (controller.GetHeroPawn()?.TeamNum == 2)
        filter.Add(controller.Slot);
}

NetMessages.Send(msg, filter);
```

## Read a message the server is sending

Put `[NetMessageHandler]` on a method that takes an `OutgoingMessageContext` for the message you want.

```csharp
[NetMessageHandler]
public HookResult OnChatMsg(OutgoingMessageContext<CCitadelUserMsg_ChatMsg> ctx)
{
    Console.WriteLine(ctx.Message.Text);

    return HookResult.Continue;
}
```

`ctx.Message` is the message, and `ctx.Recipients` is who it is going to.

## Block a message

Return `HookResult.Stop` and nobody receives it.

```csharp
[NetMessageHandler]
public HookResult OnChatMsg(OutgoingMessageContext<CCitadelUserMsg_ChatMsg> ctx)
{
    return HookResult.Stop;
}
```

To hide it from just one player, take them out of the recipients:

```csharp
var recipients = ctx.Recipients;
recipients.Remove(controller.Slot);
ctx.Recipients = recipients;
```

Copy `ctx.Recipients` into a variable, change it, and put it back, as above. Changing it in place does nothing.

## Read a message a player sends

Take an `IncomingMessageContext` instead.

```csharp
[NetMessageHandler]
public HookResult OnChatMsgFromPlayer(IncomingMessageContext<CCitadelUserMsg_ChatMsg> ctx)
{
    var sender = Players.FromSlot(ctx.SenderSlot);

    return HookResult.Continue;
}
```

`ctx.SenderSlot` is the slot of the player who sent it.

To read chat, [`OnChatMessage`](chat#read-what-players-say) is simpler.
