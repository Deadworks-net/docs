---
title: "NetMessages"
sidebar_label: "NetMessages"
sidebar_position: 14
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# NetMessages

> **Namespace:** `DeadworksManaged.Api`

Entry point for sending and hooking Source 2 network messages. Messages are identified by their protobuf type; IDs are resolved via `NetMessageRegistry`.

## Methods

| Method | Description |
|--------|-------------|
| `Send<T>(T message, RecipientFilter recipients)` | Sends a protobuf net message to the specified recipients. |
| `HookOutgoing<T>(Func<OutgoingMessageContext<T>, HookResult> handler)` | Registers a hook that fires before a server→client message of type `T` is sent. |
| `HookIncoming<T>(Func<IncomingMessageContext<T>, HookResult> handler)` | Registers a hook that fires when the server receives a client→server message of type `T`. |
| `UnhookOutgoing<T>(Func<OutgoingMessageContext<T>, HookResult> handler)` | Removes a previously registered outgoing hook for message type `T`. |
| `UnhookIncoming<T>(Func<IncomingMessageContext<T>, HookResult> handler)` | Removes a previously registered incoming hook for message type `T`. |

---

## NetMessageRegistry

> **Namespace:** `DeadworksManaged.Api`

Maps protobuf message types to their network message IDs by scanning proto enum descriptors at runtime. Used internally by the net message send/hook system; also exposes manual registration for custom message types.

### Methods

| Method | Description |
|--------|-------------|
| `GetMessageId<T>()` | Returns the network message ID for `T`, or `-1` if not registered. |
| `GetMessageId(Type type)` | Returns the network message ID for the given protobuf message type, or `-1` if not registered. |
| `RegisterManual<T>(int messageId)` | Manually registers a protobuf message type with a specific network message ID, bypassing the automatic enum-based discovery. |

---

## NetMessageHandlerAttribute

> **Namespace:** `DeadworksManaged.Api`

Marks a method as a handler for one or more net message types. Applied alongside `HookResult})` or `HookResult})` registrations.

---

## NetMessageDirection

> **Namespace:** `DeadworksManaged.Api`

Whether the message is travelling from client→server (Incoming) or server→client (Outgoing).
