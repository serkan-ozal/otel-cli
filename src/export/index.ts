import { HttpJsonTraceExporter } from './http';
import { TraceExporter } from './TraceExporter';
import { ServerTraceExporter } from './server';
import { DEFAULT_SERVER_HOST } from '../constants';

export * from './TraceExporter';

export enum ExporterOTLPProtocols {
    HTTP_JSON = 'http/json',
}

type TraceExporterFactory = (
    exporterOTLPEndpoint: string,
    exporterOTLPHeaders: Map<string, string>
) => TraceExporter;

interface TraceExporterFactoryMap {
    [exporterOTLPProtocol: string]: (
        exporterOTLPEndpoint: string,
        exporterOTLPHeaders: Map<string, string>
    ) => TraceExporter;
}

const TRACE_EXPORTER_FACTORY_MAP: TraceExporterFactoryMap = {
    [ExporterOTLPProtocols.HTTP_JSON]: (
        exporterOTLPEndpoint: string,
        exporterOTLPHeaders: Map<string, string>
    ) => new HttpJsonTraceExporter(exporterOTLPEndpoint, exporterOTLPHeaders),
};

export function createTraceExporter(
    exporterOTLPProtocol: string,
    exporterOTLPEndpoint: string,
    exporterOTLPHeaders: Map<string, string>
): TraceExporter {
    const traceExporterFactory: TraceExporterFactory =
        TRACE_EXPORTER_FACTORY_MAP[exporterOTLPProtocol];
    if (!traceExporterFactory) {
        throw new Error(
            `Unrecognized exporter OTLP protocol: ${exporterOTLPProtocol}`
        );
    }
    return traceExporterFactory(exporterOTLPEndpoint, exporterOTLPHeaders);
}

export function createServerTraceExporter(serverPort: number): TraceExporter {
    return new ServerTraceExporter(DEFAULT_SERVER_HOST, serverPort);
}
