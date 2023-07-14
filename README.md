# OTEL (OpenTelemetry) CLI

![Build Status](https://github.com/serkan-ozal/otel-cli/actions/workflows/build.yml/badge.svg)
![NPM Version](https://badge.fury.io/js/otel-cli.svg)
![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)

`otel-cli`, an application written in Node.js, is a command-line utility designed to 
send OpenTelemetry traces to an external OpenTelemetry collector OTLP endpoint. 

Its main use case is within shell scripts and other situations 
where trace sending is most efficiently achieved by running an additional program.

## Prerequisites
- Node.js 14+

## Setup

```
npm install -g otel-cli
```

After install, check whether it is installed successfully:
```
otel-cli --version
```
By this command, you should see the installed version number if everything is installed properly.

## Configuration

### Common

| CLI Option                 | Environment Variable | Mandatory | Choices | Description                   |
|----------------------------|----------------------|-----------|---------|-------------------------------|
| - `--version` <br/> - `-V` |                      | NO        |         | Output the CLI version number |
| - `--help`  <br/> - `-h`   |                      | NO        |         | Display help for commands     |

### Commands
- `otel-cli export          [options]`: Create the span by given options and exports the created span to the OTEL collector OTLP endpoint.
- `otel-cli generate-id     [options]`: Generate id of the specified type (`trace` or `span`) and outputs the generated id.
- `otel-cli start-server    [options]`: Starts OTEL CLI server to be able to export traces in background.
- `otel-cli shutdown-server [options]`: Gracefully shutdowns OTEL CLI server by exporting buffered traces before terminate.
- `otel-cli help            [command]`: Display help for the given command.        

### `export` command

| CLI Option                                                                                 | Environment Variable                                                                | Mandatory | Choices                                                                                    | Default Value | Description                                                                                                                                                                                                                                                                                             | Example                                                                                 |
|--------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|-----------|--------------------------------------------------------------------------------------------|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| - `--verbose` <br/> - `-v`                                                                 | `OTEL_CLI_VERBOSE=true`                                                             | NO        |                                                                                            | `false`       | Enable verbose mode                                                                                                                                                                                                                                                                                     | `--verbose`                                                                             |
| - `--endpoint <url>` <br/> - `-e <url>`                                                    | `OTEL_EXPORTER_OTLP_ENDPOINT=<url>`                                                 | NO        |                                                                                            |               | OTEL Exporter OTLP endpoint                                                                                                                                                                                                                                                                             | `--endpoint https://collector.otel.io`                                                  | 
| - `--traces-endpoint <url>` <br/> - `-te <url>`                                            | `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=<url>`                                          | NO        |                                                                                            |               | OTEL Exporter OTLP traces endpoint                                                                                                                                                                                                                                                                      | `--traces-endpoint https://collector.otel.io/v1/traces`                                 | 
| - `--protocol <url>` <br/> - `-p <url>`                                                    | `OTEL_EXPORTER_OTLP_PROTOCOL=<protocol>`                                            | NO        | - `http/json` <br/>                                                                        | `http/json`   | OTEL Exporter OTLP protocol                                                                                                                                                                                                                                                                             | `--protocol http/json`                                                                  | 
| - `--headers <key1=value1> <key2=value2> ...` <br/> - `-h <key1=value1> <key2=value2> ...` | `OTEL_EXPORTER_OTLP_HEADERS=key1=value1>,<key2=value2>`                             | NO        |                                                                                            |               | OTEL Exporter OTLP headers <br/> - In CLI options, headers are specified as space (` `) seperated key-value pairs (`key1=value1 key2=value2 key3=value3`) <br/> - In environment variable, headers are specified as comma (`,`) seperated key-value pairs (`key1=value1,key2=value2,key3=value3`) <br/> | `--headers x-api-key=abcd-1234 x-project-id=efgh-5678`                                  | 
| - `--traceparent <header>` <br/> - `-tp <header>`                                          | `TRACEPARENT=<header>`                                                              | NO        |                                                                                            |               | Traceparent header in W3C trace context format                                                                                                                                                                                                                                                          | `--traceparent 00-84b54e9330faae5350f0dd8673c98146-279fa73bc935cc05-01`                 | 
| - `--traceparent-print` <br/> - `-tpp`                                                     | `OTEL_CLI_TRACEPARENT_PRINT=true`                                                   | NO        |                                                                                            | `false`       | Print traceparent header in W3C trace context format for the exported span (the exported span id will be injected as parent span id in the header)                                                                                                                                                      | `--traceparent-print`                                                                   |
| - `--trace-id <id>` <br/> - `-t <id>`                                                      | `OTEL_CLI_TRACE_ID=<id>`                                                            | NO        |                                                                                            |               | Trace id                                                                                                                                                                                                                                                                                                | `--trace-id 84b54e9330faae5350f0dd8673c98146`                                           | 
| - `--span-id <id>` <br/> - `-s <id>`                                                       |                                                                                     | NO        |                                                                                            |               | Span id                                                                                                                                                                                                                                                                                                 | `--span-id b2746bb26cd13726`                                                            | 
| - `--parent-span-id <id>` <br/> - `-p <id>`                                                |                                                                                     | NO        |                                                                                            |               | Parent span id                                                                                                                                                                                                                                                                                          | `--parent-span-id 279fa73bc935cc05`                                                     | 
| - `--name <name>` <br/> - `-s <name>`                                                      |                                                                                     | YES       |                                                                                            |               | Span name                                                                                                                                                                                                                                                                                               | `--name doPayment`                                                                      | 
| - `--service-name <name>` <br/> - `-sn <name>`                                             | - `OTEL_CLI_SERVICE_NAME=<service-name>` <br/> - `OTEL_SERVICE_NAME=<service-name>` | YES       |                                                                                            |               | Service name                                                                                                                                                                                                                                                                                            | `--service-name payment-service`                                                        |
| - `--kind <kind>` <br/> - `-k <kind>`                                                      |                                                                                     | NO        | - `INTERNAL` <br/> - `SERVER` <br/> - `CLIENT` <br/> - `PRODUCER` <br/> - `CONSUMER` <br/> | `INTERNAL`    | Span kind                                                                                                                                                                                                                                                                                               | - `--kind CLIENT` <br/> - `--kind PRODUCER` <br/> - ... <br/>                           | 
| - `--start-time-nanos <nanos>`                                                             |                                                                                     | NO        |                                                                                            |               | Start time in nanoseconds                                                                                                                                                                                                                                                                               | `--start-time-nanos 1688811191123456789`                                                | 
| - `--start-time-micros <micros>`                                                           |                                                                                     | NO        |                                                                                            |               | Start time in microseconds                                                                                                                                                                                                                                                                              | `--start-time-micros 1688811191123456`                                                  | 
| - `--start-time-millis <millis>`                                                           |                                                                                     | NO        |                                                                                            |               | Start time in milliseconds                                                                                                                                                                                                                                                                              | `--start-time-millis 1688811191123`                                                     | 
| - `--start-time-secs <secs>`                                                               |                                                                                     | NO        |                                                                                            |               | Start time in seconds                                                                                                                                                                                                                                                                                   | `--start-time-secs 1688811191`                                                          | 
| - `--end-time-nanos <nanos>`                                                               |                                                                                     | NO        |                                                                                            |               | End time in nanoseconds                                                                                                                                                                                                                                                                                 | `--end-time-nanos 1688811192123456789`                                                  | 
| - `--end-time-micros <micros>`                                                             |                                                                                     | NO        |                                                                                            |               | End time in microseconds                                                                                                                                                                                                                                                                                | `--end-time-micros 1688811192123456`                                                    | 
| - `--end-time-millis <millis>`                                                             |                                                                                     | NO        |                                                                                            |               | End time in milliseconds                                                                                                                                                                                                                                                                                | `--end-time-millis 1688811192123`                                                       | 
| - `--end-time-secs <secs>`                                                                 |                                                                                     | NO        |                                                                                            |               | End time in seconds                                                                                                                                                                                                                                                                                     | `--start-time-secs 1688811192`                                                          | 
| - `--status-code <code>` <br/> - `-sc <code>`                                              |                                                                                     | NO        | - `UNSET` <br/> - `OK` <br/> - `ERROR`  <br/>                                              | `UNSET`       | Status code                                                                                                                                                                                                                                                                                             | - `--status-code OK` <br/> - `--status-code ERROR` <br/> - ... <br/>                    | 
| - `--status-message <message>` <br/> - `-sm <message>`                                     |                                                                                     | NO        |                                                                                            |               | Status message                                                                                                                                                                                                                                                                                          | `--status-message "Invalid argument"`                                                   | 
| - `--attributes <key-value-pairs...>` <br/> - `-a <key-value-pairs...>`                    |                                                                                     | NO        |                                                                                            |               | Span attributes as space (` `) seperated key-value pairs (`key1=value1 key2=value2 key3=value3`)                                                                                                                                                                                                        | `--attributes key1=value1 key2=\"my value\" key3=true key4=123 key5=67.89 key6=\"456\"` | 
| - `--server-port` <br/> - `-sp <port>`                                                     | `OTEL_CLI_SERVER_PORT=<port>`                                                       | NO        |                                                                                            | `7777`        | OTEL CLI server port for communicating over to export traces asynchronously in background                                                                                                                                                                                                               | - `--server-port 12345` <br/> - `-sp 12345`                                             | 

#### How OTEL Exporter OTLP endpoint resolved?
- If `--traces-endpoint` (or `-te`) option is specified, 
  OTLP endpoint is used from the option value.
- Else, if `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` environment variable is specified, 
  OTLP endpoint is used from the environment variable value.
- Else, if `--endpoint` (or `-e`) option is specified,
  OTLP endpoint is used from the option value by appending `/v1/traces` to the end of the value.
- Else, if `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable is specified,
  OTLP endpoint is used from the environment variable value by appending `/v1/traces` to the end of the value.
- Else, CLI fails with the error (`One of the OTEL Exporter OTLP endpoint or OTEL Exporter OTLP traces endpoint configurations must be specified!`).

#### How trace id is resolved?
- If `--trace-id` (or `-t`) option is specified,
  trace id is used from the option value.
- Else, if `OTEL_CLI_TRACE_ID` environment variable is specified,
  trace id is used from the environment variable value.
- Else, if `--traceparent` option (or `-tp`) is specified,
  trace id is extracted from the traceparent header option value.
- Else, if `TRACEPARENT` environment variable is specified,
  trace id is extracted from the traceparent header environment variable value.
- Else, CLI fails with the error (`Trace id is not specified`).

#### How span id is resolved?
- If `--span-id` (or `-s`) option is specified,
  span id is used from the option value.
- Else, random span id (16-hex-character lowercase string) is generated.

#### How parent span id resolved?
- If `--parent-span-id` (or `-p`) option is specified,
  parent span id is used from the option value.
- Else, if `OTEL_CLI_PARENT_SPAN_ID` environment variable is specified,
  parent span id is used from the environment variable value.
- Else, if `--traceparent` option (or `-tp`) is specified,
  parent span id is extracted from the traceparent header option value.
- Else, if `TRACEPARENT` environment variable is specified,
  parent span id is extracted from the traceparent header environment variable value.
- Else, it is assumed that there is no associated parent span.

#### How start time is resolved?
- If `--start-time-nanos` option is specified,
  start time is used from the option value.
- Else, if `--start-time-micros` option is specified,
  start time is calculated by multiplying the option value by `1000` (to convert microseconds to nanoseconds).
- Else, if `--start-time-millis` option is specified,
  start time is calculated by multiplying the option value by `1000000` (to convert milliseconds to nanoseconds).
- Else, if `--start-time-secs` option is specified,
  start time is calculated by multiplying the option value by `1000000000` (to convert seconds to nanoseconds).
- Else, CLI fails with the error (`Span start time must be specified in one of the supported formats (nanoseconds, microseconds, milliseconds, or seconds)!`).

#### How end time is resolved?
- If `--end-time-nanos` option is specified,
  end time is used from the option value.
- Else, if `--end-time-micros` option is specified,
  end time is calculated by multiplying the option value by `1000` (to convert microseconds to nanoseconds).
- Else, if `--end-time-millis` option is specified,
  end time is calculated by multiplying the option value by `1000000` (to convert milliseconds to nanoseconds).
- Else, if `--end-time-secs` option is specified,
  end time is calculated by multiplying the option value by `1000000000` (to convert seconds to nanoseconds).
- Else, CLI fails with the error (`Span end time must be specified in one of the supported formats (nanoseconds, microseconds, milliseconds, or seconds)!`).

#### How to export traces asynchronously in background?
By default, `export` command sends traces synchronously to the configured OTLP endpoint by blocking the caller in the script.
But OTEL CLI also supports sending traces asynchronously through OTEL CLI server by exporting traces to the OTEL CLI server first over the specified HTTP port.
Then OTEL CLI server buffers the received traces and sends them to the target OTLP endpoint asynchronously in background.

##### Start OTEL CLI server
To be able to start OTEL CLI server, you can use `start-server` [command](#start-server-command).
By default, `start-server` command is blocking, so you should run it in the background yourself to not to block your program/script.

For example, in the Linux and MacOS environments, you can use `&` operation after the command to run it in the background:
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=<YOUR-OTEL-VENDOR-OTLP-ENDPOINT>
export OTEL_EXPORTER_OTLP_HEADERS=<YOUR-OTEL-VENDOR-API-AUTH-HEADER-NAME>=<YOUR-OTEL-VENDOR-API-AUTH-TOKEN>
# OTEL CLI server port is "7777" by default
export OTEL_CLI_SERVER_PORT=12345

# "start-server" command is blocking for the caller.
# So we put "&" at the end of command to run OTEL CLI server in background without blocking here.
otel-cli start-server &
```

or by specifying configurations through the options:
```bash
# "start-server" command is blocking for the caller.
# So we put "&" at the end of command to run OTEL CLI server in background without blocking here.
otel-cli start-server \
  --endpoint <YOUR-OTEL-VENDOR-OTLP-ENDPOINT> \
  --headers <YOUR-OTEL-VENDOR-API-AUTH-HEADER-NAME>=<YOUR-OTEL-VENDOR-API-AUTH-TOKEN> \
  --server-port 12345 \
  &
```

##### Shutdown OTEL CLI server
Since the OTEL CLI server buffers the received traces to be send them asynchronously, 
it should be shutdown gracefully to flush the buffered traces by exporting them to the configured OTLP endpoint before terminated.
Otherwise, some of the traces might be lost.

To be able to shutdown OTEL CLI server gracefully, you can use `shutdown-server` [command](#shutdown-server-command)
by specifying the **same** port number you use while starting server.

```bash
# OTEL CLI server port is "7777" by default
export OTEL_CLI_SERVER_PORT=12345

otel-cli shutdown-server
```

or by specifying configurations through the options:
```bash
otel-cli shutdown-server --server-port 12345
```

> :warning:
Even you don't shutdown the server manually by yourself, 
OTEL CLI server shutdown itself automatically when the parent process (program or script) exits.
But in any way, it is good practice to shutdown by yourself explicitly.

### `generate-id` command

| CLI Option                                  | Environment Variable    | Mandatory | Choices                 | Default Value | Description                    | Example                                |
|---------------------------------------------|-------------------------|-----------|-------------------------|---------------|--------------------------------|----------------------------------------|
| - `--verbose` <br/> - `-v`                  | `OTEL_CLI_VERBOSE=true` | NO        |                         | `false`       | Enables verbose mode           | `--verbose`                            |
| - `--type <id-type>` <br/> - `-t <id-type>` |                         | YES       | - `trace` <br> - `span` |               | Type of the id to be generated | - `--type trace` <br/> - `--type span` | 

### `start-server` command

| CLI Option                                                                                 | Environment Variable                                                                | Mandatory | Choices                                                                                    | Default Value | Description                                                                                                                                                                                                                                                                                             | Example                                                                                 |
|--------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|-----------|--------------------------------------------------------------------------------------------|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| - `--verbose` <br/> - `-v`                                                                 | `OTEL_CLI_VERBOSE=true`                                                             | NO        |                                                                                            | `false`       | Enable verbose mode                                                                                                                                                                                                                                                                                     | `--verbose`                                                                             |
| - `--endpoint <url>` <br/> - `-e <url>`                                                    | `OTEL_EXPORTER_OTLP_ENDPOINT=<url>`                                                 | NO        |                                                                                            |               | OTEL Exporter OTLP endpoint                                                                                                                                                                                                                                                                             | `--endpoint https://collector.otel.io`                                                  | 
| - `--traces-endpoint <url>` <br/> - `-te <url>`                                            | `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=<url>`                                          | NO        |                                                                                            |               | OTEL Exporter OTLP traces endpoint                                                                                                                                                                                                                                                                      | `--traces-endpoint https://collector.otel.io/v1/traces`                                 | 
| - `--protocol <url>` <br/> - `-p <url>`                                                    | `OTEL_EXPORTER_OTLP_PROTOCOL=<protocol>`                                            | NO        | - `http/json` <br/>                                                                        | `http/json`   | OTEL Exporter OTLP protocol                                                                                                                                                                                                                                                                             | `--protocol http/json`                                                                  | 
| - `--headers <key1=value1> <key2=value2> ...` <br/> - `-h <key1=value1> <key2=value2> ...` | `OTEL_EXPORTER_OTLP_HEADERS=key1=value1>,<key2=value2>`                             | NO        |                                                                                            |               | OTEL Exporter OTLP headers <br/> - In CLI options, headers are specified as space (` `) seperated key-value pairs (`key1=value1 key2=value2 key3=value3`) <br/> - In environment variable, headers are specified as comma (`,`) seperated key-value pairs (`key1=value1,key2=value2,key3=value3`) <br/> | `--headers x-api-key=abcd-1234 x-project-id=efgh-5678`                                  | 
| - `--server-port` <br/> - `-sp <port>`                                                     | `OTEL_CLI_SERVER_PORT=<port>`                                                       | NO        |                                                                                            | `7777`        | OTEL CLI server port to start on                                                                                                                                                                                                                                                                        | - `--server-port 12345` <br/> - `-sp 12345`                                             | 

### `shutdown-server` command

| CLI Option                                                                                 | Environment Variable                                                                | Mandatory | Choices                                                                                    | Default Value | Description                                                        | Example                                                                                 |
|--------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|-----------|--------------------------------------------------------------------------------------------|---------------|--------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| - `--verbose` <br/> - `-v`                                                                 | `OTEL_CLI_VERBOSE=true`                                                             | NO        |                                                                                            | `false`       | Enable verbose mode                                                | `--verbose`                                                                             |
| - `--server-port` <br/> - `-sp <port>`                                                     | `OTEL_CLI_SERVER_PORT=<port>`                                                       | NO        |                                                                                            | `7777`        | OTEL CLI server port for communicating over to shutdown gracefully | - `--server-port 12345` <br/> - `-sp 12345`                                             | 

## Examples

#### Export trace [Linux]
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=<YOUR-OTEL-VENDOR-OTLP-ENDPOINT>
export OTEL_EXPORTER_OTLP_HEADERS=<YOUR-OTEL-VENDOR-API-AUTH-HEADER-NAME>=<YOUR-OTEL-VENDOR-API-AUTH-TOKEN>
export OTEL_SERVICE_NAME=build
export OTEL_CLI_TRACE_ID=$(otel-cli generate-id -t trace)

# 1. Build auth service
########################################

# Get start time of auth service project build process in nanoseconds
start_time=$(date +%s%9N)

# Build auth service project
pushd auth-service
mvn clean package
popd

# Get end time of auth service project build process in nanoseconds
end_time=$(date +%s%9N)

# Export span of the auth service build process
otel-cli export \
  --name build-auth-service --start-time-nanos ${start_time} --end-time-nanos ${end_time} \
  --kind INTERNAL --status-code OK --attributes serviceName=auth-service buildTool=maven runtime=java

########################################

# 2. Build payment service
########################################

# Get start time of payment service project build process in nanoseconds
start_time=$(date +%s%9N)

# Build payment service project
pushd payment-service
npm run build
popd

# Get end time of payment service project build process in nanoseconds
end_time=$(date +%s%9N)

# Export span of the payment service project build process
otel-cli export \
  --name build-payment-service --start-time-nanos ${start_time} --end-time-nanos ${end_time} \
  --kind INTERNAL --status-code OK --attributes serviceName=payment-service buildTool=npm runtime=node

########################################  
```

#### Export trace [MacOS]
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=<YOUR-OTEL-VENDOR-OTLP-ENDPOINT>
export OTEL_EXPORTER_OTLP_HEADERS=<YOUR-OTEL-VENDOR-API-AUTH_HEADER_NAME>=<YOUR-OTEL-VENDOR-API-AUTH_TOKEN>
export OTEL_SERVICE_NAME=build
export OTEL_CLI_TRACE_ID=$(otel-cli generate-id -t trace)

# 1. Build auth service
########################################

# Get start time of auth service project build process in milliseconds ("date" command only support second resolution in MacOS)
start_time=$(node -e 'console.log(Date.now())')

# Build auth service project
pushd auth-service
mvn clean package
popd

# Get end time of auth service project build process in milliseconds ("date" command only support second resolution in MacOS)
end_time=$(node -e 'console.log(Date.now())')

# Export span of the auth service build process
otel-cli export \
  --name build-auth-service --start-time-millis ${start_time} --end-time-millis ${end_time} \
  --kind INTERNAL --status-code OK --attributes serviceName=auth-service buildTool=maven runtime=java

########################################

# 1. Build payment service
########################################

# Get start time of payment service project build process in milliseconds ("date" command only support second resolution in MacOS)
start_time=$(node -e 'console.log(Date.now())')

# Build payment service project
pushd payment-service
npm run build
popd

# Get end time of payment service project build process in milliseconds ("date" command only support second resolution in MacOS)
end_time=$(node -e 'console.log(Date.now())')

# Export span of the payment service project build process
otel-cli export \
  --name build-payment-service --start-time-millis ${start_time} --end-time-millis ${end_time} \
  --kind INTERNAL --status-code OK --attributes serviceName=payment-service buildTool=npm runtime=node

########################################

```

#### Export trace (Parent-Child) [Linux]
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=<YOUR-OTEL-VENDOR-OTLP-ENDPOINT>
export OTEL_EXPORTER_OTLP_HEADERS=<YOUR-OTEL-VENDOR-API-AUTH_HEADER_NAME>=<YOUR-OTEL-VENDOR-API-AUTH_TOKEN>
export OTEL_SERVICE_NAME=build
export OTEL_CLI_TRACE_ID=$(otel-cli generate-id -t trace)

# 1. Build services
################################################################################

root_span_id=$(otel-cli generate-id -t span)

# Get start time of whole build process in nanoseconds
start_time0=$(date +%s%9N)

# 1.1. Build auth service
########################################

# Get start time of auth service project build process in nanoseconds
start_time1=$(date +%s%9N)

# Build auth service project
pushd auth-service
mvn clean package
popd

# Get end time of auth service project build process in nanoseconds
end_time1=$(date +%s%9N)

# Export span of the auth service project build process
otel-cli export \
  --name build-auth-service --parent-span-id ${root_span_id} --start-time-nanos ${start_time1} --end-time-nanos ${end_time1} \
  --kind INTERNAL --status-code OK --attributes serviceName=auth-service buildTool=maven runtime=java  

########################################

# 1.2. Build payment service
########################################

# Get start time of payment service project build process in nanoseconds
start_time2=$(date +%s%9N)

# Build payment service project
pushd payment-service
npm run build
popd

# Get end time of payment service project build process in nanoseconds
end_time2=$(date +%s%9N)

# Export span of the payment service project build process
otel-cli export \
  --name build-payment-service --parent-span-id ${root_span_id} --start-time-millis ${start_time2} --end-time-millis ${end_time2} \
  --kind INTERNAL --status-code OK --attributes serviceName=payment-service buildTool=npm runtime=node
  
########################################

# Get end time of whole build process in nanoseconds
end_time0=$(date +%s%9N)

# Export span of the whole build process
otel-cli export \
  --name build-services --span-id ${root_span_id} --start-time-millis ${start_time0} --end-time-millis ${end_time0} \
  --kind INTERNAL --status-code OK

################################################################################
```

#### Export trace (Parent-Child) [MacOS]
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=<YOUR-OTEL-VENDOR-OTLP-ENDPOINT>
export OTEL_EXPORTER_OTLP_HEADERS=<YOUR-OTEL-VENDOR-API-AUTH_HEADER_NAME>=<YOUR-OTEL-VENDOR-API-AUTH_TOKEN>
export OTEL_SERVICE_NAME=build
export OTEL_CLI_TRACE_ID=$(otel-cli generate-id -t trace)

# 1. Build services
################################################################################

root_span_id=$(otel-cli generate-id -t span)

# Get start time of whole build process in milliseconds ("date" command only support second resolution in MacOS)
start_time0=$(node -e 'console.log(Date.now())')

# 1.1. Build auth service
########################################

# Get start time of auth service project build process in milliseconds ("date" command only support second resolution in MacOS)
start_time1=$(node -e 'console.log(Date.now())')

# Build auth service project
pushd auth-service
mvn clean package
popd

# Get end time of auth service project build process in milliseconds ("date" command only support second resolution in MacOS)
end_time1=$(node -e 'console.log(Date.now())')

# Export span of the auth service project build process
otel-cli export \
  --name build-auth-service --parent-span-id ${root_span_id} --start-time-millis ${start_time1} --end-time-millis ${end_time1} \
  --kind INTERNAL --status-code OK --attributes serviceName=auth-service buildTool=maven runtime=java  

########################################

# 1.2. Build payment service
########################################

# Get start time of payment service project build process in milliseconds ("date" command only support second resolution in MacOS)
start_time2=$(node -e 'console.log(Date.now())')

# Build payment service project
pushd payment-service
npm run build
popd

# Get end time of payment service project build process in milliseconds ("date" command only support second resolution in MacOS)
end_time2=$(node -e 'console.log(Date.now())')

# Export span of the payment service project build process
otel-cli export \
  --name build-payment-service --parent-span-id ${root_span_id} --start-time-millis ${start_time2} --end-time-millis ${end_time2} \
  --kind INTERNAL --status-code OK --attributes serviceName=payment-service buildTool=npm runtime=node
  
########################################

# Get end time of whole build process in milliseconds ("date" command only support second resolution in MacOS)
end_time0=$(node -e 'console.log(Date.now())')

# Export span of the whole build process
otel-cli export \
  --name build-services --span-id ${root_span_id} --start-time-millis ${start_time0} --end-time-millis ${end_time0} \
  --kind INTERNAL --status-code OK

################################################################################
```

#### Export trace asynchronously in background [Linux]
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=<YOUR-OTEL-VENDOR-OTLP-ENDPOINT>
export OTEL_EXPORTER_OTLP_HEADERS=<YOUR-OTEL-VENDOR-API-AUTH-HEADER-NAME>=<YOUR-OTEL-VENDOR-API-AUTH-TOKEN>
export OTEL_SERVICE_NAME=build
# Specify port number to start server port on (the default value is "7777") 
# to be used by "otel-cli server-start" command.
# Additionally, this environment variable will also be picked up by "otel-cli export" command automatically 
# while exporting traces to send asynchronously over OTEL CLI server.
export OTEL_CLI_SERVER_PORT=12345
export OTEL_CLI_TRACE_ID=$(otel-cli generate-id -t trace)

# "start-server" command is blocking for the caller.
# So we put "&" at the end of command to run OTEL CLI server in background without blocking here.
otel-cli start-server &

function shutdown_server {
  # Shutdown OTEL CLI server.
  # 
  # Note: 
  #     Even we don't shutdown manually, OTEL CLI server shutdown itself automatically 
  #     when this bash process (its parent process) exits.
  #     But in any way, it is good practice to shutdown by ourself explicitly.
  otel-cli shutdown-server
}
trap shutdown_server EXIT

# 1. Build auth service
########################################

# Get start time of auth service project build process in nanoseconds
start_time=$(date +%s%9N)

# Build auth service project
pushd auth-service
mvn clean package
popd

# Get end time of auth service project build process in nanoseconds
end_time=$(date +%s%9N)

# Export span of the auth service build process
otel-cli export \
  --name build-auth-service --start-time-nanos ${start_time} --end-time-nanos ${end_time} \
  --kind INTERNAL --status-code OK --attributes serviceName=auth-service buildTool=maven runtime=java

########################################

# 2. Build payment service
########################################

# Get start time of payment service project build process in nanoseconds
start_time=$(date +%s%9N)

# Build payment service project
pushd payment-service
npm run build
popd

# Get end time of payment service project build process in nanoseconds
end_time=$(date +%s%9N)

# Export span of the payment service project build process
otel-cli export \
  --name build-payment-service --start-time-nanos ${start_time} --end-time-nanos ${end_time} \
  --kind INTERNAL --status-code OK --attributes serviceName=payment-service buildTool=npm runtime=node

########################################  
```

#### Export trace asynchronously in background [MacOS]
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=<YOUR-OTEL-VENDOR-OTLP-ENDPOINT>
export OTEL_EXPORTER_OTLP_HEADERS=<YOUR-OTEL-VENDOR-API-AUTH-HEADER-NAME>=<YOUR-OTEL-VENDOR-API-AUTH-TOKEN>
export OTEL_SERVICE_NAME=build
# Specify port number to start server port on (the default value is "7777") 
# to be used by "otel-cli server-start" command.
# Additionally, this environment variable will also be picked up by "otel-cli export" command automatically 
# while exporting traces to send asynchronously over OTEL CLI server.
export OTEL_CLI_SERVER_PORT=12345
export OTEL_CLI_TRACE_ID=$(otel-cli generate-id -t trace)

# "start-server" command is blocking for the caller.
# So we put "&" at the end of command to run OTEL CLI server in background without blocking here.
otel-cli start-server &

function shutdown_server {
  # Shutdown OTEL CLI server.
  # 
  # Note: 
  #     Even we don't shutdown manually, OTEL CLI server shutdown itself automatically 
  #     when this bash process (its parent process) exits.
  #     But in any way, it is good practice to shutdown by ourself explicitly.
  otel-cli shutdown-server
}
trap shutdown_server EXIT

# 1. Build auth service
########################################

# Get start time of auth service project build process in milliseconds ("date" command only support second resolution in MacOS)
start_time=$(node -e 'console.log(Date.now())')

# Build auth service project
pushd auth-service
mvn clean package
popd

# Get end time of auth service project build process in milliseconds ("date" command only support second resolution in MacOS)
end_time=$(node -e 'console.log(Date.now())')

# Export span of the auth service build process
otel-cli export \
  --name build-auth-service --start-time-millis ${start_time} --end-time-millis ${end_time} \
  --kind INTERNAL --status-code OK --attributes serviceName=auth-service buildTool=maven runtime=java

########################################

# 1. Build payment service
########################################

# Get start time of payment service project build process in milliseconds ("date" command only support second resolution in MacOS)
start_time=$(node -e 'console.log(Date.now())')

# Build payment service project
pushd payment-service
npm run build
popd

# Get end time of payment service project build process in milliseconds ("date" command only support second resolution in MacOS)
end_time=$(node -e 'console.log(Date.now())')

# Export span of the payment service project build process
otel-cli export \
  --name build-payment-service --start-time-millis ${start_time} --end-time-millis ${end_time} \
  --kind INTERNAL --status-code OK --attributes serviceName=payment-service buildTool=npm runtime=node

########################################
```

## Roadmap
- Automated bash command tracing by wrapping command to be executed
- `http/protobuf` support as OTLP protocol
- `grpc` support as OTLP protocol
- Batch transmission support while sending traces to OTLP endpoint to reduce network RTT (Round Trip Time)

## Issues and Feedback

[![Issues](https://img.shields.io/github/issues/serkan-ozal/otel-cli.svg)](https://github.com/serkan-ozal/otel-cli/issues?q=is%3Aopen+is%3Aissue)
[![Closed issues](https://img.shields.io/github/issues-closed/serkan-ozal/otel-cli.svg)](https://github.com/serkan-ozal/otel-cli/issues?q=is%3Aissue+is%3Aclosed)

Please use [GitHub Issues](https://github.com/serkan-ozal/otel-cli/issues) for any bug report, feature request and support.

## Contribution

[![Pull requests](https://img.shields.io/github/issues-pr/serkan-ozal/otel-cli.svg)](https://github.com/serkan-ozal/otel-cli/pulls?q=is%3Aopen+is%3Apr)
[![Closed pull requests](https://img.shields.io/github/issues-pr-closed/serkan-ozal/otel-cli.svg)](https://github.com/serkan-ozal/otel-cli/pulls?q=is%3Apr+is%3Aclosed)
[![Contributors](https://img.shields.io/github/contributors/serkan-ozal/otel-cli.svg)]()

If you would like to contribute, please
- Fork the repository on GitHub and clone your fork.
- Create a branch for your changes and make your changes on it.
- Send a pull request by explaining clearly what is your contribution.

> Tip:
> Please check the existing pull requests for similar contributions and
> consider submit an issue to discuss the proposed feature before writing code.

## License

Licensed under [Apache License 2.0](LICENSE).
