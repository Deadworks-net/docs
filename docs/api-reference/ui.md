---
title: "UI Panels"
sidebar_label: "UI Panels"
---

# UI Panels

> **Namespace:** `DeadworksManaged.Api.UI`

Server-controlled Panorama panels. There are two ways to get one on screen:

- **Server-driven** — build the layout in C#. Nothing ships to the player.
- **Client addon** — the player mounts a VPK containing an `.xml` (and optionally a `.js`), and the server tells them which one to load. Use this when you want real styling, images, or client-side logic.

Both address the panel by the same string id and use the same update and event API.

:::note Requires the launcher
UI requires the Deadworks launcher, which loads the addon that carries messages between client and server. Without it the player sees nothing.
:::

## Getting a handle

```csharp
using DeadworksManaged.Api.UI;

UI.Panel("myPanel").Set(controller.Recipients, "score", 42);
```

`UI.Panel(id)` returns a cached `UIPanel`. The id is your contract with the client.

---

## Server-driven UI

### Building a tree

| Factory | Element |
|---------|---------|
| `UI.Container(id?)` | `Panel` |
| `UI.Vertical(id?)` | `Panel`, `flow-children: down` |
| `UI.Horizontal(id?)` | `Panel`, `flow-children: right` |
| `UI.Label(id, text)` | `Label` |
| `UI.Button(id, text)` | `Button` |
| `UI.Image(id, src)` | `Image` |

Fluent on any node: `.WithId(id)`, `.WithStyle(name, value)`, `.WithStyles(params (string,string)[])`, `.Add(params UINode[])`. On a button: `.OnClick(eventName, args…)`.

Styles are Panorama CSS — the same kebab-case names you would write in a `.vcss`. It is **not** web CSS: there is no flexbox and no `display`. Boxes stack with `flow-children: down | right`, position with `horizontal-align` / `vertical-align` plus margins, and fill leftover space with `width: fill-parent-flow(1.0)`. Gradients are `gradient( linear, 0% 0%, 0% 100%, from( #000 ), to( #fff ) )`. Colours take an alpha byte: `#0a0c08e6`.

Images use the mod tree's compiled texture: `file://{images}/<addon>/<file>.vtex`. A `Button` only auto-creates its text Label when it has no children, so add a child `Label` when the inner text needs its own styling.

### Structural ops

