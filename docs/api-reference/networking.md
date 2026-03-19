---
title: "Networking"
sidebar_label: "Networking"
---

# Networking

> **Namespace:** `DeadworksManaged.Api`

Send and intercept Source 2 network messages between server and clients.

## NetMessages

Entry point for sending and hooking protobuf network messages.

### Sending Messages

```csharp
// Create a protobuf message
var msg = new CCitadelUserMsg_HudGameAnnouncement
{
    TitleLocstring = "GAME OVER",
    DescriptionLocstring = "The match has ended"
};

// Send to all players
NetMessages.Send(msg, RecipientFilter.All);

// Send to one player
NetMessages.Send(msg, RecipientFilter.Single(playerSlot));
```

### Hooking Outgoing Messages (Server → Client)

```csharp
// Hook before a message is sent to clients
NetMessages.HookOutgoing<CCitadelUserMsg_ChatMsg>(ctx =>
{
    // ctx.Message — the protobuf message
    // ctx.Recipients — modifiable recipient set
    // ctx.MessageId — numeric message ID

    // Modify recipients
    ctx.Recipients.Remove(someSlot);

    return HookResult.Handled;
});
```

### Hooking Incoming Messages (Client → Server)

```csharp
// Hook when server receives a message from a client
NetMessages.HookIncoming<CCitadelUserMsg_ChatMsg>(ctx =>
{
    // ctx.Message — the protobuf message from client
    // ctx.SenderSlot — who sent it
    // ctx.MessageId — numeric message ID

    return HookResult.Handled;
});
```

### Unhooking

```csharp
NetMessages.UnhookOutgoing<CCitadelUserMsg_ChatMsg>(myHandler);
NetMessages.UnhookIncoming<CCitadelUserMsg_ChatMsg>(myHandler);
```

### Using the Attribute (Alternative)

For chat message hooks, you can also use the `[NetMessageHandler]` attribute:

```csharp
[NetMessageHandler]
public HookResult OnChatMsgOutgoing(OutgoingMessageContext<CCitadelUserMsg_ChatMsg> ctx)
{
    // Process outgoing chat
    return HookResult.Handled;
}
```

## RecipientFilter

Bitmask of player slots that should receive a message.

### Static Members

| Member | Description |
|--------|-------------|
| `RecipientFilter.All` | A filter targeting all 64 possible player slots |
| `RecipientFilter.Single(int slot)` | A filter targeting exactly one player |

### Instance Methods

| Method | Description |
|--------|-------------|
| `Add(int slot)` | Adds a player slot |
| `Remove(int slot)` | Removes a player slot |
| `HasRecipient(int slot)` | Returns `true` if slot is included |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Mask` | `ulong` | Raw bitmask where bit i indicates slot i is included |

### Example: Custom Recipient List

```csharp
var filter = new RecipientFilter();
foreach (var controller in Players.GetAll())
{
    if (ShouldReceive(controller))
        filter.Add(controller.EntityIndex);
}
NetMessages.Send(msg, filter);
```

## Message Contexts

### OutgoingMessageContext\<T\>

Carries a server→client message with destination recipients.

| Property | Type | Description |
|----------|------|-------------|
| `Message` | `T` | The protobuf message being sent |
| `Recipients` | `RecipientFilter` | Target players (modifiable) |
| `MessageId` | `int` | Numeric network message ID |

### IncomingMessageContext\<T\>

Carries a client→server message with sender info.

| Property | Type | Description |
|----------|------|-------------|
| `Message` | `T` | The protobuf message from client |
| `SenderSlot` | `int` | Player slot of the sender |
| `MessageId` | `int` | Numeric network message ID |

## NetMessageRegistry

Maps protobuf message types to network message IDs.

| Method | Returns | Description |
|--------|---------|-------------|
| `GetMessageId<T>()` | `int` | Message ID for type T, or `-1` |
| `GetMessageId(Type)` | `int` | Message ID for protobuf type, or `-1` |
| `RegisterManual<T>(int)` | `void` | Manually register type with specific ID |

## Common Message Types (Verified Sendable)

All of the following have been tested with `NetMessages.Send()` and confirmed to send without error:

| Message Type | Description |
|-------------|-------------|
| `CCitadelUserMsg_ForceShopClosed` | Force-close the shop UI |
| `CCitadelUserMsg_HudGameAnnouncement` | Large HUD announcement with title and description |
| `CCitadelUserMsg_KillStreak` | Kill streak notification (uses `PlayerPawn` and `NumKills`) |
| `CCitadelUserMsg_TeamMsg` | Team message |
| `CCitadelUserMsg_PlayerRespawned` | Player respawn notification (uses `PlayerPawn`) |
| `CCitadelUserMsg_TriggerDamageFlash` | Damage flash effect (uses `EntindexFlashVictim`, `FlashValue`, `FlashType`) |
| `CCitadelUserMsg_PostProcessingAnim` | Post-processing animation |
| `CCitadelUserMsg_MusicQueue` | Music queue message |
| `CCitadelUserMsg_AbilitiesChanged` | Abilities changed notification (uses `PurchaserPlayerSlot`) |
| `CCitadelUserMsg_CameraController` | Camera controller message |
| `CCitadelUserMsg_SetClientCameraAngles` | Force client camera to specific angles |
| `CCitadelUserMsg_ChatMsg` | Chat message |

:::caution Non-Sendable Messages
`CCitadelUserMessage_GameOver` has no registered message ID and will throw an error when sent.
:::

### Set Client Camera Angles

Forces a player's camera to look in a specific direction. This is the only confirmed working method for server-side camera control — schema writes and Teleport angles only affect the hero model, not the client camera.

```csharp
NetMessages.Send(new CCitadelUserMsg_SetClientCameraAngles {
    PlayerSlot = slot,                    // target player slot (int)
    CameraAngles = new CMsgQAngle {
        X = pitch,                        // vertical angle (negative = look up)
        Y = yaw,                          // horizontal angle
        Z = 0                             // roll (usually 0)
    }
}, RecipientFilter.Single(slot));
```

:::tip Third-Person Camera Offset
The game uses a right-shoulder third-person camera, offset ~35 units to the right of `EyePosition`. When calculating aim angles (e.g. for auto-aim), offset the source point along the character's right vector:
```csharp
float yawRad = (float)(pawn.ViewAngles.Y * Math.PI / 180.0);
float rightX = (float)Math.Sin(yawRad);
float rightY = -(float)Math.Cos(yawRad);
var cameraSrc = new Vector3(
    pawn.EyePosition.X + rightX * 35f,
    pawn.EyePosition.Y + rightY * 35f,
    pawn.EyePosition.Z
);
// Then calculate pitch/yaw from cameraSrc to target
```
:::

### HUD Announcement Example

```csharp
var msg = new CCitadelUserMsg_HudGameAnnouncement
{
    TitleLocstring = "ANNOUNCEMENT TITLE",
    DescriptionLocstring = "Description text here"
};
NetMessages.Send(msg, RecipientFilter.All);
```

## See Also

- [Chat Commands](chat-commands) — Chat command system
- [Plugin Base](plugin-base) — `OnChatMessage` hook
- [Deathmatch Example](../examples/deathmatch) — Chat rebroadcasting pattern
