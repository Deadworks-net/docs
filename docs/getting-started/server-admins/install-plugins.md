---
title: "Install plugins"
sidebar_label: "2. Install plugins"
---

# Install plugins

**Step 2 of 4** in [Getting started for server admins](/getting-started/server-admins). A plugin is a `.dll` file that adds commands or game modes to your server.

Find plugins on the [Deadworks Discord](https://discord.gg/d3JHnVGA26).

## Add a plugin

1. Copy the plugin's `.dll` file, and any other `.dll` files it comes with, into `game\bin\win64\managed\plugins\`.
2. Start the server, or, if it's running, wait a moment: Deadworks loads new and changed plugins without a restart.

Deadworks only looks at the top of `plugins\`, not inside folders.

The server console confirms each plugin it loads:

```text
[PluginLoader] Scanning ...\managed\plugins (1 DLLs found)
```

## See what's installed

Run this in the server console:

```text
dw_plugin list
```

`dw_plugin commands <plugin>` lists a plugin's commands. `dw_help` lists every command on the server.

## Change a plugin's settings

A plugin with settings creates a file the first time it loads, at `game\bin\win64\configs\<Plugin>\<Plugin>.jsonc`. Edit it, then run:

```text
dw_reloadconfig <Plugin>
```

The server console prints the file, line and column of any mistake. The plugin keeps its previous settings until the file is fixed.

## Turn a plugin off

```text
dw_plugin disable <Plugin>
dw_plugin enable <Plugin>
```

The setting is remembered across restarts. To remove a plugin for good, delete its `.dll`.

## Check the console after installing

Plugins written for older Deadworks versions can lose commands. Look for these lines in the server console:

| Line | Meaning | What to do |
|------|---------|------------|
| `ERROR: ... uses [ChatCommand(...)]` | The plugin was built for an older Deadworks, and that command doesn't load | Ask the author for an updated version |
| `Warning: ... is already registered by another plugin; both will run` | Two plugins use the same command name | Remove or disable one |
| `... isn't a setting ... knows, so it's ignored` | A typo in a settings file | Fix the name in the file |

## Limit who can use a plugin's commands

A plugin's commands work for everyone unless the plugin gives them a permission. To require one yourself, see [Set up admins](set-up-admins#lock-down-a-plugins-commands).

## Next

**[3. Set up admins](set-up-admins)**
