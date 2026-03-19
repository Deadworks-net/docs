---
title: "Players"
sidebar_label: "Players"
---

# Players

> **Namespace:** `DeadworksManaged.Api`

The player system consists of **controllers** (managing the player slot) and **pawns** (the in-game physical entity).

## Players (Static Helpers)

```csharp
// Get all connected controllers
foreach (var controller in Players.GetAll()) { }

// Get all hero pawns
foreach (var pawn in Players.GetAllPawns()) { }

// Get controller by slot
var controller = Players.FromSlot(slotIndex);
```

| Member | Type | Description |
|--------|------|-------------|
| `MaxSlots` | `int` (const) | Maximum number of player slots on the server |
| `GetAll()` | `IEnumerable<CCitadelPlayerController>` | All connected controllers |
| `GetAllPawns()` | `IEnumerable<CCitadelPlayerPawn>` | Hero pawn for every connected player that has one |
| `FromSlot(int)` | `CCitadelPlayerController?` | Controller in given slot, or `null` |

## CCitadelPlayerController

Deadlock-specific player controller. Extends `CBasePlayerController`.

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `GetHeroPawn()` | `CCitadelPlayerPawn?` | Returns the player's current hero pawn, or `null` |
| `ChangeTeam(int team)` | `void` | Moves player to specified team |
| `SelectHero(Heroes hero)` | `void` | Forces player to select specified hero |
| `PrintToConsole(string msg)` | `void` | Sends message to this player's console |
| `PrintToConsoleAll(string msg)` | `void` | Sends message to all connected players' consoles |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `PlayerDataGlobal` | `PlayerDataGlobal?` | Read-only access to networked stats (kills, gold, level, damage) |

### Example

```csharp
var controller = ctx.Controller;
if (controller == null) return HookResult.Handled;

// Force hero selection
controller.SelectHero(Heroes.Inferno);

// Change team
controller.ChangeTeam(2);

// Get pawn
var pawn = controller.GetHeroPawn();
```

## CBasePlayerController

Base player controller entity. Manages the link between a player slot and their pawn.

| Method | Description |
|--------|-------------|
| `SetPawn(CBasePlayerPawn, bool, bool, bool, bool)` | Assigns a new pawn, optionally transferring team and movement state |

## CCitadelPlayerPawn

The in-game physical representation of a player (the hero). Extends `CBasePlayerPawn`.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `EyeAngles` | `Vector3` | Networked eye angles (quantized to 11 bits, ~0.18° precision) |
| `EyePosition` | `Vector3` | Eye position (AbsOrigin + ViewOffset) — where the camera sits |
| `CameraAngles` | `Vector3` | Client camera angles for SourceTV/spectating |
| `ViewAngles` | `Vector3` | Raw server-side view angles (full float precision, no quantization) |
| `Health` | `int` | Current health (inherited from `CBaseEntity`) |
| `Position` | `Vector3` | World position (inherited from `CBaseEntity`) |

