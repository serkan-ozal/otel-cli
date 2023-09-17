import { TraceExporter } from '../TraceExporter';
import { Attribute, Span, TraceMetadata } from '../../domain';
import {
    OTEL_CLI_NAME,
    OTEL_CLI_VERSION,
    RESOURCE_ATTRIBUTES,
    SAMPLED_TRACE_FLAG,
} from '../../constants';

import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import {
    Attributes,
    AttributeValue,
    Link,
    HrTime,
    SpanKind,
} from '@opentelemetry/api';
import { ReadableSpan, TimedEvent } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Metadata } from '@grpc/grpc-js';

export class GrpcTraceExporter implements TraceExporter {
    private readonly url: string;
    private readonly exporter: OTLPTraceExporter;

    constructor(
        exporterOTLPEndpoint: string,
        exporterOTLPHeaders: Map<string, string>
    ) {
        this.url = exporterOTLPEndpoint;
        this.exporter = new OTLPTraceExporter({
            url: this.url,
            metadata: this._headersToMetadata(exporterOTLPHeaders),
        });
    }

    private _headersToMetadata(
        exporterOTLPHeaders: Map<string, string>
    ): Metadata {
        const metadata: Metadata = new Metadata();
        if (exporterOTLPHeaders) {
            for (const entry of exporterOTLPHeaders.entries()) {
                const headerName: string = entry[0];
                const headerValue: string = entry[1];
                metadata.set(headerName, headerValue);
            }
        }
        return metadata;
    }

    private _nanosecondsToHrTime(nanos: number): HrTime {
        // Since we lost precision at nanoseconds level,
        // we convert nanoseconds to milliseconds first.
        const micros: number = Math.floor(nanos / 1_000);
        const secondsDecimal: number = micros / 1_000_000;
        const seconds: number = Math.floor(micros / 1_000_000);
        return [
            seconds,
            Math.floor(Number((secondsDecimal - seconds).toFixed(6)) * 1e9),
        ];
    }

    private _nanosecondsDiffToHrTime(nanos1: number, nanos2: number): HrTime {
        // Since we lost precision at nanoseconds level,
        // we convert nanoseconds to milliseconds first.
        const micros1: number = Math.floor(nanos1 / 1_000);
        const micros2: number = Math.floor(nanos2 / 1_000);
        const diffMicros: number = micros1 - micros2;
        const diffNanos: number = diffMicros * 1_000;
        return this._nanosecondsToHrTime(diffNanos);
    }

    private _toAttributes(attributeList: Attribute[]): Attributes {
        const attributes: Attributes = {};
        for (const attribute of attributeList) {
            let attributeVal: AttributeValue | undefined;
            if (attribute.value.stringValue != null) {
                attributeVal = attribute.value.stringValue;
            } else if (attribute.value.intValue != null) {
                attributeVal = attribute.value.intValue;
            } else if (attribute.value.doubleValue != null) {
                attributeVal = attribute.value.doubleValue;
            } else if (attribute.value.boolValue != null) {
                attributeVal = attribute.value.boolValue;
            }
            attributes[attribute.key] = attributeVal;
        }
        return attributes;
    }

    private _createReadableSpans(
        metadata: TraceMetadata,
        spans: Span[]
    ): ReadableSpan[] {
        const readableSpans: ReadableSpan[] = [];
        for (const span of spans) {
            readableSpans.push({
                name: span.name,
                kind: SpanKind[
                    SpanKind[span.kind.valueOf() - 1] as keyof typeof SpanKind
                ],
                parentSpanId: span.parentSpanId,
                spanContext: () => {
                    return {
                        traceId: span.traceId,
                        spanId: span.spanId,
                        traceFlags: SAMPLED_TRACE_FLAG,
                    };
                },
                startTime: this._nanosecondsToHrTime(span.startTimeUnixNano),
                endTime: this._nanosecondsToHrTime(span.endTimeUnixNano),
                duration: this._nanosecondsDiffToHrTime(
                    span.endTimeUnixNano,
                    span.startTimeUnixNano
                ),
                ended: true,
                status: span.status,
                attributes: this._toAttributes(span.attributes),
                resource: {
                    attributes: {
                        [RESOURCE_ATTRIBUTES.SERVICE_NAME]:
                            metadata.serviceName,
                        ...this._toAttributes(
                            metadata.resourceAttributes || []
                        ),
                    },
                },
                instrumentationLibrary: {
                    name: OTEL_CLI_NAME,
                    version: OTEL_CLI_VERSION,
                },
                events: [] as TimedEvent[],
                links: [] as Link[],
                droppedAttributesCount: 0,
                droppedEventsCount: 0,
                droppedLinksCount: 0,
            } as ReadableSpan);
        }
        return readableSpans;
    }

    async export(metadata: TraceMetadata, spans: Span[]): Promise<void> {
        const readableSpans: ReadableSpan[] = this._createReadableSpans(
            metadata,
            spans
        );
        return new Promise(
            (res: (result: void) => void, rej: (reason: any) => void): void => {
                this.exporter.export(readableSpans, (result: ExportResult) => {
                    if (result.error) {
                        rej(
                            new Error(
                                `Failed response (error=${result.error}, status code=${result.code}) from exporter OTLP GRPC endpoint ${this.url}`
                            )
                        );
                    } else {
                        if (result.code === ExportResultCode.FAILED) {
                            rej(
                                new Error(
                                    `Failed response (status code=${result.code}) from exporter OTLP GRPC endpoint ${this.url}`
                                )
                            );
                        } else {
                            res();
                        }
                    }
                });
            }
        );
    }
}
