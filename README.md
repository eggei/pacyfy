oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g pacyfy
$ pacyfy COMMAND
running command...
$ pacyfy (--version)
pacyfy/0.0.0 darwin-x64 node-v18.16.0
$ pacyfy --help [COMMAND]
USAGE
  $ pacyfy COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`pacyfy hello PERSON`](#pacyfy-hello-person)
* [`pacyfy hello world`](#pacyfy-hello-world)
* [`pacyfy help [COMMANDS]`](#pacyfy-help-commands)
* [`pacyfy plugins`](#pacyfy-plugins)
* [`pacyfy plugins:install PLUGIN...`](#pacyfy-pluginsinstall-plugin)
* [`pacyfy plugins:inspect PLUGIN...`](#pacyfy-pluginsinspect-plugin)
* [`pacyfy plugins:install PLUGIN...`](#pacyfy-pluginsinstall-plugin-1)
* [`pacyfy plugins:link PLUGIN`](#pacyfy-pluginslink-plugin)
* [`pacyfy plugins:uninstall PLUGIN...`](#pacyfy-pluginsuninstall-plugin)
* [`pacyfy plugins:uninstall PLUGIN...`](#pacyfy-pluginsuninstall-plugin-1)
* [`pacyfy plugins:uninstall PLUGIN...`](#pacyfy-pluginsuninstall-plugin-2)
* [`pacyfy plugins update`](#pacyfy-plugins-update)

## `pacyfy hello PERSON`

Say hello

```
USAGE
  $ pacyfy hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/eggei/pacyfy/blob/v0.0.0/dist/commands/hello/index.ts)_

## `pacyfy hello world`

Say hello world

```
USAGE
  $ pacyfy hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ pacyfy hello world
  hello world! (./src/commands/hello/world.ts)
```

## `pacyfy help [COMMANDS]`

Display help for pacyfy.

```
USAGE
  $ pacyfy help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for pacyfy.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.9/src/commands/help.ts)_

## `pacyfy plugins`

List installed plugins.

```
USAGE
  $ pacyfy plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ pacyfy plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.4.7/src/commands/plugins/index.ts)_

## `pacyfy plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ pacyfy plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ pacyfy plugins add

EXAMPLES
  $ pacyfy plugins:install myplugin 

  $ pacyfy plugins:install https://github.com/someuser/someplugin

  $ pacyfy plugins:install someuser/someplugin
```

## `pacyfy plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ pacyfy plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ pacyfy plugins:inspect myplugin
```

## `pacyfy plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ pacyfy plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ pacyfy plugins add

EXAMPLES
  $ pacyfy plugins:install myplugin 

  $ pacyfy plugins:install https://github.com/someuser/someplugin

  $ pacyfy plugins:install someuser/someplugin
```

## `pacyfy plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ pacyfy plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ pacyfy plugins:link myplugin
```

## `pacyfy plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ pacyfy plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ pacyfy plugins unlink
  $ pacyfy plugins remove
```

## `pacyfy plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ pacyfy plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ pacyfy plugins unlink
  $ pacyfy plugins remove
```

## `pacyfy plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ pacyfy plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ pacyfy plugins unlink
  $ pacyfy plugins remove
```

## `pacyfy plugins update`

Update installed plugins.

```
USAGE
  $ pacyfy plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
