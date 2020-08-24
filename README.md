# script-exporter
Shell Script Prometheus Exporter

Just put the `*.sh` into `script` folder and run.

Scripts in `scripts` folder are automatically executed every 5 seconds and outputs are exported via http server.

Here is part of the `smartmon.sh` script output.
```
# HELP smartmon_smartctl_version SMART metric smartctl_version
# TYPE smartmon_smartctl_version gauge
smartmon_smartctl_version{version="6.6"} 1
```
... And this output is hosted through `9109` port.

<br>

## Table of contents
* [Installation](#installation)
  * [docker](#docker)
  * [docker-compose](#docker-compose)
* [Configure](#configure)
* [Recommended Scripts](#recommended-scripts)
* [Example for S.M.A.R.T Exporter](#example-for-smart-exporter)
* [Update packages](#update-packages)

<br>

## Installation
### docker
```bash
docker run -d \
	--name script-exporter \
  --restart unless-stopped \
	-p 9109:9109 \
	-v $PWD/scripts:/scripts \
	solo5star/script-exporter
```

### docker-compose
```yml
version: "3"
services:
  script-exporter:
    container_name: script-exporter
    image: solo5star/script-exporter
    restart: unless-stopped
    ports:
      - 9109:9109
    volumes:
      - $PWD/scripts:/scripts
```

<br>

## Configure
Config file is not supported. Only Environment variables are supported.

|Environment Variable|Description|Default|
|-|-|-|
|**HOST**|Address to bind|`0.0.0.0`|
|**PORT**|Port number to listen|`9109`|
|**SCRIPTS_DIRECTORY**|Directory to use custom scripts|`./scripts`|
|**COLLECT_INTERVAL**|Interval of execute scripts and collect metrics|`5000` (ms)|
|**REQUIRE_PACKAGES**|Linux packages to install. Each packages are separated by space (` `). e.g. `smartmontools` for `smartmon.sh`||

<br>

## Recommended Scripts
[node-exporter-textfile-collector-scripts](https://github.com/prometheus-community/node-exporter-textfile-collector-scripts)

<br>

## Example for S.M.A.R.T Exporter
Download `smartmon.sh` from above link and move the script into `scripts` folder.
```yml
version: "3"
services:
  script-exporter:
    container_name: script-exporter
    image: solo5star/script-exporter
    restart: unless-stopped
    # privileged requires to read disk S.M.A.R.T information
    privileged: true
    ports:
      - 9109:9109
    volumes:
      - $PWD/scripts:/scripts
      - /sys:/sys:ro
      - /dev/disk:/dev/disk:ro
    environment:
      - REQUIRE_PACKAGES=smartmontools
```

<br>

## Update packages 
`apt update` is called once when `Dockerfile` is built.

If you have to update packages, Run `apt update` inside a docker container.
```bash
docker exec script-exporter apt update
```