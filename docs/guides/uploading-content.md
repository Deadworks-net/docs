---
title: "Custom Content"
sidebar_label: "Custom Content"
---

# Custom Content

Custom content is any `.vpk` a server needs its players to have: Panorama addons, models and maps. The launcher downloads what a server advertises before the game starts.

To serve custom content:

1. Copy the `.vpk` to the server.
2. List it in the config.
3. Host a compressed copy for players to download.

## Configuration

Content is listed under `serverbrowser` in `game/bin/win64/configs/deadworks.jsonc`:

```jsonc
{
  "serverbrowser": {
    "content_addons": ["myaddon"],
    "extra_maps": ["dl_express"],
    "fastdl_url": "https://dl.example.com/deadworks"
  }
}
```

| Key | Description |
|---|---|
| `content_addons` | Lists the addons the server mounts and players download. Each file is read from `game/citadel/deadworks_server_addons/vpks/<name>.vpk`. |
| `extra_maps` | Lists the maps players download besides the current map. Each file is read from `game/citadel/maps/<name>.vpk`. |
| `fastdl_url` | Sets the base URL players download from. See [Hosting the files](#hosting-the-files). |

Names are given without the `.vpk` extension. The current map is always advertised and needs no entry.

Use names of 1 to 64 characters from `a-z`, `0-9` and `_`. Launchers skip every other name.

:::note
The server reads the config once at startup. Restart the server after editing it.
:::

## Hosting the files

Players download each file from `fastdl_url`. There are three ways to host:

| Host | Setup |
|---|---|
| [Rented server](#rented-servers) | None. |
| [Free hosting](#free-hosting) | Upload each `.vpk` to your Deadworks account. |
| [Your own host](#your-own-host) | Compress each `.vpk` and upload it to any HTTP server. |

### Rented servers

A server rented from Deadworks hosts its own content, and `fastdl_url` is already set. Copy the file to the server and list it in the config.

### Free hosting

1. Sign in at [deadworks.net/content](https://deadworks.net/content).
2. Set `fastdl_url` to the URL the page shows. It is the same for every server on the account.
3. Upload each `.vpk`. The page compresses it in the browser before uploading.

A `.vpk.zst` or `.vpk.bz2` is uploaded as it is. See [Compression](#compression).

| Limit | Value |
|---|---|
| Addon | 300 MB compressed |
| Map | 1 GB compressed |
| Account | 3 GB compressed, 200 files |

- Uploading a name again replaces the file.
- Names belong to the account. Another account's `dl_harbor` does not affect yours.
- Maps that ship with Deadlock are refused. Players already have them.

:::warning
Upload again after every change to a `.vpk`. Until then, players are warned that the download does not match the server.
:::

### Your own host

1. Set `fastdl_url` to a directory on the host and start the server. The console prints the files to serve, at startup and whenever the list changes:

   ```
   [ContentAddons] fastDL: clients will fetch these from https://dl.example.com/deadworks/ (stock maps can be skipped - players already have them):
     addons/myaddon_9330149c74886724.vpk.zst  (zstd of myaddon.vpk; a bzip2 named .vpk.bz2 also works)
     maps/dl_express_5d0c1e7a94b3f268.vpk.zst  (zstd of dl_express.vpk; a bzip2 named .vpk.bz2 also works)
   ```

2. Compress each `.vpk`:

   ```
   zstd -19 -T0 myaddon.vpk
   ```

3. Upload each `.vpk.zst` under the printed path.

The 16 hex digits in a file name are the start of the `.vpk`'s SHA-256. A changed `.vpk` gets a new name, so a published file never changes and can be cached indefinitely.

:::warning
Upload the new build before restarting the server or changing map. The server advertises the new name from then on.
:::

## Compression

Files are served compressed with zstd. bzip2 is also accepted. Free hosting compresses a `.vpk` for you; on your own host, compress each file yourself.

| Format | Extension | Command |
|---|---|---|
| zstd | `.vpk.zst` | `zstd -19 -T0 myaddon.vpk` |
| bzip2 | `.vpk.bz2` | `bzip2 -k myaddon.vpk` |

Launchers request the `.vpk.zst` first, then the `.vpk.bz2` if the host has no such file. zstd unpacks far faster than bzip2 and, at level 19, is smaller.

:::warning
Do not use a zstd window above 128 MiB (`--long=28` or higher). Launchers refuse the file.
:::

## Verification

Launchers check every download against the hash the server advertises. On a mismatch the player is told the download host does not match the server, and can choose to install the file anyway.

## See also

- [Content Discovery](./content-discovery.md): the format servers advertise, and its limits.
