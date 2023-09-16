export const OTEL_CLI_NAME = 'otel-cli';
export const { version: OTEL_CLI_VERSION } = require('../package.json');

export const DEFAULT_SERVER_HOST: string = 'localhost';
export const DEFAULT_SERVER_PORT: number = 7777;

export const RESOURCE_ATTRIBUTES = {
    // Logical name of the service.
    SERVICE_NAME: 'service.name',
    // Name of the host. On Unix systems, it may contain what the hostname command returns,
    // or the fully qualified hostname, or another name specified by the user.
    HOST_NAME: 'host.name',
    // Type of host. For Cloud, this must be the machine type.
    HOST_TYPE: 'host.type',
    // The CPU architecture the host system is running on.
    HOST_ARCH: 'host.arch',
    // The operating system type.
    OS_TYPE: 'os.type',
    // Human readable operating system name.
    OS_NAME: 'os.name',
    // The version string of the operating system
    OS_VERSION: 'os.version',
};

export const SAMPLED_TRACE_FLAG = 0x01;
