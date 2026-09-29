---
title: "Hosting on Linux (Docker)"
sidebar_label: "Hosting on Linux (Docker)"
unlisted: true
---

# Hosting on Linux (Docker)

This page outlines how to set up and run a Deadworks server on Linux using Docker.

:::note
Deadlock has no Linux dedicated server. The image runs the Windows server under Wine.
:::

## Requirements

- 64-bit Linux with [Docker](https://docs.docker.com/engine/install/) and Docker Compose
- Storage: 40 GB
- A Steam account that owns Deadlock, used to download the game
- UDP port 27015 open

:::note
For security reasons, it is recommended that you create a new Steam account just for your servers.
:::

## Installing the server

1. Create a folder and download the compose file and the example settings:

   ```bash
   mkdir deadworks && cd deadworks
   curl -fsSLO https://raw.githubusercontent.com/Deadworks-net/deadworks/main/docker/compose.yaml
   curl -fsSL -o .env https://raw.githubusercontent.com/Deadworks-net/deadworks/main/docker/.env.example
   ```

2. Edit `.env` and set the Steam login:

   ```ini
   STEAM_USERNAME=myaccount
   STEAM_PASSWORD=mypassword
   ```

3. Start the server:

   ```bash
   docker compose up -d
   ```

4. Follow the log until it shows `AuthStatus` as `OK`. The first start downloads about 35 GB.

   ```bash
   docker compose logs -f
   ```

5. Connect from the Deadlock console:

   ```text
   connect <server ip>:27015
   ```

:::note
After the first successful start, `STEAM_PASSWORD` can be removed from `.env`. The login is saved.
:::

### Steam Guard

With the mobile authenticator, approve the login on your phone when the container starts.

With email codes, log in once by hand:

```bash
docker compose run --rm deadworks login
```

If `STEAM_PASSWORD` is empty, this command shows a QR code to scan with the Steam mobile app instead.

## Files

These folders are created next to `compose.yaml`. Back them up: they hold everything that is yours. The Docker volumes only hold the game and the saved Steam login, which can be downloaded and entered again.

| Folder | Contents |
| --- | --- |
| `plugins` | Plugin `.dll` files |
| `configs` | `deadworks.jsonc`, plugin configs, `server.cfg`, and your admins and bans (`permissions/`, `penalties/`) |
| `maps` | Custom map `.vpk` files |
| `logs` | The admin action log (`admin/`) |

Paths used elsewhere in this documentation map as follows:

| Windows | Docker |
| --- | --- |
| `game/bin/win64/managed/plugins/` | `plugins/` |
| `game/bin/win64/configs/` | `configs/` |
| `game/bin/win64/logs/` | `logs/` |

## Settings

Settings are read from `.env`. Run `docker compose up -d` to apply changes.

| Setting | Example | Description |
| --- | --- | --- |
| `STEAM_USERNAME` | `myaccount` | Steam account used to download the game. |
| `STEAM_PASSWORD` | `mypassword` | Password for that account. |
| `SERVER_NAME` | `My Server` | Server name. |
| `SERVER_PORT` | `27015` | Game port (UDP). |
| `SERVER_MAP` | `dl_midtown` | Starting map. |
| `SERVER_PASSWORD` | `secret` | Password required to join. Empty for none. |
| `RCON_PASSWORD` | `secret` | RCON password. Only needed for [remote RCON](#remote-rcon). |
| `EXTRA_ARGS` | `-ip 1.2.3.4` | Additional command-line parameters. |
| `AUTO_UPDATE` | `1` | Check for game updates on start. `0` to disable. |
| `DEADWORKS_VERSION` | `latest` | `latest`, a release such as `v0.4.16`, or `image` to use the version included in the image. |
| `PUID`, `PGID` | `1000` | Owner of the files in `plugins`, `configs`, `maps` and `logs`. |

### server.cfg

Other cvars go in `configs/server.cfg`, one per line. The file is executed on every start.

:::note
Cheat cvars such as `sv_cheats` are reset on map load and have no effect in `server.cfg`. Set them from the console.
:::

## Plugins

Copy the plugin `.dll` and its dependencies to `plugins`. Plugins load without a restart. Overwriting a `.dll` reloads the plugin.

```bash
docker compose exec deadworks console dw_plugin list
docker compose exec deadworks console dw_plugin disable MyPlugin
docker compose exec deadworks console dw_plugin enable MyPlugin
```

To remove a plugin, disable it, delete the `.dll` and restart the server.

Plugins compiled on Windows work without changes.

## Console

Run a command:

```bash
docker compose exec deadworks console status
```

Open an interactive console (Ctrl+D to exit):

```bash
docker compose exec deadworks console
```

### Remote RCON

RCON uses TCP on the game port and is not exposed by default. To enable it:

1. Set `RCON_PASSWORD` in `.env`.
2. Uncomment the `tcp` port in `compose.yaml`.
3. Run `docker compose up -d`.

## Updating

The game and Deadworks are both updated when the container starts.

```bash
docker compose restart
```

To update the image:

```bash
docker compose pull
docker compose up -d
```

:::note
A game update can break Deadworks until a new version is released. The log will show `Deadworks <version> does not support Deadlock build <build>`. The container checks for a new release every 10 minutes and restarts the server when one is available.
:::

## Multiple servers

Servers on the same machine share one copy of the game. Each additional server uses about 1 GB.

1. Download `compose.multi.yaml` as `compose.yaml`:

   ```bash
   curl -fsSL -o compose.yaml https://raw.githubusercontent.com/Deadworks-net/deadworks/main/docker/compose.multi.yaml
   ```

2. Start the servers:

   ```bash
   docker compose up -d
   ```

The file defines two servers, `one` and `two`. To add another, copy a block, change its name and port, and add the name under `volumes:` at the end of the file.

Each server has its own folders (`one/plugins`, `one/configs`, `one/logs`); `maps` is shared. Use the server name in commands:

```bash
docker compose exec two console status
docker compose logs -f one
```

:::note
The game is only updated while no server is using it. Restart all servers together with `docker compose restart` to update.
:::

## Using existing game files

To use a Windows copy of Deadlock already on the machine, leave `STEAM_USERNAME` empty and replace the `steam:/steam` volume in `compose.yaml`:

```yaml
- /path/to/Deadlock:/steam/game:ro
```

## Firewall

```bash
sudo ufw allow 27015/udp
```

## Useful commands

| Command | Description |
| --- | --- |
| `docker compose up -d` | Start the server, or apply changes to `.env`. |
| `docker compose down` | Stop the server. |
| `docker compose restart` | Restart and update. |
| `docker compose logs -f` | Follow the log. |
| `docker compose ps` | Show status. `healthy` means the server is answering queries. |
| `docker compose down -v` | Stop the server and delete the downloaded game. |

## Troubleshooting

### download failed (see above). Check STEAM_USERNAME/STEAM_PASSWORD

Check the login in `.env`. If the account uses email Steam Guard, see [Steam Guard](#steam-guard).

:::note
The container waits 10 minutes before trying again to avoid Steam rate limits.
:::

### no game files in /steam/game and STEAM_USERNAME is not set

Set `STEAM_USERNAME` in `.env`, or see [Using existing game files](#using-existing-game-files).

### Deadworks does not support Deadlock build

See [Updating](#updating). No action is needed.

### game files are in use by another server; skipping the update check

Expected when running multiple servers. Restart all of them together to update.

### Server is healthy but players cannot connect

Check that UDP 27015 is open on the machine and in your hosting provider's firewall.

### Permission denied in plugins or configs

Set `PUID` and `PGID` in `.env` to the output of `id -u` and `id -g`.

### Server is not listed in the server browser

Check that `unlisted` is not `true` under `serverbrowser` in `configs/deadworks.jsonc`.
