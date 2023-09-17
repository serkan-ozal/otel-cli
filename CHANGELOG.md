# Change Log

All notable changes to this project will be documented in this file. 
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.3.0"></a>
# 1.3.0 (2023-09-17)

### Features

* Introduce `--resource-attributes` (`-ra`) option to the export command for setting resource attributes of the exported span
  
<a name="1.2.0"></a>
# 1.2.0 (2023-09-17)

### Features

* Add `GRPC` protocol support to export spans

<a name="1.1.2"></a>
# 1.1.2 (2023-07-16)

### Fixes

* Fix client blocking by server on trace request export
  
<a name="1.1.1"></a>
# 1.1.1 (2023-07-15)

### Improvements

* Introduce `--traceparent-disable` (`-tpd`) option to the `export` command
  
<a name="1.1.0"></a>
# 1.1.0 (2023-07-14)

### Features

* Add async (non-blocking) transmission support over OTEL CLI server while exporting traces to OTLP endpoint to reduce sync (blocking) transmission overhead

<a name="1.0.1"></a>
# 1.0.1 (2023-07-09)

### Fixes

* Fix key value parsing while handling attributes and headers

### Improvements

* Log uncaught errors occurred while executing commands

<a name="1.0.0"></a>
# 1.0.0 (2023-07-09)

### Features

* Ready to use public release

<a name="0.0.1"></a>
# 0.0.1 (2023-07-09)

### Features

* Initial release
