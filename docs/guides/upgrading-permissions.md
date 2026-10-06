---
title: "Upgrading to permissions"
sidebar_label: "Upgrading to permissions"
---

# Upgrading to permissions

This release adds [admins and permissions](/permissions): roles, a built-in Admin plugin, and bans, gags and mutes. Most servers and plugins keep working, but a few things changed. Below are the steps to take after upgrading, then every breaking change.

## Server owners: what to do

1. **Update the whole server.** Install the new release over the old one. The native and managed parts change together, so don't mix files from different versions.
2. **Make yourself admin.** Nobody has admin commands until you give someone a role. Join your server, then run this in the server console:

   ```text
   dw_role_grant <your name> admin
   ```

   See [Making yourself admin](making-yourself-admin).
3. **Read the server console after the first start.** Look for:
   - `ERROR: ... uses [ChatCommand(...)]` or `[ConCommand(...)]`: that plugin's commands no longer work. Ask its author for a rebuilt version (see [below](#chatcommand-and-concommand-no-longer-work)).
   - `Warning: ... is already registered by another plugin; both will run`: a plugin uses the same command name as another, often one of the new [Admin commands](admin-commands) like `kick`, `ban` or `map`. Remove one, or turn off the Admin plugin with `dw_plugin disable AdminPlugin`.
   - `isn't a setting ... knows, so it's ignored`: a typo in a config file.
4. **Lock down staff-only commands.** Plugins written before this release don't give their commands permissions, so anyone can still run them. Look through `configs/permissions/generated/` to see every command, and require a permission for the ones that need it in [`overrides.jsonc`](admins-and-permissions#overridesjsonc):

   ```jsonc
   {
     "commands": {
       "givesouls": "itemtest.cheats"
     }
   }
   ```

5. **Back up `configs/`.** Your admins are in `configs/permissions/` and your bans in `configs/penalties/`.
6. **Docker:** add a `./logs:/logs` volume to keep the admin log on the host. Without it, the log stays inside the container's data volume, as before. See [Linux & Docker](linux-docker).
7. **LAN or test server:** admin roles only apply once Steam confirms a player. If your server isn't on the internet, see [`require_steam_auth`](admins-and-permissions#deadworksjsonc).

## Plugin developers: what to do

