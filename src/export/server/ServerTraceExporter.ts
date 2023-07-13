import { TraceExporter } from '../TraceExporter';
import { TraceRequest } from '../../domain/TraceRequest';

import axios, { AxiosError, AxiosResponse } from 'axios';

export class ServerTraceExporter implements TraceExporter {

    private readonly url: string;

    constructor(serverHost: string, serverPort: number) {
        this.url = ServerTraceExporter._generateURL(serverHost, serverPort);
    }

    private static _generateURL(serverHost: string, serverPort: number): string {
        let serverExportURL: string = `${serverHost}:${serverPort}/export`;
        if (!serverExportURL.startsWith('http://')) {
            serverExportURL = `http://${serverExportURL}`;
        }
        return serverExportURL;
    }

    async export(traceRequest: TraceRequest): Promise<void> {
        try {
            const res: AxiosResponse = await axios.post(this.url, traceRequest);
            if (res.status / 100 != 2) {
                throw new Error(
                    `Invalid response (status code=${res.status}) from server endpoint ${this.url}`
                );
            }
        } catch (err: AxiosError | any) {
            if (err?.response?.status) {
                throw new Error(
                    `Invalid response (status code=${err?.response?.status}) from server endpoint ${this.url}`
                );
            } else {
                throw new Error(
                    `Unable to export trace request to server endpoint ${this.url}: ${err.name} (${err.message})`
                );
            }
        }
    }

}
