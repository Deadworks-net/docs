---
title: "Server hosting"
sidebar_label: "Server hosting"
---

# Server hosting

Install, launch and open up a Deadworks dedicated server so players outside your network can connect. For a shorter walkthrough, see [Run a server](../getting-started/server-admins/run-a-server).

:::note Windows only
This guide covers **Windows** hosts: a local machine or a Windows VPS. Valve hasn't published a native Linux server binary for Deadlock. On Linux, run Deadworks in Docker: see [Linux & Docker](linux-docker).
:::

A Windows server needs the [.NET 10 Runtime (x64)](https://dotnet.microsoft.com/en-us/download/dotnet/10.0) installed. Deadworks plugins run on it.

## Installing the server

Deadworks runs from a normal game install. For a dedicated server, create a separate install with [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD).

1. Download [SteamCMD for Windows](https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip).
2. Create a folder for SteamCMD, such as `D:\steamcmd`.
3. Extract the zip into that folder.

To install Deadlock, run these commands in SteamCMD:

```text
force_install_dir my_deadworks_server
login <your Steam username>
app_update 1422450 validate
```

The Steam account must own Deadlock.

Run the same commands to update the server.

## Launching the server

Launch `deadworks.exe` in place of `deadlock.exe`. It accepts every Source launch option that `deadlock.exe` accepts.

With no launch options, Deadworks uses these defaults:

```
-dedicated -console -dev -insecure -allow_no_lobby_connect
+tv_citadel_auto_record 0 +spec_replay_enable 0 +tv_enable 0
+citadel_upload_replay_enabled 0
+hostport 27067
+map dl_midtown
```

Override any of them on the command line. `+hostport` is the port the server listens on for game traffic (UDP).

### Example: `run-server.bat`

This batch file launches Deadworks with a set port and map. Save it next to `deadworks.exe` and double-click it:

```batch
@echo off
cd /d "%~dp0"

deadworks.exe ^
  -dedicated -console -insecure -allow_no_lobby_connect ^
  +hostport 27067 ^
  +map dl_midtown

pause
```


## Opening the firewall (Windows / VPS)

On a fresh Windows VPS, Windows Firewall blocks the server's port, even when the VPS provider's network firewall allows it. Run this once in PowerShell as Administrator:

```powershell
New-NetFirewallRule -DisplayName "Deadworks TCP 27067" `
  -Direction Inbound -LocalPort 27067 -Protocol TCP -Action Allow

New-NetFirewallRule -DisplayName "Deadworks UDP 27067" `
  -Direction Inbound -LocalPort 27067 -Protocol UDP -Action Allow
```


## Port forwarding

To let players outside your LAN connect, forward UDP and TCP port `27067` (or your chosen port) on your router or VPS firewall. Players then connect with:

```
connect your.public.ip:27067
```

## Admins

To use admin commands in-game, give your Steam account the `admin` role. See [Making yourself admin](making-yourself-admin). For staff with limited access, see [How permissions work](admins-and-permissions).

Admin permissions apply a few seconds after a player joins, once Steam has confirmed who they are. On a LAN-only server, add `+sv_lan 1` to the launch options to skip that wait. Deadworks reads `sv_lan` when the first player joins, so changing it later needs a restart.

:::danger
Without the wait, anyone can claim an admin's SteamID. Never set `+sv_lan 1` on a server reachable from the internet. See [Steam validation](admins-and-permissions#deadworksjsonc).
:::

## Finding plugins

Community-built plugins are shared on the [Deadworks Discord](https://discord.gg/d3JHnVGA26). Server hosts share, request and discuss plugins there.

To install one, see [Install plugins](../getting-started/server-admins/install-plugins).

## See also

- [Making yourself admin](making-yourself-admin): give your Steam account the `admin` role.
- [Uploading content](uploading-content): distribute addons and maps to players.
