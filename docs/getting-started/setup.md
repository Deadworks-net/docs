---
title: "Project Setup"
sidebar_label: "Project Setup"
---

# Project Setup

This guide walks through installing Deadworks and setting up a Visual Studio project for plugin development.

## Prerequisites

- **.NET 10.0 SDK** (or later) - https://dotnet.microsoft.com/en-us/download
- **Visual Studio** any IDE with .NET support - https://visualstudio.microsoft.com/
- **Deadlock** installed via Steam


## 0. Install Deadlock

You can use your locally installed version of Deadlock, but for running a server, it's recommended to follow the [server hosting instructions](../guides/server-hosting.md).


## 1. Install Deadworks

Download the latest release from [https://github.com/Deadworks-net/deadworks/releases](https://github.com/Deadworks-net/deadworks/releases) and extract it into your Deadlock folder (`C:\Program Files (x86)\Steam\steamapps\common\Deadlock`).








## 2. Create a Class Library Project

In Visual Studio, create a new **C# Class Library** project. The project name can be anything, so pick whatever you want.


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


Copy the full build output to the `Deadlock/game/bin/win64/managed/plugins/` folder




Plugins are loaded automatically when the server starts. Editing a plugin DLL while the server is running hot-reloads it.


## Troubleshooting

| Symptom | Solution |
|---------|----------|
| No pink console output at all | Deadworks files not extracted to the correct directory. Verify files exist in `Deadlock/game/bin/win64/` |
| "Failed to initialize .NET runtime" | Install or repair the .NET 10.0 SDK. |
| Plugins folder is silently ignored | The .NET SDK isn't installed or is the wrong version. |
| "Unknown command 'dw_plugin'" | The runtime hasn't loaded, check for errors earlier in the pink console output |
| No IntelliSense in Visual Studio | Ensure `DeadworksManaged.Api.xml` is in the same folder as the Deadworks DLL |
| Build targets .NET Standard | Change your project to target `net10.0` (.NET Core), not .NET Standard |






## Next Steps

- [Your First Plugin](first-plugin) — Build a minimal working plugin
- [Plugin Lifecycle](../guides/plugin-lifecycle) — Understand load/unload/hot-reload behavior
