---
title: "Run a Deadworks server"
sidebar_label: "1. Run a server"
---

# Run a Deadworks server

:::tip Rent a server instead
[Deadworks.net](https://deadworks.net) rents Deadlock servers with Deadworks set up and automatically updated. Plugins, admins, maps and content are managed from its interface, so you can skip the rest of this guide.
:::

On Linux, run the server in Docker instead: see [Linux & Docker](../../guides/linux-docker), then continue at [2. Install plugins](install-plugins).

## Requirements

- A Windows PC or Windows VPS
- The [.NET 10 Runtime (x64)](https://dotnet.microsoft.com/en-us/download/dotnet/10.0).
- A Steam account that owns Deadlock. SteamCMD needs it to download the game.
- About 35 GB of free disk space

## Install Deadlock with SteamCMD

[SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD) is the command-line version of Steam. A server installed with it is separate from your own copy of the game.

:::tip
You can also run Deadworks from your own Deadlock install, at `C:\Program Files (x86)\Steam\steamapps\common\Deadlock`, but a separate install is recommended.
:::

1. Download [SteamCMD for Windows](https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip) and extract it to a folder, for example `D:\steamcmd`.
2. Run `steamcmd.exe`, then install Deadlock. SteamCMD asks for your password and any Steam Guard code:

   ```text
   force_install_dir D:\deadworks-server
   login <your Steam username>
   app_update 1422450 validate
   quit
   ```

Run the same commands again to update the server after a Deadlock patch.

## Install Deadworks

1. Download the latest `deadworks-<version>.zip` from [GitHub releases](https://github.com/Deadworks-net/deadworks/releases).
2. Extract it into the server folder, `D:\deadworks-server`. The zip contains a `game` folder, which merges with the one already there.

`deadworks.exe` is now in `D:\deadworks-server\game\bin\win64\`.

## Start the server

Run `deadworks.exe`. The window that opens is the **server console**. It shows what the server is doing and runs any command you type in it.

### Change the launch options

`deadworks.exe` takes the same launch options as `deadlock.exe`. Launch options replace all of Deadworks' defaults, so pass the full list with your changes. Save it as a batch file such as `run-server.bat` next to `deadworks.exe`, then start the server with it. The batch file below has the defaults. Change any of them, such as `+hostport`, the port players connect to, or `+map`, the starting map:

```batch
@echo off
cd /d "%~dp0"

deadworks.exe -dedicated -console -dev -insecure -allow_no_lobby_connect ^
  +tv_citadel_auto_record 0 +spec_replay_enable 0 +tv_enable 0 ^
  +citadel_upload_replay_enabled 0 ^
  +hostport 27067 ^
  +map dl_midtown

pause
```

## Let players connect

Windows Firewall blocks the port on a new machine. Run this once in PowerShell as Administrator:

```powershell
New-NetFirewallRule -DisplayName "Deadworks TCP 27067" -Direction Inbound -LocalPort 27067 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Deadworks UDP 27067" -Direction Inbound -LocalPort 27067 -Protocol UDP -Action Allow
```

On a home network, also forward TCP and UDP `27067` on your router to this PC.

Players connect from the Deadlock console:

```text
connect your.public.ip:27067
```

## Where things are

Everything Deadworks uses is under `game\bin\win64\`:

| Folder | Contents |
|--------|----------|
| `managed\plugins\` | Plugins you install |
| `managed\builtin\` | Plugins that ship with Deadworks, such as the Admin plugin |
| `configs\` | `deadworks.jsonc`, plugin settings, admins and bans |
| `logs\admin\` | What admins did, one file per day |

Back up `configs\`. It holds your admins and bans.

## Next

**[2. Install plugins](install-plugins)**

For launch options, firewalls and other hosting details, see [Server hosting](../../guides/server-hosting).
