---
title: "Console Commands"
---

# Console Commands

> **Namespace:** `DeadworksManaged.Api`

Use [`[Command]`](commands) when you want to create a console command in your plugin.

If you name the command `heal`, Deadworks gives you:

- `/heal` in chat
- `!heal` in chat
- `dw_heal` in the console

The console version always starts with `dw_`.

If you only want the console version and do not want chat commands, set `ConsoleOnly = true`:

```csharp
[Command("heal", ConsoleOnly = true)]
public void CmdHeal()
{
    Console.WriteLine("Healing command ran.");
}
```

**Coming soon:** to limit who can run a command, give it a [permission](permissions):

```csharp
[Command("heal", ConsoleOnly = true, Permission = "healing.heal")]
```

The server console (and RCON) can always run every command.

For plugin settings, see [ConVars](convars).

## Built-in Commands

| Command | Who can run it | Description |
|---------|----------------|-------------|
| `dw_help` | Anyone | Lists the commands you can run (coming soon: only the ones you're allowed to) |
| `dw_plugin <list\|enable\|disable\|commands> [name]` | Server console (coming soon: or `deadworks.plugins.manage`) | Manage plugins. Coming soon: `name` must be an installed plugin (from `plugins/` or `builtin/`), otherwise `There's no plugin called '<name>'. Run dw_plugin list to see them.` |
| `dw_reloadconfig [name]` | Server console (coming soon: or `deadworks.config.reload`) | Reload plugin configs |
| `dw_penalties_reload` (coming soon) | Server console or `deadworks.penalties.reload` | Re-read the ban and gag list after editing `penalties.jsonc` by hand |
| `dw_perm_*`, `dw_role_*` (coming soon) | See [How Permissions Work](../guides/admins-and-permissions#console-commands) | Manage roles and permissions |

**Coming soon:** the built-in commands are ordinary commands, so server owners can change who can run them in [`overrides.jsonc`](../guides/overriding-command-permissions), like any plugin's.
