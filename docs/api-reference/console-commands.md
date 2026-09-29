---
title: "Console Commands"
---

# Console Commands

> **Namespace:** `DeadworksManaged.Api`

A plugin creates console commands with the [`[Command]`](commands) attribute.

If you name the command `heal`, Deadworks gives you:

- `/heal` in chat
- `!heal` in chat
- `dw_heal` in the console

The console version always starts with `dw_`.

If you only want the console version and not the chat commands, set `ConsoleOnly = true`:

```csharp
[Command("heal", ConsoleOnly = true)]
public void CmdHeal(Caller caller)
{
    caller.Reply("Healing command ran.");
}
```

:::warning `ConsoleOnly` doesn't mean "server console only"
Players can still type `dw_heal` in their own game console. Without a `Permission`, anyone can run it. To keep a command to the server console and RCON, set `ServerOnly = true`.
:::

**Coming soon:** to limit who can run a command, give it a [permission](permissions):

```csharp
[Command("heal", ConsoleOnly = true, Permission = "myplugin.heal")]
```

The server console (and RCON) can run every console command, whatever its permission.

For plugin settings, see [ConVars](convars).

## Built-in Commands

| Command | Who can run it | Description |
|---------|----------------|-------------|
| `dw_help` | Anyone | Lists the commands you can run (coming soon: only the ones you're allowed to). |
| `dw_plugin <list\|enable\|disable\|commands> [name]` | Server console (coming soon: or `deadworks.plugins.manage`) | Lists, enables, disables or shows the commands of installed plugins. Enabling and disabling are remembered across restarts. Coming soon: `name` must be an installed plugin (from `plugins/` or `builtin/`), otherwise `There's no plugin called '<name>'. Run dw_plugin list to see them.` |
| `dw_reloadconfig [name]` | Server console (coming soon: or `deadworks.config.reload`) | Reloads the config of every plugin, or of the named one. |
| `dw_penalties_reload` (coming soon) | Server console or `deadworks.penalties.reload` | Re-reads bans, gags and mutes after you edit `penalties.jsonc` by hand. |
| `dw_perm_*`, `dw_role_*` (coming soon) | See [How Permissions Work](../guides/admins-and-permissions#console-commands) | Manages roles and permissions. |

**Coming soon:** the built-in commands are ordinary commands, so server owners can change who can run them in [`overrides.jsonc`](../guides/admins-and-permissions#overridesjsonc), like any plugin's.