| Method | Effect |
|--------|--------|
| `BuildLayout(to, root)` | Send the tree and show it. Clears the panel's existing field values |
| `Precache(to, root)` | Send and cache the tree without showing it |
| `Show(to)` | Show a previously precached panel |
| `DestroyLayout(to)` | Destroy the panel and forget it |
| `AppendChild(to, parentId, child)` | Append a subtree under an existing node id |
| `RemoveChild(to, targetId)` | Remove a child by id |
| `LoadXml(to, xmlPath)` | Load a client addon — see [Client addons](#client-addons) |
| `Reload(to)` | Re-send whatever layout that player last got |

`Precache` once then `Show` is the pattern for a HUD whose structure never changes: the tree ships one time and every later update is text only. `BuildLayout` re-sends the whole tree each call.

`AppendChild` / `RemoveChild` edit a list in place — adding one row costs a fraction of rebuilding the tree.

`Reload` exists for the edit loop: change an addon's files, run it, see the result without restarting the client.

### Field updates

| Method | Behaviour |
|--------|-----------|
| `Set(to, key, value)` | Guaranteed delivery, latest value wins per `(panel, key)` |
| `SetUnreliable(to, key, value)` | May be dropped under load, latest value wins |
| `Clear(to)` | Clears the panel's state |
| `SendRaw(to, text)` | Opaque text to the panel script's `onRaw` — no state, no auto-binding |

**A key matching a Label id updates that Label automatically**, in both server-driven panels and client addons. Keys with no matching Label are still delivered, for a panel script to render itself.

Batch with `Build()`:

```csharp
UI.Panel("hud").Build()
    .Set("timer", "1:24")
    .SetUnreliable("score", "3 - 2")
    .SendTo(controller.Recipients);
```

`UIUpdate` carries `Set`, `SetUnreliable`, `Clear`, `Raw`, `BuildLayout` and `DestroyLayout`. The rest of the structural ops are direct calls on `UIPanel`.

Updates arrive in the order you issue them, and a panel's pending `Set`s always land ahead of the next structural op on that panel.

**Pace recurring updates.** The channel delivers a fixed number of updates per second — `UI.MaxFramesPerSecond` reports it. Sending faster only grows a queue and adds latency. To move more data, put more fields in each update rather than sending more updates.

**Use `SetUnreliable` for values that change every frame**, where a missed update is immediately superseded. On that path send the *full* set of fields every time: if the one update carrying a change is dropped and the value then holds steady, skipping "unchanged" fields leaves the client stale indefinitely.

### Events

```csharp
UI.Panel("menu").On("menuClick", e =>
    UI.Panel("menu").Set(e.Caller.Recipients, "status", $"clicked {e.ArgAt(0)}"));
```

Latest registration for a name wins. Handler exceptions are caught and logged.

`UIEvent`: `Caller` (`CCitadelPlayerController`), `PanelId`, `EventName`, `Args` (`string[]`), `ArgAt(index, fallback = "")`.

---

## Client addons

An addon is a VPK the player mounts. It contains a layout, and usually a script:

```
myaddon/
  panorama/
    layout/killfeed.xml
    scripts/killfeed.js
```

The server names the file and the panel id:

```csharp
UI.Panel("killfeed").LoadXml(controller.Recipients, "file://{resources}/layout/killfeed.xml");
```

From then on the panel behaves like any other: `Set`, `Clear`, `SendRaw`, `On`.

### The panel script

Your layout includes `dw_addon.js` **from the framework**, then your own script:

```xml
<scripts>
    <include src="file://{resources}/scripts/dw_addon.js" />
    <include src="file://{resources}/scripts/killfeed.js" />
</scripts>
```

`dw_addon.js` ships with Deadworks and resolves through the shared resource path. Do not copy it into your VPK — a stale copy will drift from the server it is talking to.

Your script registers a handler. The panel id comes from the server's `UI.Panel(id)`, so you never repeat it:

```js
DW.registerPanel({
    init:      function (panel) { },
    render:    function (panel, state, changed) { },
    onRaw:     function (panel, text) { },
    onDestroy: function (panel) { }
});
```

`init` and `onDestroy` pair up and can fire more than once — the panel is rebuilt on reconnect. `render` receives `changed`, the list of keys this update touched, or `null` meaning assume everything changed.

The `panel` argument:

| | |
|---|---|
| `find(id)` | Find a child by id |
| `text(id, value)` | Set a Label's text |
| `on(id, event, fn)`, `onClick(id, fn)` | Bind a panel event |
| `get(key, fallback)` | Read a state value |
| `num(key, fallback)`, `int(...)`, `bool(...)` | Read it as a number or boolean |
| `set(key, value)` | Local state, never sent to the server |
| `state()` | The whole state dict |
| `refresh()` | Re-render without changing state |
| `send(event, args…)` | Send an event to the server |
| `connected()` | Is a Deadworks server currently talking to us |

### Shipping it

Your addon is a VPK, and the paths inside it are what matter — `panorama/layout/…` and `panorama/scripts/…` at the VPK root, with `{resources}` resolving to `panorama/`.

**It has to be mounted before the game starts.** Panorama initialises early in launch, so nothing can add UI content at runtime.

- **While developing,** put the VPK in `<game>/citadel/deadworks_mods/`. That directory is on the engine's search path, so everything in it mounts at startup. Then iterate with `Reload` — no restart needed unless you change which files exist.
- **To distribute,** publish it in your server's content manifest. The launcher downloads each item into `<game>/citadel/deadworks_addons/vpks/` before joining, so players install nothing by hand.

### Knowing whether it loaded

A player without your VPK cannot load the addon, and the client reports that back:

```csharp
UI.AddonStatusChanged += (slot, panelId, state) => {
    if (state == AddonState.Failed)
        UI.Panel(panelId).BuildLayout(Players.FromSlot(slot).Recipients, Fallback());
};
```

`UI.Addon(slot, panelId)` returns `Unknown`, `Failed`, `Loaded`, or `Ready`. `Loaded` means the layout resolved; `Ready` means its script came up. `UI.AddonReady(slot, panelId)` is shorthand for the last one.

`Unknown` means the player has not answered yet, not that they lack the addon.

---

## Reconnects and resync

**Enqueueing early is safe.** Anything sent before a client's UI is ready is buffered and delivered in order, so `OnClientFullConnect` is a fine place to build a panel.

**Clients can lose their UI.** If updates stop reaching a client for a few seconds, it tears down every panel and asks the server to rebuild. Panels created with `BuildLayout`, `Precache`/`Show` or `LoadXml` are restored automatically, along with the latest value of every field ever set on them. Re-sending is idempotent and no plugin involvement is required.

**Deltas are not restored.** A panel assembled with `AppendChild` / `RemoveChild` comes back as its last full layout, without the incremental children. Rebuild those from `UI.ClientResync`:

```csharp
UI.ClientResync += slot => {
    var controller = Players.FromSlot(slot);
    if (controller != null) RebuildScoreboard(controller);
};
```

**On disconnect,** everything retained for that player is dropped.

---

## When nothing appears

Panorama logs to the in-game console. Work down this list:

| Symptom | Cause |
|---------|-------|
| No `[DW_BOOTSTRAP]` lines at all | The launcher's addon isn't mounted. Nothing else can work. |
| `loadxml failed for '…'` | Your VPK isn't mounted, or the path is wrong. `UI.Addon(...)` reports `Failed`. |
| Layout appears, `[DW_ADDON]` lines don't | Your `<scripts>` block didn't run — check the include paths. |
| `registered:` but never `channel live` | The panel is up but no update has arrived. Check you're sending to the right panel id. |
| Panel appears then vanishes | The client tore down after a few seconds without updates and asked for a resync. |

## Gotchas

- **`Set` after `BuildLayout`, not before.** `BuildLayout` clears the panel's field values on the client.
- **Panels built with `AppendChild` / `RemoveChild` need a `UI.ClientResync` handler.**
- **Avoid `^` followed by a letter or digit** in label text and ids. Those sequences are reserved by the encoding and may come back altered.
- **Drive per-frame updates from `OnGameFrame`, not a timer.** Timers marked `CancelOnMapChange` are cancelled on every `OnStartupServer`, so one registered in `OnLoad` dies at the first map load.

---

## Example: a server-driven panel

```csharp
using DeadworksManaged.Api;
using DeadworksManaged.Api.UI;

public class RoundHud : DeadworksPluginBase {
    public override string Name => "RoundHud";

    static UINode Layout() => UI.Vertical()
        .WithStyle("horizontal-align", "center")
        .WithStyle("vertical-align", "top")
        .WithStyle("margin-top", "24px")
        .WithStyle("padding", "8px 14px")
        .WithStyle("background-color", "#0a0c08e6")
        .WithStyle("border", "1px solid #5FE69E55")
        .Add(
            UI.Label("timer", "0:00")
                .WithStyle("font-size", "20px")
                .WithStyle("color", "#FFEFD7"),
            UI.Label("score", "0 - 0")
                .WithStyle("font-size", "14px")
                .WithStyle("color", "#5FE69E"),
            UI.Button("hideButton", "Hide")
                .WithStyle("margin-top", "6px")
                .OnClick("hide")
        );

    public override void OnLoad(bool isReload) {
        UI.Panel("round").On("hide", e =>
            UI.Panel("round").DestroyLayout(e.Caller.Recipients));
    }

    public override void OnClientFullConnect(ClientFullConnectEvent args) {
        if (args.Controller is { } controller)
            UI.Panel("round").BuildLayout(controller.Recipients, Layout());
    }

    public void Update(RecipientFilter players, string timer, string score) {
        UI.Panel("round").Build()
            .Set("timer", timer)
            .Set("score", score)
            .SendTo(players);
    }
}
```

## Example: a client addon

**`myaddon/panorama/layout/killfeed.xml`**

```xml
<root>
    <scripts>
        <include src="file://{resources}/scripts/dw_addon.js" />
        <include src="file://{resources}/scripts/killfeed.js" />
    </scripts>

    <Panel hittest="false" style="width: 100%; height: 100%;">
        <Panel hittest="true"
               style="horizontal-align: right; vertical-align: top;
                      margin-top: 80px; margin-right: 30px;
                      padding: 8px 12px; flow-children: down;
                      background-color: #0a0c08e6;
                      border: 1px solid #5FE69E55;">
            <Label id="headline" text=""
                   style="font-size: 14px; color: #FFEFD7;" />
            <Label id="tally" text=""
                   style="font-size: 11px; color: #5FE69EAA;" />
            <Button id="clearButton" style="margin-top: 6px; padding: 3px 8px;">
                <Label text="Clear" style="font-size: 10px; color: #CFF7E2;" />
            </Button>
        </Panel>
    </Panel>
</root>
```

**`myaddon/panorama/scripts/killfeed.js`**

```js
DW.registerPanel({
    init: function (panel) {
        panel.onClick("clearButton", function () {
            panel.send("clear");
        });
    },

    render: function (panel) {
        panel.text("tally", panel.int("total") + " kills this round");
    }
});
```

**The plugin**

```csharp
using DeadworksManaged.Api;
using DeadworksManaged.Api.UI;

public class KillFeed : DeadworksPluginBase {
    public override string Name => "KillFeed";

    private int _kills;

    public override void OnLoad(bool isReload) {
        UI.Panel("killfeed").On("clear", e => {
            _kills = 0;
            UI.Panel("killfeed").Clear(RecipientFilter.All);
        });
    }

    public override void OnClientFullConnect(ClientFullConnectEvent args) {
        if (args.Controller is { } controller)
            UI.Panel("killfeed").LoadXml(controller.Recipients,
                "file://{resources}/layout/killfeed.xml");
    }

    [GameEventHandler("player_death")]
    public HookResult OnPlayerDeath(PlayerDeathEvent args) {
        var victim = args.UseridController;
        if (victim == null) return HookResult.Continue;

        var killer = args.AttackerController;
        if (killer == null || killer.Slot == victim.Slot)
            Report($"{victim.PlayerName} died");
        else
            Report($"{killer.PlayerName} killed {victim.PlayerName}");

        return HookResult.Continue;
    }

    private void Report(string headline) {
        UI.Panel("killfeed").Build()
            .Set("headline", headline)
            .Set("total", ++_kills)
            .SendTo(RecipientFilter.All);
    }
}
```

`headline` lands on the Label of the same id with no script involved. `total` has no matching Label, so `render` formats it into `tally`.

## See Also

- [Networking](networking) — raw net messages and `RecipientFilter`
- [Chat & HUD Messaging](../guides/chat-and-hud) — announcements, chat, worldtext
- [Players](players) — `Recipients`, `Slot`, `Players.FromSlot`
