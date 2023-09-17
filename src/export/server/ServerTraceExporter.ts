import { TraceExporter } from '../TraceExporter';
import { HttpJsonTraceExporter } from '../http';
import { Span, TraceMetadata, TraceData } from '../../domain';

export class ServerTraceExporter
    extends HttpJsonTraceExporter
    implements TraceExporter
{
    constructor(serverHost: string, serverPort: number) {
        super(ServerTraceExporter._generateURL(serverHost, serverPort));
    }

    protected normalizeURL(exporterOTLPEndpoint: string): string {
        return exporterOTLPEndpoint;
    }

    private static _generateURL(
        serverHost: string,
        serverPort: number
    ): string {
        let serverExportURL: string = `${serverHost}:${serverPort}/export`;
        if (!serverExportURL.startsWith('http://')) {
            serverExportURL = `http://${serverExportURL}`;
        }
        return serverExportURL;
    }

    protected createRequestData(
        metadata: TraceMetadata,
        spans: Span[]
    ): TraceData {
        return {
            metadata,
            spans,
        } as TraceData;
    }
}
