import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import * as logger from '../logger';
import { TraceRequest } from '../domain/TraceRequest';
import { TaskExecutor } from '../executor';
import { createTraceExporter, TraceExporter } from '../export';
import { exit } from '../exit';

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
                            const traceRequest: TraceRequest =
                                JSON.parse(requestBody);
                            await serverController.export(traceRequest);
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

    export(traceRequest: TraceRequest): Promise<void> {
        return this.taskExecutor.execute(async () => {
            try {
                await this.traceExporter.export(traceRequest);
            } catch (err: any) {
                logger.error(
                    `Unable to export trace request: ${traceRequest}`,
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
    exporterOTLPTracesEndpoint: string,
    exporterOTLPHeaders: Map<string, string>
): ServerController | undefined {
    const taskExecutor: TaskExecutor = new TaskExecutor(TASK_CONCURRENCY_LEVEL);
    const traceExporter: TraceExporter = createTraceExporter(
        exporterOTLPProtocol,
        exporterOTLPTracesEndpoint,
        exporterOTLPHeaders
    );
    return new ServerController(taskExecutor, traceExporter);
}