1. **Replace `[ChatCommand]` and `[ConCommand]` with `[Command]`.** They no longer compile, and old builds of your plugin lose those commands. See [below](#chatcommand-and-concommand-no-longer-work).
2. **Take a `Caller` instead of `CCitadelPlayerController? caller`.** The old form still works, but `Caller` says whether it's the console and has `Reply`:

   ```csharp
   // Before
   [Command("hello")]
   public void CmdHello(CCitadelPlayerController? caller)
   {
       if (caller == null) Console.WriteLine("Hello!");
       else Chat.PrintToChat(caller, "Hello!");
   }

   // After
   [Command("hello")]
   public void CmdHello(Caller caller)
   {
       caller.Reply("Hello!");
   }
   ```

3. **Give admin commands a `Permission`.** Without one, anyone can run them:

   ```csharp
   [Command("givesouls", Permission = "myplugin.cheats")]
   ```

   Start permission names with your plugin's name. See [Permissions](../features/permissions).
4. **Make `async void` commands return `Task`.**
5. **Rebuild against the new `DeadworksManaged.Api` and test.** The rest of this page lists the smaller changes.

## Breaking changes

### For plugin developers

#### `[ChatCommand]` and `[ConCommand]` no longer work

They were deprecated in favor of `[Command]`. Now they're compile errors. Deadworks also doesn't register them in plugins built against an older version, because those commands skip permission checks. The console prints an `ERROR` for each one it finds.

Replace them with `[Command]`:

```csharp
// Before
[ChatCommand("heal")]
public HookResult OnHeal(ChatCommandContext ctx) { /* ... */ return HookResult.Handled; }

[ConCommand("dw_heal")]
public void OnHealConsole(ConCommandContext ctx) { /* ... */ }

// After: /heal, !heal and dw_heal
[Command("heal")]
public void CmdHeal(Caller caller) { /* ... */ }
```

Use `ChatOnly = true` or `ConsoleOnly = true` if you only want one kind, and `Permission` or `ServerOnly = true` to limit who can run it. `[ConVar]` is unchanged.

#### `async void` commands aren't registered

An exception in one would crash the server. Return `Task` or `ValueTask` instead. The console prints an `ERROR` for each one.

#### Code after `await` in a command runs on the game thread

Before, it ran on a thread pool thread. Now every continuation comes back to the game thread, so you can touch entities after an `await`.

:::warning
Slow work after an `await` now runs on the game thread and holds up the server. Move it into `Task.Run`.
:::

Exceptions are now followed to the end of the command, too: a `CommandException` thrown after an `await` is sent to the caller, and anything else is logged.

#### Players' commands never run with a null caller

Before, if a player's controller couldn't be found, a command taking `CCitadelPlayerController? caller` ran with `null`, as if the server console had run it. Now the command doesn't run, so `null` only ever means the server console.

#### Exceptions are logged in full and the caller is told

An exception other than `CommandException` is now logged with its stack trace, and the caller sees `That command failed. The server console has details.` Before, the server console path rethrew it, and players heard nothing.

#### `CommandConverters.Register` refuses built-in types

Registering a converter for a type Deadworks parses itself throws `ArgumentException`. That includes `int`, `long`, `float`, `double`, `bool`, `string`, enums and their nullable versions, and now also `uint`, `ulong`, `Caller`, `Target` and `CCitadelPlayerController`. If you register one in `OnLoad`, **your plugin fails to load**. Remove it.

Converters are also removed when the plugin that registered them unloads, and a converter can throw `CommandException` to tell the caller what's wrong.

#### Arguments are parsed differently

- Numbers are read the same way on every server, whatever its language: `1.5` is one and a half, and `1,5` is fifteen. Before, a German or Russian server read `1,5` as one and a half. This applies to `[ConVar]` values set from the console too.
- An enum argument only takes values the enum has. Before, `99` was accepted for any enum.
- The usage line is shorter: `Usage: dw_ban <player> <minutes> [reason...]` instead of `<player:string> <minutes:int> [reason:string...]`. Enums list their values.

#### Console arguments split only on spaces and quotes

Before, the engine also split `dw_` commands on `{ } ( ) ' :`, so `STEAM_0:1:11101` arrived as five arguments and `it's` as three. Now each is one. If you read `ConCommandContext.Args` yourself and relied on the old splitting, check your parsing.

#### `PrintToConsole` prints line by line, and `;` is replaced

`controller.PrintToConsole` now sends one `echo` per line, and replaces `;` with `；`, which looks the same. Before, a `;` ran the rest of the line as a separate client command.

#### `Caller.Reply` answers players in chat

`caller.Reply` always answers a player in chat, even when they typed the `dw_` version in their console. If you replace your own reply helper with it, use `caller.PrintToConsole` for long output.

#### New names in `DeadworksManaged.Api`

These types are new: `Caller`, `Target`, `TargetImmunity`, `Permissions`, `PermissionExtensions`, `DeclarePermissionAttribute`, `IPermissionStore`, `RoleDefinition`, `PlayerEntry`, `PermissionExplanation`, `SteamIds`, `Penalties`, `Penalty`, `PenaltyType`, `PenaltyEnd`, `IPenaltyStore`, `AdminActivity`, `AdminLogEntry` and `ClientAuthorizedEvent`. If your plugin has a type with one of these names and also has `using DeadworksManaged.Api;`, the compiler reports it as ambiguous. Rename yours, or qualify it.

`DeadworksPluginBase` has new methods to override: `OnClientAuthorized`, `OnPermissionsChanged`, `OnPenaltyAdded`, `OnPenaltyRemoved` and `OnAdminAction`.

#### Command names can clash with the Admin plugin

The built-in [Admin plugin](admin-commands) adds `kick`, `ban`, `addban`, `unban`, `bans`, `gag`, `ungag`, `gags`, `mute`, `unmute`, `mutes`, `slay`, `who`, `penalties`, `map`, `rcon`, `cvar`, `resetcvar` and `execcfg`, and Deadworks adds `dw_perm_*`, `dw_role_*` and `dw_penalties_reload`. If your plugin uses one of these names, both commands run, and the console warns. Rename yours.

### For server owners

#### Admin commands need a role

The new [Admin plugin](admin-commands) is turned on by default. Its commands need permissions, so nobody but the server console can use them until you [make yourself admin](making-yourself-admin). Roles only apply once Steam has confirmed a player, a few seconds after they join.

#### Bans, gags and mutes are enforced by Deadworks

Banned players are turned away before any plugin sees them, gagged players' chat and muted players' voice are dropped, and penalties are saved in `configs/penalties/penalties.jsonc`. See [Admin commands](admin-commands#moderation-commands).

#### Broken config files lock things down

Before, a mistake in `deadworks.jsonc` was logged and the server carried on with the defaults. Now nobody has any permissions, new players can't join and the server isn't listed until you fix the file and restart. Mistakes in the permission and penalty files lock things down too. See [When a file has a mistake](admins-and-permissions#when-a-file-has-a-mistake).

#### Built-in console commands

- `dw_help` only lists the commands you're allowed to run.
- `dw_plugin` and `dw_reloadconfig` can also be run by players with `deadworks.plugins.manage` or `deadworks.config.reload`, which the `admin` role has.
- `dw_plugin` only accepts the name of an installed plugin. Before, `dw_plugin disable` accepted any name.
- Built-in commands can be given different permissions in `overrides.jsonc`, as `Deadworks:<name>`.

#### New files

| File | What it's for |
|------|---------------|
| `configs/permissions/roles.jsonc` | [Roles](admins-and-permissions#rolesjsonc) |
| `configs/permissions/players.jsonc` | [Who has which roles](admins-and-permissions#playersjsonc) |
| `configs/permissions/overrides.jsonc` | [Changing what a command requires](admins-and-permissions#overridesjsonc) |
| `configs/permissions/generated/` | Lists every plugin's commands and permissions, for reference |
| `configs/penalties/penalties.jsonc` | Stores bans, gags and mutes |
| `configs/AdminPlugin/AdminPlugin.jsonc` | [Admin plugin settings](admin-commands#settings) |
| `logs/admin/admin-YYYY-MM-DD.log` | Records what admins did |

All are in `game/bin/win64/`. They're created the first time the server starts. `deadworks.jsonc` has [new settings](admins-and-permissions#deadworksjsonc), which take their defaults if you don't add them.

:::warning
`dw_role_grant` and the other grant and revoke commands rewrite `players.jsonc`. The rewrite removes comments you've added, apart from the header.
:::

## See also

- [Making yourself admin](making-yourself-admin): give your Steam account the `admin` role
- [How permissions work](admins-and-permissions): the permission files and commands
- [Permissions API](../features/permissions): `Caller`, `Permission` and immunity for plugins
