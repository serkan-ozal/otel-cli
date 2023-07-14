import { Commands } from '../index';
import { CommandExecutor } from '../CommandExecutor';
import * as logger from '../../logger';
import { exit } from '../../exit';
import { ExporterOTLPProtocols } from '../../export';
import { parseKeyValue } from '../../utils';
import {
    createServerController,
    ServerController,
    startServer,
    startServerCleaner
} from '../../server';

import { Command, Option, OptionValues } from 'commander';
import { DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT } from '../../constants';

export class StartServerCommandExecutor implements CommandExecutor {
    private verboseEnabled: boolean;
    private exporterOTLPEndpoint: string;
    private exporterOTLPTracesEndpoint: string;
    private exporterOTLPProtocol: string;
    private exporterOTLPHeaders: Map<string, string>;
    private serverPort: number;

    commandName(): string {
        return Commands.START_SERVER;
    }

    defineOptions(command: Command) {
        command
            .addOption(
                new Option('-v, --verbose', 'Enable verbose mode')
                    .makeOptionMandatory(false)
                    .default(process.env.OTEL_CLI_VERBOSE &&
                        process.env.OTEL_CLI_VERBOSE.toLowerCase() === 'true')
            )
            .addOption(
                new Option('-e, --endpoint <url>', 'OTEL Exporter OTLP endpoint')
                    .makeOptionMandatory(false)
                    .default(process.env.OTEL_EXPORTER_OTLP_ENDPOINT)
            )
            .addOption(
                new Option('-te, --traces-endpoint <url>', 'OTEL Exporter OTLP traces endpoint')
                    .makeOptionMandatory(false)
                    .default(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT)
            )
            .addOption(
                new Option('-p, --protocol <protocol>', 'OTEL Exporter OTLP protocol')
                    .makeOptionMandatory(false)
                    .default(
                        process.env.OTEL_EXPORTER_OTLP_PROTOCOL ||
                        ExporterOTLPProtocols.HTTP_JSON
                    )
                    .choices(Object.values(ExporterOTLPProtocols))
            )
            .addOption(
                new Option('-h, --headers <key-value-pairs...>', 'OTEL Exporter OTLP headers')
                    .makeOptionMandatory(false)
                    .default(process.env.OTEL_EXPORTER_OTLP_HEADERS &&
                        process.env.OTEL_EXPORTER_OTLP_HEADERS.split(','))
            )
            .addOption(
                new Option('-sp, --server-port <port>',
                    'OTEL CLI server port to start on')
                    .makeOptionMandatory(true)
                    .default(process.env.OTEL_CLI_SERVER_PORT || DEFAULT_SERVER_PORT)
            );
    }

    private _parseOptions(options: OptionValues): void {
        this.verboseEnabled = options.verbose;
        logger.setDebugEnabled(this.verboseEnabled);

        this.exporterOTLPEndpoint = options.endpoint;
        this.exporterOTLPTracesEndpoint = options.tracesEndpoint;
        this.exporterOTLPProtocol = options.protocol;
        this.exporterOTLPHeaders = parseKeyValue(options.headers);
        this.serverPort = parseInt(options.serverPort);
    }

    private _checkOptions(): void {
        if (!this.exporterOTLPEndpoint && !this.exporterOTLPTracesEndpoint) {
            logger.error(
                'One of the OTEL Exporter OTLP endpoint ' +
                'or OTEL Exporter OTLP traces endpoint configurations must be specified!'
            );
            exit(1);
        }
    }

    private _resolveExporterOTLPTracesEndpoint(): string {
        return (
            this.exporterOTLPTracesEndpoint ||
            this.exporterOTLPEndpoint + '/v1/traces'
        );
    }

    private _resolveExporterOTLPHeaders(): string | undefined {
        if (!this.exporterOTLPHeaders || !this.exporterOTLPHeaders.size) {
            return undefined;
        }
        let added: boolean = false;
        let resolvedHeaders: string = '';
        for (const entry of this.exporterOTLPHeaders.entries()) {
            const headerName: string = entry[0];
            const headerValue: string = entry[1];
            if (added) {
                resolvedHeaders = ',' + resolvedHeaders;
            }
            resolvedHeaders = resolvedHeaders + `,${headerName}=${headerValue}`;
            added = true;
        }
        return resolvedHeaders;
    }

    async execute(options: OptionValues): Promise<void> {
        this._parseOptions(options);

        this._checkOptions();

        const serverController: ServerController | undefined =
            createServerController(
                this.exporterOTLPProtocol,
                this._resolveExporterOTLPTracesEndpoint(),
                this.exporterOTLPHeaders
            );
        if (!serverController) {
            throw new Error('Unable to create server controller');
            exit(1);
        } else {
            startServer(DEFAULT_SERVER_HOST, this.serverPort, serverController);
            await startServerCleaner(serverController, process.ppid);
        }

        /*
        // TODO
        // Currently server start is blocking for the caller
        // (requires "otel-cli start-server ... &" to run in background)
        // Should we support starting server in background automatically
        // by starting it inside detached process

        const child: ChildProcess = spawn(
          process.argv[0],
          [path.join(__dirname, '../../server/bootstrap.js')],
          {
            detached: true,
            stdio: 'ignore',
            env: {
                OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: this._resolveExporterOTLPTracesEndpoint(),
                OTEL_EXPORTER_OTLP_PROTOCOL: this.exporterOTLPProtocol,
                OTEL_EXPORTER_OTLP_HEADERS: this._resolveExporterOTLPHeaders(),
                OTEL_CLI_SERVER_PORT: this.serverPort.toString(),
                OTEL_CLI_SERVER_PPID: process.ppid.toString(),
            }
          }
        );
        child.unref();
        */
    }

}
