---
title: "Project Setup"
sidebar_label: "Project Setup"
---

# Project Setup

This guide walks through installing Deadworks and setting up a Visual Studio project for plugin development.

## Prerequisites

- **.NET 10.0 SDK** (or later)
- **Visual Studio 2022** (17.x+) or any IDE with .NET support
- **Deadlock** installed via Steam

## 1. Install Deadworks

Download the latest release from [https://github.com/Deadworks-net/deadworks/releases](https://github.com/Deadworks-net/deadworks/releases) and extract it into your Deadlock folder (`C:\Program Files (x86)\Steam\steamapps\common\Deadlock`). Building from source is only necessary if you want to contribute to the framework itself.

### Verify Installation

Run the Deadworks executable and check the console for pink-colored output. Look for one of these messages:

- **".NET runtime initialized"** — Deadworks is installed correctly and ready for plugins.
- **"Failed to initialize .NET runtime"** — The .NET 10.0 SDK is missing or not installed correctly.

## 2. Create a Class Library Project

In Visual Studio, create a new **C# Class Library** project. The project name is arbitrary — plugins are discovered by assembly, not by name, so pick whatever you want.

> **Important:** Target **.NET Core** (e.g. `net10.0`), **not** .NET Standard. Deadworks requires a .NET Core runtime.

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
```

## 3. Add API References

Add assembly references to the Deadworks API and Google Protobuf DLLs from your Deadlock installation:

```xml
<ItemGroup>
  <Reference Include="DeadworksManaged.Api">
    <HintPath>C:\Program Files (x86)\Steam\steamapps\common\Deadlock\game\bin\win64\managed\DeadworksManaged.Api.dll</HintPath>
  </Reference>
  <Reference Include="Google.Protobuf">
    <HintPath>C:\Program Files (x86)\Steam\steamapps\common\Deadlock\game\bin\win64\managed\Google.Protobuf.dll</HintPath>
  </Reference>
</ItemGroup>
```

> **Note:** Adjust the `HintPath` if your Steam library is in a different location. The DLLs are also available in the `managed/` folder of this repository.

## 4. Configure Auto-Deploy (Optional)

Add a post-build target to automatically copy your compiled plugin to the game's plugin directory:

```xml
<Target Name="DeployToGame" AfterTargets="Build">
  <ItemGroup>
    <DeployFiles Include="$(OutputPath)YourPlugin.dll;$(OutputPath)YourPlugin.pdb" />
  </ItemGroup>
  <Copy
    SourceFiles="@(DeployFiles)"
    DestinationFolder="C:\Program Files (x86)\Steam\steamapps\common\Deadlock\game\bin\win64\managed\plugins"
    SkipUnchangedFiles="false"
    Retries="0"
    ContinueOnError="WarnAndContinue" />
</Target>
```

## 5. Complete .csproj Example

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <RootNamespace>MyPlugin</RootNamespace>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <Reference Include="DeadworksManaged.Api">
      <HintPath>C:\Program Files (x86)\Steam\steamapps\common\Deadlock\game\bin\win64\managed\DeadworksManaged.Api.dll</HintPath>
    </Reference>
    <Reference Include="Google.Protobuf">
      <HintPath>C:\Program Files (x86)\Steam\steamapps\common\Deadlock\game\bin\win64\managed\Google.Protobuf.dll</HintPath>
    </Reference>
  </ItemGroup>

  <Target Name="DeployToGame" AfterTargets="Build">
    <ItemGroup>
      <DeployFiles Include="$(OutputPath)MyPlugin.dll;$(OutputPath)MyPlugin.pdb" />
    </ItemGroup>
    <Copy
      SourceFiles="@(DeployFiles)"
      DestinationFolder="C:\Program Files (x86)\Steam\steamapps\common\Deadlock\game\bin\win64\managed\plugins"
      SkipUnchangedFiles="false"
      Retries="0"
      ContinueOnError="WarnAndContinue" />
  </Target>
</Project>
```

## Plugin Deployment

Compiled plugin DLLs are loaded from:

```
Deadlock/game/bin/win64/managed/plugins/
```

Copy the full build output — **not just the `.dll`**. The loader uses `.deps.json` to resolve plugin-local dependencies, and `.runtimeconfig.json` describes the runtime target. The typical files you should deploy are:

- `YourPlugin.dll` — the plugin itself
- `YourPlugin.deps.json` — dependency manifest (required if your plugin references anything beyond the Deadworks API)
- `YourPlugin.runtimeconfig.json` — runtime config
- `YourPlugin.pdb` — optional, for stack traces and debugging

Plugins are loaded automatically when the server starts. Editing a plugin DLL while the server is running hot-reloads it.

## Troubleshooting

| Symptom | Solution |
|---------|----------|
| No pink console output at all | Deadworks files not extracted to the correct directory. Verify files exist in `Deadlock/game/bin/win64/` |
| "Failed to initialize .NET runtime" | Install or repair the .NET 10.0 SDK. The message scrolls past quickly — pipe console output to a file (`deadworks.exe > out.log`) if you need to search for it. |
| Plugins folder is silently ignored | The .NET SDK isn't installed or is the wrong version. `[ERR] Failed to initialize .NET runtime` will appear in the log file — install .NET 10 SDK. |
| "Unknown command 'dw_plugin'" | The runtime hasn't loaded — check for errors earlier in the pink console output |
| Plugin shows as enabled but "not loaded" | Make sure both `YourPlugin.deps.json` and `YourPlugin.runtimeconfig.json` are next to the `.dll` in the plugins folder. Also verify you have `OnLoad`/`OnUnload` overrides — they're abstract on `DeadworksPluginBase` and the plugin fails silently without them. |
| No IntelliSense in Visual Studio | Ensure `DeadworksManaged.Api.xml` is in the same folder as the DLL |
| Build targets .NET Standard | Change your project to target `net10.0` (.NET Core), not .NET Standard |

## Next Steps

- [Your First Plugin](first-plugin) — Build a minimal working plugin
- [Plugin Lifecycle](../guides/plugin-lifecycle) — Understand load/unload/hot-reload behavior
