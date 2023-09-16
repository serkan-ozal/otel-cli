import { Span, TraceMetadata } from '../domain';

export interface TraceExporter {
    export(metadata: TraceMetadata, spans: Span[]): Promise<void>;
}