:::tip Angles & Position — All Confirmed Working (Read)
- **`Position`** — World-space origin of the pawn (feet)
- **`EyePosition`** — Where the camera sits (origin + view offset, ~72 units above position)
- **`EyeAngles`** — Quantized eye angles (~0.18° precision, suitable for most checks)
- **`ViewAngles`** — Full-precision server-side view angles (use for accurate aim calculations)
- **`CameraAngles`** — Client camera angles (useful for spectating/SourceTV)
- **Velocity** — Use `m_vecVelocity` / `m_vecAbsVelocity` via `SchemaAccessor<Vector3>` (see [Entities — Velocity](entities#velocity-via-schema))
- **Setting camera** — Use `CCitadelUserMsg_SetClientCameraAngles` via `NetMessages.Send` (see [Networking](networking#set-client-camera-angles)). Schema writes and `Teleport` angles only move the model, not the camera.
- **Camera offset** — The third-person camera sits ~35 units to the right of `EyePosition` (right shoulder view). Account for this when calculating aim angles.
:::
| `AbilityComponent` | `CCitadelAbilityComponent` | Access to stamina and ability resources |
| `ModifierProp` | `CModifierProperty` | Access to modifier state flags |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `ModifyCurrency(ECurrencyType, int, ECurrencySource, bool, bool, bool)` | `void` | Add/remove currency (gold, ability points). Negative to spend |
| `ResetHero(bool)` | `void` | Full reset: clears loadout, removes items, re-adds starting abilities |
| `RemoveAbility(string name)` | `bool` | Removes ability by internal name. Returns `true` on success |
| `AddAbility(string name, uint slot)` | `CBaseEntity?` | Adds ability to given slot. Returns the new ability entity |

### Currency Example

```csharp
// Give 15000 gold
pawn.ModifyCurrency(ECurrencyType.Gold, 15000, ECurrencySource.FlagCapture, false, false, false);

// Give 17 ability points
pawn.ModifyCurrency(ECurrencyType.AbilityPoints, 17, ECurrencySource.FlagCapture, false, false, false);
```

### Ability Management

```csharp
// Remove an ability
pawn.RemoveAbility("ability_priest_weaponswap");

// Add an ability to slot 3
pawn.AddAbility("ability_familiar_ability01", slot: 3);
```

### EAbilitySlots_t

| Value | Raw | Description |
|-------|-----|-------------|
| `ESlot_Signature_1` | 0 | Signature ability 1 |
| `ESlot_Signature_2` | 1 | Signature ability 2 |
| `ESlot_Signature_3` | 2 | Signature ability 3 |
| `ESlot_Signature_4` | 3 | Signature ability 4 (ultimate) |
| `ESlot_ActiveItem_1` | 4 | Active item slot 1 |
| `ESlot_ActiveItem_2` | 5 | Active item slot 2 |
| `ESlot_ActiveItem_3` | 6 | Active item slot 3 |
| `ESlot_ActiveItem_4` | 7 | Active item slot 4 |
| `ESlot_Ability_Held` | 8 | Held ability |
| `ESlot_Ability_ZipLine` | 9 | Zipline ability |
| `ESlot_Ability_Mantle` | 10 | Mantle ability |
| `ESlot_Ability_ClimbRope` | 11 | Climb rope ability |
| `ESlot_Ability_Jump` | 12 | Jump ability |
| `ESlot_Ability_Slide` | 13 | Slide ability |
| `ESlot_Ability_Teleport` | 14 | Teleport ability |
| `ESlot_Ability_ZipLineBoost` | 15 | Zipline boost |
| `ESlot_Ability_Innate_1` | 17 | Innate ability 1 |
| `ESlot_Ability_Innate_2` | 18 | Innate ability 2 |
| `ESlot_Ability_Innate_3` | 19 | Innate ability 3 |
| `ESlot_Weapon_Secondary` | 20 | Secondary weapon |
| `ESlot_Weapon_Primary` | 21 | Primary weapon |
| `ESlot_Weapon_Melee` | 22 | Melee weapon |
| `ESlot_None` | 23 | No slot |

:::note
`AddAbility` only works for item abilities (`EAbilityType_Item`). The slot parameter corresponds to these values. Item abilities typically use slots 4-7.
:::

## CCitadelAbilityComponent

Ability component on a player pawn. Provides access to stamina/ability resources.

### ResourceStamina (AbilityResource)

```csharp
var stamina = pawn.AbilityComponent.ResourceStamina;

// Read values (confirmed working)
float current = stamina.CurrentValue;  // e.g. 3
float max = stamina.MaxValue;          // e.g. 3
float regen = stamina.PrevRegenRate;   // e.g. 0.555555
float latch = stamina.LatchTime;       // server time of last latch
float latchVal = stamina.LatchValue;   // e.g. 3
```

| Property | Type | Read | Write | Description |
|----------|------|------|-------|-------------|
| `CurrentValue` | `float` | Yes | **No** | Current stamina value. Writing is overridden by the engine next tick |
| `MaxValue` | `float` | Yes | **No** | Maximum stamina value |
| `PrevRegenRate` | `float` | Yes | **No** | Stamina regeneration rate per second |
| `LatchTime` | `float` | Yes | **No** | Server time of last latch event |
| `LatchValue` | `float` | Yes | **No** | Latch value |

:::caution Stamina Write Does Not Work
While `CurrentValue` has a setter, the engine's native stamina system recalculates the value every tick, immediately overriding any managed-side writes. Use modifiers or abilities to affect stamina instead.
:::

## Ability Entities

### CCitadel_Ability_Jump

Jump ability entity tracking air jump/wall jump counters. Cast from the abilities list with `As<CCitadel_Ability_Jump>()`.

| Property | Type | Description |
|----------|------|-------------|
| `DesiredAirJumpCount` | `int` | Target air jump count |
| `ExecutedAirJumpCount` | `int` | Actual air jumps performed |
| `ConsecutiveAirJumps` | `sbyte` | Consecutive air jumps without landing |
| `ConsecutiveWallJumps` | `sbyte` | Consecutive wall jumps |

### CCitadel_Ability_Dash

Dash ability entity tracking consecutive air/down dash counters. Cast with `As<CCitadel_Ability_Dash>()`.

| Property | Type | Description |
|----------|------|-------------|
| `ConsecutiveAirDashes` | `sbyte` | Consecutive air dashes without landing |
| `ConsecutiveDownDashes` | `sbyte` | Consecutive downward dashes |

### Example: Reading Ability Counters

```csharp
var abilities = pawn.AbilityComponent.Abilities;
for (int i = 0; i < abilities.Count; i++)
{
    var jump = abilities[i].As<CCitadel_Ability_Jump>();
    if (jump != null)
        Console.WriteLine($"Air jumps: {jump.ConsecutiveAirJumps}");

    var dash = abilities[i].As<CCitadel_Ability_Dash>();
    if (dash != null)
        Console.WriteLine($"Air dashes: {dash.ConsecutiveAirDashes}");
}
```

## PlayerDataGlobal

Read-only access to networked player stats via `Controller.PlayerDataGlobal`.

The underlying schema type is `PlayerDataGlobal_t`. You can read fields via `SchemaAccessor<T>` on the controller's handle:

```csharp
private static readonly SchemaAccessor<int> _goldNetWorth =
    new("PlayerDataGlobal_t"u8, "m_iGoldNetWorth"u8);
private static readonly SchemaAccessor<int> _playerKills =
    new("PlayerDataGlobal_t"u8, "m_iPlayerKills"u8);
private static readonly SchemaAccessor<int> _heroDamage =
    new("PlayerDataGlobal_t"u8, "m_iHeroDamage"u8);

// Read from the controller
var controller = Players.FromSlot(slot);
int networth = _goldNetWorth.Get(controller.Handle);
int kills = _playerKills.Get(controller.Handle);
int damage = _heroDamage.Get(controller.Handle);
```

### All Fields (Verified)

All 24 fields confirmed readable via test:

| Property | Type | Description |
|----------|------|-------------|
| `Level` | `int` | Hero level |
| `MaxAmmo` | `int` | Maximum ammo count |
| `HealthMax` | `int` | Maximum health |
| `Health` | `int` | Current health |
| `GoldNetWorth` | `int` | Total gold (souls) networth |
| `APNetWorth` | `int` | Ability point networth |
| `CreepGold` | `int` | Total creep gold earned |
| `CreepGoldSoloBonus` | `int` | Solo lane bonus gold |
| `CreepGoldKill` | `int` | Gold from creep last hits |
| `CreepGoldAirOrb` | `int` | Gold from air orbs |
| `CreepGoldGroundOrb` | `int` | Gold from ground orbs |
| `CreepGoldDeny` | `int` | Gold from denies |
| `CreepGoldNeutral` | `int` | Gold from neutral camps |
| `FarmBaseline` | `int` | Farm baseline value |
| `PlayerKills` | `int` | Player kills |
| `PlayerAssists` | `int` | Player assists |
| `Deaths` | `int` | Deaths |
| `Denies` | `int` | Creep denies |
| `LastHits` | `int` | Creep last hits |
| `KillStreak` | `int` | Current kill streak |
| `HeroDraftPosition` | `int` | Position in hero draft |
| `HeroDamage` | `int` | Total hero damage dealt |
| `HeroHealing` | `int` | Hero healing done |
| `SelfHealing` | `int` | Self healing done |
| `ObjectiveDamage` | `int` | Damage dealt to objectives |

These can also be read via `SchemaAccessor<int>` on the controller handle using `"PlayerDataGlobal_t"` as the class name (e.g. `"m_iGoldNetWorth"`).

:::caution Slot Limit
Player slots above 31 contain garbage data (e.g. Level=1119879168). Always cap iteration to `slot < 32` when reading PlayerDataGlobal fields across all players.
:::

## Action Detection Limitations

The API provides limited ability to detect what players are doing. This affects what kinds of triggers and conditions you can build.

**Can detect:**
- Stamina changes (indicates jump/dash via `AbilityComponent.ResourceStamina`)
- Position changes (via `Position`, `EyePosition`)
- View angle changes (via `ViewAngles`, `EyeAngles`)
- Health changes (via `Health`, `OnTakeDamage` hook)
- Death and respawn (via `LifeState`, game events)
- Currency changes (via `OnModifyCurrency` hook)
- Chat messages and console commands

**Cannot detect:**
- Ability use (no ability-cast event or hook)
- Ultimate activation
- Item activation
- Reload
- Melee attack / parry
- Crouch
- Mantle

:::tip Workaround
For jump/dash detection, poll `AbilityComponent.ResourceStamina.CurrentValue` every tick — a decrease indicates a stamina-consuming action was performed.
:::

## Currency Types

### ECurrencyType

| Value | Raw | Description |
|-------|-----|-------------|
| `Invalid` | -1 | Invalid |
| `Gold` | 0 | In-game gold (souls) |
| `AbilityPoints` | 1 | Ability upgrade points |
| `AbilityUnlocks` | 2 | Ability unlock tokens |
| `DeathPenaltyGold` | 3 | Gold lost on death |
| `ItemDraftRerolls` | 4 | Item draft reroll tokens |
| `ItemEnhancements` | 5 | Item enhancement tokens |

### ECurrencySource

| Value | Raw | Description |
|-------|-----|-------------|
| `EItemPurchase` | 0 | Item purchased |
| `EItemSale` | 2 | Item sold |
| `ECheats` | 7 | Cheat/debug |
| `EPlayerKill` | 11 | Player kill reward |
| `EPlayerKillAssist` | 12 | Assist reward |
| `EBossKill` | 13 | Boss kill reward |
| `ELaneTrooperKill` | 14 | Lane trooper kill |
| `ENeutralTrooperKill` | 15 | Neutral camp kill |
| `EOrbPlayer` | 23 | Soul orb from player |
| `EOrbLaneTrooper` | 25 | Soul orb from lane trooper |

:::note
ECurrencySource has 45 values total. Only the most commonly used are listed above.
:::

## LifeState

Entity life-cycle state (`LifeState_t`):

| Value | Raw | Description |
|-------|-----|-------------|
| `LIFE_ALIVE` | 0 | Entity is alive |
| `LIFE_DYING` | 1 | Entity is in the dying process |
| `LIFE_DEAD` | 2 | Entity is dead |
| `LIFE_RESPAWNABLE` | 3 | Entity can respawn |
| `LIFE_RESPAWNING` | 4 | Entity is respawning |

## See Also

- [Entities](entities) — Base entity system
- [Modifiers](modifiers) — Modifier states on pawns
- [Heroes](heroes) — Hero enum and data
- [Team & Hero Management Guide](../guides/team-and-hero-management) — Practical patterns
