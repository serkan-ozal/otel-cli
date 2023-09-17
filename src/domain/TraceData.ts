import { Span } from './Span';
import { TraceMetadata } from './TraceMetadata';

export type TraceData = {
    metadata: TraceMetadata;
    spans: Span[];
};
