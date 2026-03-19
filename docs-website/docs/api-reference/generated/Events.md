---
title: "Event Types"
sidebar_label: "Event Types"
sidebar_position: 28
---

<!-- AUTO-GENERATED from DeadworksManaged.Api.xml — do not edit manually. -->

# ClientConCommandEvent

> **Namespace:** `DeadworksManaged.Api`

Event data passed to `ClientConCommandEvent)`. Contains the controller pointer, command name, and parsed argument array.

---

## ClientPutInServerEvent

> **Namespace:** `DeadworksManaged.Api`

Fired when a client is put into the server (initial connection). Passed to `ClientPutInServerEvent)`.

---

## ClientFullConnectEvent

> **Namespace:** `DeadworksManaged.Api`

Fired when a client has fully connected and is in-game. Passed to `ClientFullConnectEvent)`.

---

## ClientDisconnectedEvent

> **Namespace:** `DeadworksManaged.Api`

Fired when a client disconnects. Passed to `ClientDisconnectedEvent)`.

---

## EntityCreatedEvent

> **Namespace:** `DeadworksManaged.Api`

Fired when a new entity is created. Passed to `EntityCreatedEvent)`.

---

## EntitySpawnedEvent

> **Namespace:** `DeadworksManaged.Api`

Fired when an entity has been fully spawned. Passed to `EntitySpawnedEvent)`.

---

## EntityDeletedEvent

> **Namespace:** `DeadworksManaged.Api`

Fired just before an entity is deleted. Passed to `EntityDeletedEvent)`.

---

## EntityTouchEvent

> **Namespace:** `DeadworksManaged.Api`

Fired when two entities start or stop touching. Passed to `EntityTouchEvent)` and `EntityTouchEvent)`.

---

## TakeDamageEvent

> **Namespace:** `DeadworksManaged.Api`

Event data passed to `TakeDamageEvent)`. Contains the target entity and full damage info.

---

## ModifyCurrencyEvent

> **Namespace:** `DeadworksManaged.Api`

Event data passed to `ModifyCurrencyEvent)`. Contains the pawn, currency type, amount, and source of the change.
