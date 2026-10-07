---
title: "Content Discovery"
sidebar_label: "Content Discovery"
unlisted: true
---

# Content Discovery

A Deadworks server advertises the addons and maps it runs through Steam: two server tags and a set of A2S_RULES keys. A launcher reads them to list servers and to download their content before the game connects.

| You | Read |
|---|---|
| Host a server | [For server hosts](#for-server-hosts) |
| Write a launcher or server browser | [For launcher developers](#for-launcher-developers) |

## For server hosts

### What the server advertises

| Channel | Value | Description |
|---|---|---|
| Steam tag | `dw1` | Marks the server as a Deadworks server. Always set. |
| Steam tag | `dwa<digest>` | Identifies the addon set. Set when the server has at least one addon. |
| Steam tag | `dwu` | Asks server browsers not to list the server. Set when `unlisted` is `true`. |
| A2S_RULES | `dw_*` keys | Lists the name, hash and size of every addon and map, plus the download URL. See [Rules reference](#rules-reference). |

The server publishes all three by itself at startup, on every map load, and when a plugin loads or unloads.

:::note
The server writes its tags at the front of `sv_tags` and keeps yours after them. It removes any tag of yours that starts with `dw`.
:::

### Configuration

Content is configured under `serverbrowser` in `game/bin/win64/configs/deadworks.jsonc`:

```jsonc
{
  "serverbrowser": {
    "content_addons": ["turbo"],
    "extra_maps": ["dl_express"],
    "fastdl_url": "https://dl.example.com/deadworks"
  }
}
```

| Key | Description |
|---|---|
| `content_addons` | Lists the addons the server mounts and players download, without the `.vpk` extension. Each file is read from `game/bin/win64/deadworks_mods/vpks/<name>.vpk`. |
| `extra_maps` | Lists the maps to advertise besides the current map, without the `.vpk` extension. Each file is read from `game/citadel/maps/<name>.vpk`. |
| `fastdl_url` | Sets the base URL players download content from. Must be an absolute `http://` or `https://` URL of at most 128 characters, with no credentials, query string or fragment. |

The current map is always advertised. Addons declared by a loaded plugin are advertised together with `content_addons`.

Use names of 1 to 64 characters from `a-z`, `0-9` and `_`. Launchers skip every other name.

:::note
The server reads the config once at startup. Restart the server after editing it.
:::

### Hosting the files

Players download each file from `fastdl_url`. Any static HTTP server works. Without `fastdl_url` the server advertises names and hashes, but no download location.

The host has to serve each file as a bzip2-compressed `.vpk` at:

```
<fastdl_url>/addons/<name>_<hash>.vpk.bz2
<fastdl_url>/maps/<name>_<hash>.vpk.bz2
```

`<hash>` is the first 16 lowercase hex digits of the SHA-256 of the uncompressed `.vpk`.

1. Copy each `.vpk` to the server and list it in the config.
2. Set `fastdl_url` and start the server. The console prints the files to serve:

   ```
   [ContentAddons] fastDL: clients will fetch these from https://dl.example.com/deadworks/ (stock maps can be skipped - players already have them):
     addons/turbo_9330149c74886724.vpk.bz2  (bzip2 of turbo.vpk)
     maps/dl_midtown_faf73184b902d52d.vpk.bz2  (bzip2 of dl_midtown.vpk)
     maps/dl_express_5d0c1e7a94b3f268.vpk.bz2  (bzip2 of dl_express.vpk)
   ```

3. Compress each `.vpk` with bzip2:

   ```
   bzip2 -k turbo.vpk
   ```

4. Upload each `.vpk.bz2` under the printed path. Here `turbo.vpk.bz2` goes to `https://dl.example.com/deadworks/addons/turbo_9330149c74886724.vpk.bz2`.

Maps that ship with Deadlock, such as `dl_midtown`, need no upload.

:::warning
A changed `.vpk` has a new hash, so its file name on the host changes. The server advertises the new hash from the next map load or restart. Upload the new build before then, or players cannot download it.
:::

:::tip
To get a hash without starting the server:

```
sha256sum turbo.vpk | cut -c1-16
```

In PowerShell:

```powershell
(Get-FileHash turbo.vpk -Algorithm SHA256).Hash.Substring(0, 16).ToLower()
```
:::

### Free hosting

Hosts with no web host can use Deadworks' hosting:

1. Sign in at [deadworks.net/content](https://deadworks.net/content).
2. Upload each `.vpk.bz2`.
3. Set `fastdl_url` to your personal base URL, of the form `https://api.deadworks.net/fastdl/u/<id>`.

| Limit | Value |
|---|---|
| Addon | 300 MB compressed |
| Map | 1 GB compressed |
| Account | 3 GB compressed |

Maps that ship with Deadlock are refused.

:::warning
This host keeps one file per name and ignores the hash in the requested path. Upload again after every change to a `.vpk`. Until then, players are warned that the download does not match the server.
:::

### Limits

| Limit | Value | When exceeded |
|---|---|---|
| Addon list | 640 characters | Entries are dropped from the end. Launchers do not learn about them. |
| Map list | 300 characters | Entries are dropped from the end. Launchers do not learn about them. |
| `fastdl_url` | 128 characters | The URL is not advertised. |
| Server tags, including `sv_tags` | 63 characters | The engine cuts tags from the end. |
| One file | 4 GiB, compressed and decompressed | The Deadworks launcher does not install it. |
| All downloads for one join | 16 GiB | The Deadworks launcher refuses the join. |

The addon and map list limits count bytes of UTF-8, so a name outside ASCII costs more than one per character.

The Deadworks launcher downloads only from public hosts. A `fastdl_url` on `localhost` or a private address such as `192.168.1.10` works only for players on the same network as the game server, and a public host must not redirect to one.

A list entry is the name, the hash and the file size in bytes. For example, `turbo:9330149c74886724:11965` takes 28 characters, plus 1 for the comma between entries.

### Unlisted servers

| Setting | Listed by Steam | Shown in server browsers | Advertises content |
|---|---|---|---|
| Default | Yes | Yes | Yes |
| `"unlisted": true` under `serverbrowser` | Yes | No | Yes |
| `-nomaster` on the command line | No | No | No |

Use `unlisted` for a private server whose players still need its content. They join by address, and the launcher downloads what the server advertises.

:::warning
A server started with `-nomaster` is left out of Steam's server list and answers no A2S queries, neither A2S_INFO nor A2S_RULES. It cannot advertise content, and launchers cannot find it.
:::

### Console messages

Every line starts with `[ContentAddons]`.

| Message | Meaning |
|---|---|
| `Published 1 addon(s) and 2 map(s) to A2S_RULES.` | The rules are published. |
| `Steam gameserver not up - rules not published.` | Steam has not logged the server on yet. The server tries again on the next map load or plugin load. |
| `'<name>' has no file at deadworks_mods\vpks\<name>.vpk; it is advertised without a version hash, so clients cannot verify it or fetch it over fastDL.` | The addon file is missing. Copy it to that path. |
| `Map '<name>' has no loose file at citadel/maps/<name>.vpk; it is advertised without a version hash.` | The map file is missing. Copy it to that path. |
| `serverbrowser.fastdl_url <reason>; not advertised.` | `fastdl_url` is invalid. Fix it and restart the server. |
| `A2S_RULES lists 9 of 12 addons and 2 of 2 maps; the rest do not fit under its size cap.` | A list is over its [limit](#limits). Shorten names or remove entries. |
| `'<name>' from <source> uses characters outside a-z, 0-9 and '_'; third-party launchers may refuse to install it.` | Rename the file and its config entry. |

## For launcher developers

### Discovering servers

Request the Deadworks servers in Steam's master server list for Deadlock (app 1422450):

```
GET https://api.deadworks.net/api/steam/servers?deadworks=1
```

| Parameter | Description |
|---|---|
| `deadworks=1` | Returns only servers that carry the `dw1` tag and not the `dwu` tag. Without it, every Deadlock server is returned. |

Each entry is Steam's own record of the server:

```json
{
  "servers": [
    {
      "addr": "203.0.113.10:27015",
      "gameport": 27015,
      "steamid": "90071992547409920",
      "name": "Example Deadworks server",
      "appid": 1422450,
      "gamedir": "citadel",
      "version": "48",
      "product": "citadel",
      "region": -1,
      "players": 6,
      "max_players": 12,
      "bots": 0,
      "map": "dl_midtown",
      "secure": false,
      "dedicated": true,
      "os": "w",
      "gametype": "dw1,dwa8a1b839d,insecure"
    }
  ],
  "total": 1
}
```

`gametype` is the server's tag string. Split it on `,` and match whole tags:

| Tag | Description |
|---|---|
| `dw1` | Marks a Deadworks server. |
| `dwa<digest>` | Identifies the addon set. `<digest>` equals the server's `dw_digest` rule. Absent when the server has no addons. |
| `dwu` | Marks a server that asked not to be listed. Do not show it in a server list. Joining it by address works as usual. |

Responses are cached for 60 seconds. The endpoint answers `503` when the list is not configured and `502` when Steam fails, both with `{ "error": "..." }`.

:::note
A server started with `-nomaster` is not in the list and answers no A2S queries.
:::

### Querying the rules

Send an A2S_RULES request over UDP to the server's `addr`. Deadworks servers answer queries on the game port.

Request format:

| Data | Type | Value |
|---|---|---|
| Prefix | 4 bytes | `FF FF FF FF` |
| Header | byte | `V` (`0x56`) |
| Challenge | 4 bytes | Challenge number, or `FF FF FF FF` to receive one. |

Example first request:

```
FF FF FF FF 56 FF FF FF FF
```

The server answers with the rules or with a challenge. Example challenge response:

```
FF FF FF FF 41 4B A1 D5 22
```

Repeat the request with the 4 challenge bytes:

```
FF FF FF FF 56 4B A1 D5 22
```

:::warning
Steam answers directly on loopback but sends a challenge first on a LAN or public address. A client tested only against `127.0.0.1` never sees the challenge.
:::

Discard a rules response that arrives before the client has echoed a challenge, unless the server is on loopback. UDP source addresses can be forged, and the challenge is the only proof that the sender saw the request. Without this check, anyone who knows a server's address can answer for it and name their own download host. Send each request again if no response arrives; one lost datagram otherwise reads as a server that advertises nothing.

Response format:

| Data | Type | Value |
|---|---|---|
| Prefix | 4 bytes | `FF FF FF FF` |
| Header | byte | `E` (`0x45`) |
| Rules | 16-bit unsigned, little endian | Number of rules in the response. |
| Name | string | Name of the rule, terminated by `0x00`. Repeated for every rule. |
| Value | string | Value of the rule, terminated by `0x00`. Repeated for every rule. |

- A Deadworks server keeps its reply in one packet. A split reply, with prefix `FE FF FF FF`, needs no support.
- Treat no reply as "does not advertise". The Deadworks launcher waits 1.5 seconds.
- Do not depend on the order of the rules.

### Rules reference

| Key | Value |
|---|---|
| `dw_ver` | `1`. Ignore every other key when this is missing or different. |
| `dw_addons` | Lists the content addons as comma-separated [entries](#entries), in mount order. |
| `dw_addons_n` | Number of addons the server has. |
| `dw_maps` | Lists the maps as comma-separated [entries](#entries): the current map first, then the host's extra maps. |
| `dw_maps_n` | Number of maps the server has. |
| `dw_digest` | 8 hex digits that identify the addon set. Empty when the server has no addons. |
| `dw_fastdl` | Base URL to download content from. Absent when the host set no valid URL. |

Example reply:

```
dw_ver       1
dw_addons    turbo:9330149c74886724:11965
dw_addons_n  1
dw_maps      dl_midtown:faf73184b902d52d:1053579891
dw_maps_n    1
dw_digest    8a1b839d
dw_fastdl    https://dl.example.com/deadworks
```

#### Entries

An entry has the form `name[:hash[:size]]`.

| Part | Description |
|---|---|
| `name` | File name without the `.vpk` extension. |
| `hash` | First 16 lowercase hex digits of the SHA-256 of the uncompressed `.vpk` the server loads. |
| `size` | Length of that uncompressed `.vpk` in bytes, in decimal. |

An entry with no `hash` is a file the server could not read. It cannot be downloaded or verified. Skip it.

#### Validating the rules

Every value is untrusted input. Check each part before using it in a path or a URL:

| Part | Accept only |
|---|---|
| `name` | 1 to 64 characters from `a-z`, `0-9` and `_`. Not a Windows device name: `con`, `prn`, `aux`, `nul`, `com1` to `com9`, `lpt1` to `lpt9`. |
| `hash` | Exactly 16 characters from `0-9` and `a-f`. |
| `size` | Decimal digits only, within 64 bits. |
| `dw_fastdl` | An absolute `http://` or `https://` URL with a host and no credentials, query string or fragment. Remove surrounding whitespace and trailing `/`. |

Skip an entry that fails any check. Treat an invalid `dw_fastdl` as absent.

#### Incomplete lists

`dw_addons` holds at most 640 characters and `dw_maps` at most 300. The whole reply has to fit one datagram, because Steam sends nothing for a larger one. A server with more content drops whole entries from the end. A list with fewer entries than its `_n` key is incomplete, and the missing entries cannot be learned from the server. The Deadworks launcher installs the entries that are listed.

#### Digest

`dw_digest` is the first 8 hex digits of the SHA-256 of the server's addon entries, each lowercased, sorted by byte value and joined with `,`:

```
dw_addons  ware,turbo:9330149c74886724:11965
canonical  turbo:9330149c74886724:11965,ware
dw_digest  cce084bf
```

Two servers have the same digest only when their addon files are identical.

:::note
The digest covers every addon the server has, including entries dropped from an incomplete `dw_addons`. It cannot be recomputed from an incomplete list.
:::

### Downloading

Every file is a bzip2-compressed `.vpk`:

```
{dw_fastdl}/addons/{name}_{hash}.vpk.bz2
{dw_fastdl}/maps/{name}_{hash}.vpk.bz2
```

For the example reply above:

```
https://dl.example.com/deadworks/addons/turbo_9330149c74886724.vpk.bz2
https://dl.example.com/deadworks/maps/dl_midtown_faf73184b902d52d.vpk.bz2
```

- Skip the download when the installed file already matches: its length equals `size` and its SHA-256 starts with `hash`.
- Follow HTTP redirects. `https://api.deadworks.net/fastdl/u/<id>` answers with a `302`.
- Treat `dw_fastdl` as untrusted input. Refuse a loopback, private or link-local address, as the URL, as a redirect target and as the address the host resolves to, unless the game server is itself on the player's network. Otherwise any listed server can make the launcher send requests inside the player's network.
- Check the resolved address before connecting, not after the response. A `GET` has already done its work by the time the response arrives. A resolver that drops local addresses covers the first request and every redirect.
- Set connect and read timeouts and a minimum transfer rate, and cap what one join writes to disk. Count the bytes written, not the advertised sizes: an entry may give no size.
- If the launcher accepts commands over a local port, check the `Host` header. A web page can reach `127.0.0.1` through any DNS name that resolves to it.
- Decode every bzip2 stream in the file. Parallel compressors such as `pbzip2` write several.
- A server with no `dw_fastdl` names no download host.

### Verifying a download

Run every check. The Deadworks launcher uses a hard cap of 4 GiB for both the compressed and the decompressed file.

| Check | Rule | On failure |
|---|---|---|
| Compressed size | Count the bytes received and stop at the hard cap. `Content-Length` is only a claim. | Discard the file. |
| Decompressed size | Stop decompressing at the hard cap. | Discard the file. |
| VPK signature | The decompressed file starts with `34 12 AA 55`. | Discard the file. |
| Advertised size | The decompressed length equals `size`, when the entry has one. Stop decompressing once the output exceeds it. | [Mismatch](#handling-a-mismatch). |
| Advertised hash | The SHA-256 of the decompressed file starts with `hash`. | [Mismatch](#handling-a-mismatch). |

### Handling a mismatch

The hash identifies which build a file is. It is not authentication: one operator chooses both the advertised hash and the download host. A mismatch means the download host is out of date, not that someone is attacking.

1. Fail the install. Tell the player that the download host serves a different build than the server runs, that some custom content may be missing or broken, and that only the server's host can fix it.
2. Let the player cancel or install the host's copy anyway.
3. When the player accepts, install without the advertised size and hash checks. Keep the hard caps and the VPK signature check.
4. Do not record the file as the advertised build. Check again on the next join, so the client picks up the right file once the host is updated.

### Installing

Paths are relative to Deadlock's `game` directory.

| Kind | Install path |
|---|---|
| Addon | `citadel/deadworks_addons/vpks/<name>.vpk` |
| Map | `citadel/maps/<name>.vpk` |

- Install each addon under its advertised name. The server names its addons to the connecting game, which mounts them by that name.
- Never replace a map file the launcher did not install. Keep a map that ships with the game, or one the player placed there, even when its hash differs from the advertised one.
- Write to a temporary file and rename it into place. The rename fails while the game has the old file open.

#### UI bootstrap

The Deadworks in-game UI needs one VPK that no server advertises. Get its manifest:

```
GET https://api.deadworks.net/api/bootstrap
```

```json
{
  "version": 7,
  "compressed_size": 269545,
  "sha256": "f7fee4a45081423923a1414704da8bb96bb1b4a511f8ce23ce16fd81f30b72ac",
  "download_url": "https://api.deadworks.net/api/bootstrap/v/7.vpk.bz2",
  "min_version": 0
}
```

| Field | Description |
|---|---|
| `version` | Version number of the published bootstrap. |
| `compressed_size` | Size of the download in bytes. |
| `sha256` | Full SHA-256 of the decompressed `.vpk`. Discard a download that does not match. |
| `download_url` | URL of the bzip2-compressed `.vpk`. |
| `min_version` | Oldest version allowed to join servers. The Deadworks launcher refuses to connect with an older one installed. `0` allows every version. |

The endpoint answers `404` when no bootstrap is published.

Install the file as `citadel/deadworks_mods/pak01_dir.vpk` before launching the game. Keep no other file ending in `.vpk` in that directory.

:::note
The running game keeps the bootstrap open. Replace it only while the game is closed.
:::

#### gameinfo.gi

Declare both locations in the `SearchPaths` block inside `FileSystem` in `citadel/gameinfo.gi`, above the first `Game` entry:

```
Game        citadel/deadworks_mods
addonroot   citadel/deadworks_addons
```

Add `Mod citadel` and `Write citadel` when the block has no `Mod` or `Write` entry. Without them, the game uses `citadel/deadworks_mods` as its mod and write directory.

- Use exactly this `addonroot` value. The Deadworks launcher replaces any other `addonroot` entry with it.
- Check the entries before every launch. Deadlock Mod Manager rewrites the whole `SearchPaths` block each time it launches the game, and Steam's file verification restores the original file.
- The game reads `gameinfo.gi` at startup. Restart the game after adding the entries.
- Keep your paths away from `citadel/addons`. Deadlock Mod Manager treats any path that starts with it as one of its own profiles.
