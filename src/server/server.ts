import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

import * as logger from '../logger';
import { TaskExecutor } from '../executor';
import { createTraceExporter, TraceExporter } from '../export';
import { exit } from '../exit';
import { TraceData } from '../domain';

const TASK_CONCURRENCY_LEVEL: number = 10;
const SERVER_SHUTDOWN_GRACE_PERIOD = 1000;

function _getRequestBody(request: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
        const bodyParts: Uint8Array[] = [];
        request
            .on('data', (chunk: Uint8Array) => {
                bodyParts.push(chunk);
            })
            .on('end', () => {
                const bodyStr: string = Buffer.concat(bodyParts).toString();
                resolve(bodyStr);
            });
    });
}

export function startServer(
    host: string,
    port: number,
    serverController: ServerController
): Server {
    const server: Server = createServer(
        async (request: IncomingMessage, response: ServerResponse) => {
            try {
                switch (request.url) {
                    case '/export': {
                        if (request.method === 'POST') {
                            const requestBody: string = await _getRequestBody(
                                request
                            );
                            const traceData: TraceData =
                                JSON.parse(requestBody);
                            // Don't wait promise as it blocks the client
                            // until the request is actually exported to its final destination (OTLP endpoint)
                            serverController.export(traceData);
                            response.end();
                        } else {
                            response.statusCode = 405;
                            response.end();
                        }
                        break;
                    }
                    case '/shutdown': {
                        if (request.method === 'DELETE') {
                            await serverController.shutdown();
                            response.end();
                        } else {
                            response.statusCode = 405;
                            response.end();
                        }
                        break;
                    }
                    default: {
                        response.statusCode = 404;
                        response.end();
                    }
                }
            } catch (error: any) {
                logger.error(error);
                response.statusCode = 500;
                response.end(
                    JSON.stringify({
                        type: error.type,
                        message: error.message,
                    })
                );
            }
        }
    );

    server.listen(port, host, () => {
        logger.info(`OTEL CLI server listening on port ${port}`);
    });

    return server;
}

export class ServerController {
    private readonly taskExecutor: TaskExecutor;
    private readonly traceExporter: TraceExporter;
    private serverShutdown: boolean = false;

    constructor(taskExecutor: TaskExecutor, traceExporter: TraceExporter) {
        this.taskExecutor = taskExecutor;
        this.traceExporter = traceExporter;
    }

    export(traceData: TraceData): Promise<void> {
        return this.taskExecutor.execute(async () => {
            try {
                await this.traceExporter.export(
                    traceData.metadata,
                    traceData.spans
                );
            } catch (err: any) {
                logger.error(
                    `Unable to export spans: ${JSON.stringify(
                        traceData.spans
                    )}`,
                    err
                );
            }
        });
    }

    async shutdown(): Promise<void> {
        if (this.serverShutdown) {
            return Promise.resolve();
        }

        logger.info('Shutting down OTEL CLI server ...');
        try {
            await this.taskExecutor.close();
            this.serverShutdown = true;
            setTimeout(() => {
                exit(0);
            }, SERVER_SHUTDOWN_GRACE_PERIOD);
        } catch (err: any) {
            logger.error(`Error occurred while closing task executor`, err);
            exit(1);
        }
    }
}

export function createServerController(
    exporterOTLPProtocol: string,
    exporterOTLPEndpoint: string,
    exporterOTLPHeaders: Map<string, string>
): ServerController | undefined {
    const taskExecutor: TaskExecutor = new TaskExecutor(TASK_CONCURRENCY_LEVEL);
    const traceExporter: TraceExporter = createTraceExporter(
        exporterOTLPProtocol,
        exporterOTLPEndpoint,
        exporterOTLPHeaders
    );
    return new ServerController(taskExecutor, traceExporter);
}
