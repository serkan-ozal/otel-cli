import { TraceRequest } from '../domain/TraceRequest';

export interface TraceExporter {
    export(traceRequest: TraceRequest): Promise<void>;
}
