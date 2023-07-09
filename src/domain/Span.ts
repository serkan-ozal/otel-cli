import { Attribute } from './Attribute';

export type Span = {
    traceId: string;
    spanId: string;
    traceState?: string | null;
    parentSpanId: string;
    name: string;
    kind: SpanKind;
    startTimeUnixNano: number;
    endTimeUnixNano: number;
    status: SpanStatus;
    attributes: Attribute[];
    droppedAttributesCount: number;
};

export enum SpanKind {
    UNSPECIFIED = 0,
    INTERNAL = 1,
    SERVER = 2,
    CLIENT = 3,
    PRODUCER = 4,
    CONSUMER = 5,
}

export type SpanStatus = {
    code: SpanStatusCode;
    message?: string;
};

export enum SpanStatusCode {
    UNSET = 0,
    OK = 1,
    ERROR = 2,
}
