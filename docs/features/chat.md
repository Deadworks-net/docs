---
title: "Chat"
sidebar_label: "Chat"
---

# Chat

> **Namespace:** `DeadworksManaged.Api`

Your plugin can send messages to players in chat, and read or block the messages players send.

## Send a chat message to one player

```csharp
Chat.PrintToChat(controller, "Welcome to the server!");
```

## Send a chat message to everyone

```csharp
Chat.PrintToChatAll("The round starts in 10 seconds.");
```

## Reply to a command

In a [command](commands), use `caller.Reply`. It answers in chat when a player ran the command, and in the console when the server console did.

```csharp
[Command("hello")]
public void CmdHello(Caller caller)
{
    caller.Reply("Hello!");
}
```

## Read what players say

Override `OnChatMessage`. It runs every time a player sends a chat message.

```csharp
public override HookResult OnChatMessage(ChatMessage message)
{
    var name = message.Controller?.PlayerName;

    Console.WriteLine($"{name}: {message.ChatText}");

    return HookResult.Continue;
}
```

`message.ChatText` is what they typed, and `message.Controller` is who typed it.

## React to something a player says

```csharp
public override HookResult OnChatMessage(ChatMessage message)
{
    if (message.ChatText.Trim().ToLower() == "gg")
        Chat.PrintToChatAll("Good game, everyone!");

    return HookResult.Continue;
}
```

## Block a chat message

Return `HookResult.Stop`, and nobody sees the message.

```csharp
public override HookResult OnChatMessage(ChatMessage message)
{
    if (message.ChatText.Contains("badword"))
    {
        if (message.Controller is { } sender)
            Chat.PrintToChat(sender, "Please keep it friendly.");

        return HookResult.Stop;
    }

    return HookResult.Continue;
}
```

## Tell all chat from team chat

`message.AllChat` is `true` when the message went to everyone, and `false` when it went to the sender's team.

```csharp
public override HookResult OnChatMessage(ChatMessage message)
{
    if (!message.AllChat)
        return HookResult.Continue; // leave team chat alone

    // ...

    return HookResult.Continue;
}
```

## Show a big announcement on screen

For something players shouldn't miss, send a HUD announcement instead of a chat message.

```csharp
var msg = new CCitadelUserMsg_HudGameAnnouncement
{
    TitleLocstring = "ROUND 2",
    DescriptionLocstring = "Fight!"
};

NetMessages.Send(msg, RecipientFilter.All);
```

See [Networking](networking) for sending it to only some players.

## Print to a player's console

```csharp
controller.PrintToConsole("Only you can see this.");

CCitadelPlayerController.PrintToConsoleAll("Everyone can see this.");
```
