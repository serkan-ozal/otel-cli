import {
    startServer,
    createServerController,
    ServerController,
} from './server';
import * as logger from '../logger';
import { exit } from '../exit';
import { parseKeyValue } from '../utils';
import { startServerCleaner } from './cleaner';
import { DEFAULT_SERVER_PORT } from '../constants';

const SERVER_HOST: string = 'localhost';
const SERVER_PORT: number =
    parseInt(process.env.OTEL_CLI_SERVER_PORT || '') || DEFAULT_SERVER_PORT;
const PARENT_PROC_ID: number = parseInt(process.env.OTEL_CLI_SERVER_PPID || '');

function _createServerController(): ServerController | undefined {
    const exporterOTLPProtocol: string | undefined =
        process.env.OTEL_EXPORTER_OTLP_PROTOCOL;
    const exporterOTLPTracesEndpoint: string | undefined =
        process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    const exporterOTLPHeaderValues: string[] = process.env
        .OTEL_EXPORTER_OTLP_HEADERS
        ? process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',')
        : [];
    const exporterOTLPHeaders: Map<string, string> = parseKeyValue(
        exporterOTLPHeaderValues
    );

    if (!exporterOTLPProtocol) {
        logger.error('OTEL Exporter OTLP protocol was not specified');
        exit(1);
        return;
    }

    if (!exporterOTLPTracesEndpoint) {
        logger.error('OTEL Exporter OTLP traces endpoint was not specified');
        exit(1);
        return;
    }

    return createServerController(
        exporterOTLPProtocol,
        exporterOTLPTracesEndpoint,
        exporterOTLPHeaders
    );
}

async function _start() {
    const serverController: ServerController | undefined =
        _createServerController();
    if (!serverController) {
        logger.error('Unable to create server controller');
        exit(1);
    } else {
        startServer(SERVER_HOST, SERVER_PORT, serverController);
        await startServerCleaner(serverController, PARENT_PROC_ID);
    }
}

_start();
