import { TraceExporter } from '../TraceExporter';
import { TraceRequest } from '../../domain/TraceRequest';

import axios, { AxiosError, AxiosRequestHeaders, AxiosResponse } from 'axios';

export class HttpJsonTraceExporter implements TraceExporter {

    private readonly url: string;
    private readonly headers: AxiosRequestHeaders;

    constructor(exporterOTLPEndpoint: string,
                exporterOTLPHeaders: Map<string, string>) {
        this.url = exporterOTLPEndpoint;
        this.headers = {};
        for (const entry of exporterOTLPHeaders.entries()) {
            const headerName: string = entry[0];
            const headerValue: string = entry[1];
            this.headers[headerName] = headerValue;
        }
    }

    async export(traceRequest: TraceRequest): Promise<void> {
        try {
            const res: AxiosResponse = await axios.post(this.url, traceRequest, { headers: this.headers });
            if (res.status / 100 != 2) {
                throw new Error(
                    `Invalid response (status code=${res.status}) from exporter OTLP endpoint ${this.url}`
                );
            }
        } catch (err: AxiosError | any) {
            if (err?.response?.status) {
                throw new Error(
                    `Invalid response (status code=${err?.response?.status}) from exporter OTLP endpoint ${this.url}`
                );
            } else {
                throw new Error(
                    `Unable to export trace request to exporter OTLP endpoint ${this.url}: ${err.name} (${err.message})`
                );
            }
        }
    }

}
