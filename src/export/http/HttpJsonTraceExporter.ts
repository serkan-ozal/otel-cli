import { TraceExporter } from '../TraceExporter';
import {
    ResourceSpans,
    ScopeSpans,
    Span,
    TraceMetadata,
    TraceRequest,
} from '../../domain';
import {
    OTEL_CLI_NAME,
    OTEL_CLI_VERSION,
    RESOURCE_ATTRIBUTES,
} from '../../constants';

import axios, { AxiosError, AxiosRequestHeaders, AxiosResponse } from 'axios';

export class HttpJsonTraceExporter implements TraceExporter {
    private readonly url: string;
    private readonly headers: AxiosRequestHeaders;

    constructor(
        exporterOTLPEndpoint: string,
        exporterOTLPHeaders?: Map<string, string>
    ) {
        this.url = this.normalizeURL(exporterOTLPEndpoint);
        this.headers = {};
        this.initHeaders(exporterOTLPHeaders);
    }

    protected normalizeURL(exporterOTLPEndpoint: string): string {
        return `${exporterOTLPEndpoint}/v1/traces`;
    }

    protected initHeaders(exporterOTLPHeaders?: Map<string, string>): void {
        if (exporterOTLPHeaders) {
            for (const entry of exporterOTLPHeaders.entries()) {
                const headerName: string = entry[0];
                const headerValue: string = entry[1];
                this.headers[headerName] = headerValue;
            }
        }
    }

    private _createScopeSpans(spans: Span[]): ScopeSpans[] {
        return [
            {
                scope: {
                    name: OTEL_CLI_NAME,
                    version: OTEL_CLI_VERSION,
                    attributes: [],
                },
                spans: spans,
            },
        ];
    }

    private _createResourceSpans(
        metadata: TraceMetadata,
        spans: Span[]
    ): ResourceSpans[] {
        return [
            {
                resource: {
                    attributes: [
                        {
                            key: RESOURCE_ATTRIBUTES.SERVICE_NAME,
                            value: {
                                stringValue: metadata.serviceName,
                            },
                        },
                    ],
                    droppedAttributesCount: 0,
                },
                scopeSpans: this._createScopeSpans(spans),
            },
        ];
    }

    private _createTraceRequest(
        metadata: TraceMetadata,
        spans: Span[]
    ): TraceRequest {
        return {
            resourceSpans: this._createResourceSpans(metadata, spans),
        };
    }

    protected createRequestData(metadata: TraceMetadata, spans: Span[]): any {
        return this._createTraceRequest(metadata, spans);
    }

    async export(metadata: TraceMetadata, spans: Span[]): Promise<void> {
        try {
            const requestData: any = this.createRequestData(metadata, spans);
            const res: AxiosResponse = await axios.post(this.url, requestData, {
                headers: this.headers,
            });
            if (res.status / 100 != 2) {
                throw new Error(
                    `Failed response (status code=${res.status}) from exporter OTLP HTTP endpoint ${this.url}`
                );
            }
        } catch (err: AxiosError | any) {
            if (err?.response?.status) {
                throw new Error(
                    `Failed response (status code=${err?.response?.status}) from exporter OTLP HTTP endpoint ${this.url}`
                );
            } else {
                throw new Error(
                    `Unable to export trace request to exporter OTLP HTTP endpoint ${this.url}: ${err.name} (${err.message})`
                );
            }
        }
    }
}
