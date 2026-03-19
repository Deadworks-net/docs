---
title: "RecipientFilter"
sidebar_label: "RecipientFilter"
sidebar_position: 15
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# RecipientFilter

> **Namespace:** `DeadworksManaged.Api`

Bitmask of player slots that should receive a net message. Each bit position corresponds to a player slot index.

## Properties

| Property | Description |
|----------|-------------|
| `All` | A filter that targets all 64 possible player slots. |

## Fields

| Property | Description |
|----------|-------------|
| `Mask` | Raw bitmask where bit `i` indicates slot `i` is included. |

## Methods

| Method | Description |
|--------|-------------|
| `Single(int slot)` | A filter targeting exactly one player slot. |
| `Add(int slot)` | Adds a player slot to the filter. |
| `Remove(int slot)` | Removes a player slot from the filter. |
| `HasRecipient(int slot)` | Returns `true` if the given slot is included in this filter. |

---

## OutgoingMessageContext

> **Namespace:** `DeadworksManaged.Api`

Carries a server→client net message along with its destination recipients. Passed to handlers registered via `HookResult})`.

### Properties

| Property | Description |
|----------|-------------|
| `Message` | The protobuf message being sent. |
| `Recipients` | The set of players this message will be delivered to. Modifiable by the hook handler. |
| `MessageId` | The numeric network message ID for `T`. |

---

## IncomingMessageContext

> **Namespace:** `DeadworksManaged.Api`

Carries a client→server net message along with its sender. Passed to handlers registered via `HookResult})`.

### Properties

| Property | Description |
|----------|-------------|
| `Message` | The protobuf message received from the client. |
| `SenderSlot` | The player slot index of the client that sent this message. |
| `MessageId` | The numeric network message ID for `T`. |
