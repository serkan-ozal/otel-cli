import { CommandExecutor } from '../CommandExecutor';
import { exit } from '../../exit';
import {
    Attribute,
    Span,
    SpanKind,
    SpanStatus,
    SpanStatusCode,
    TraceMetadata,
} from '../../domain';
import {
    extractSpanIdFromTraceParent,
    extractTraceIdFromTraceParent,
    flattenAttributes,
    generateSpanId,
    parseKeyValue,
    validateSpanId,
    validateTraceId,
    validateTraceParent,
} from '../../utils';
import {
    createServerTraceExporter,
    createTraceExporter,
    ExporterOTLPProtocols,
    TraceExporter,
} from '../../export';
import * as logger from '../../logger';
import { Commands } from '../index';
import { RESOURCE_ATTRIBUTES } from '../../constants';

import { Command, Option, OptionValues } from 'commander';

const MANAGED_RESOURCE_ATTRIBUTES: string[] = [
    RESOURCE_ATTRIBUTES.SERVICE_NAME,
];

export class ExportCommandExecutor implements CommandExecutor {
    private verboseEnabled: boolean;
    private exporterOTLPEndpoint: string;
    private exporterOTLPProtocol: string;
    private exporterOTLPHeaders: Map<string, string>;
    private traceParent: string;
    private traceParentPrint: boolean;
    private traceId: string;
    private spanId: string;
    private parentSpanId: string;
    private spanName: string;
    private serviceName: string;
    private spanKind: string;
    private spanStartTimeNanos: number;
    private spanStartTimeMicros: number;
    private spanStartTimeMillis: number;
    private spanStartTimeSecs: number;
    private spanEndTimeNanos: number;
    private spanEndTimeMicros: number;
    private spanEndTimeMillis: number;
    private spanEndTimeSecs: number;
    private spanStatusCode: string;
    private spanStatusMessage: string;
    private spanAttributes: Map<string, string>;
    private resourceAttributes: Map<string, string>;
    private serverPort: number;
    private traceMetadata: TraceMetadata;

    private _tryToGetTraceIdFromTraceParent(
        traceParent: string
    ): string | undefined {
        if (traceParent) {
            return extractTraceIdFromTraceParent(traceParent);
        }
        return undefined;
    }

    private _tryToGetParentSpanIdFromTraceParent(
        traceParent: string
    ): string | undefined {
        if (traceParent) {
            return extractSpanIdFromTraceParent(traceParent);
        }
        return undefined;
    }

    private _normalizeResourceAttributes(
        resourceAttributes: Map<string, string>
    ): Map<string, string> {
        MANAGED_RESOURCE_ATTRIBUTES.forEach((a: string) =>
            resourceAttributes.delete(a)
        );
        return resourceAttributes;
    }

    private _parseOptions(options: OptionValues): void {
        this.verboseEnabled = options.verbose;
        logger.setDebugEnabled(this.verboseEnabled);

        this.exporterOTLPEndpoint = options.endpoint;
        this.exporterOTLPProtocol = options.protocol;
        this.exporterOTLPHeaders = parseKeyValue(options.headers);

        this.traceParent = !options.traceparentDisable
            ? options.traceparent || process.env.TRACEPARENT
            : undefined;
        this.traceParentPrint = options.traceparentPrint;
        this.traceId =
            options.traceId ||
            this._tryToGetTraceIdFromTraceParent(this.traceParent);
        this.spanId = options.spanId;
        this.parentSpanId =
            options.parentSpanId ||
            this._tryToGetParentSpanIdFromTraceParent(this.traceParent);
        this.spanName = options.name;
        this.serviceName = options.serviceName;
        this.spanKind = options.kind;
        this.spanStartTimeNanos = parseInt(options.startTimeNanos);
        this.spanStartTimeMicros = parseInt(options.startTimeMicros);
        this.spanStartTimeMillis = parseInt(options.startTimeMillis);
        this.spanStartTimeSecs = parseInt(options.startTimeSecs);
        this.spanEndTimeNanos = parseInt(options.endTimeNanos);
        this.spanEndTimeMicros = parseInt(options.endTimeMicros);
        this.spanEndTimeMillis = parseInt(options.endTimeMillis);
        this.spanEndTimeSecs = parseInt(options.endTimeSecs);
        this.spanStatusCode = options.statusCode;
        this.spanStatusMessage = options.statusMessage;
        this.spanAttributes = parseKeyValue(options.attributes);
        this.resourceAttributes = this._normalizeResourceAttributes(
            parseKeyValue(options.resourceAttributes)
        );
        this.serverPort = parseInt(options.serverPort);

        this.traceMetadata = {
            serviceName: this.serviceName,
            resourceAttributes: flattenAttributes(this.resourceAttributes),
        } as TraceMetadata;
    }

    private _checkOptions(): void {
        if (this.traceParent && !validateTraceParent(this.traceParent)) {
            logger.error(`Invalid trace parent: ${this.traceParent}!`);
            exit(1);
        }
        if (!this.traceId) {
            logger.error(`Trace id is not specified: ${this.traceId}!`);
            exit(1);
        }
        if (!validateTraceId(this.traceId)) {
            logger.error(`Invalid trace id: ${this.traceId}!`);
            exit(1);
        }
        if (!validateSpanId(this.spanId)) {
            logger.error(`Invalid span id: ${this.spanId}!`);
            exit(1);
        }
        if (this.parentSpanId && !validateSpanId(this.parentSpanId)) {
            logger.error(`Invalid parent span id: ${this.parentSpanId}!`);
            exit(1);
        }
        if (
            !this.spanStartTimeNanos &&
            !this.spanEndTimeMicros &&
            !this.spanStartTimeMillis &&
            !this.spanStartTimeSecs
        ) {
            logger.error(
                'Span start time must be specified in one of the supported formats ' +
                    '(nanoseconds, microseconds, milliseconds, or seconds)!'
            );
            exit(1);
        }
        if (
            !this.spanEndTimeNanos &&
            !this.spanEndTimeMicros &&
            !this.spanEndTimeMillis &&
            !this.spanEndTimeSecs
        ) {
            logger.error(
                'Span end time must be specified in one of the supported formats ' +
                    '(nanoseconds, microseconds, milliseconds, or seconds)!'
            );
            exit(1);
        }
    }

    private _resolveSpanStartTimeNanos(): number {
        if (this.spanStartTimeNanos) {
            return this.spanStartTimeNanos;
        } else if (this.spanStartTimeMicros) {
            return this.spanStartTimeMicros * 1000;
        } else if (this.spanStartTimeMillis) {
            return this.spanStartTimeMillis * 1000000;
        } else if (this.spanStartTimeSecs) {
            return this.spanStartTimeSecs * 1000000000;
        } else {
            throw new Error('No span start time is specified');
        }
    }

    private _resolveSpanEndTimeNanos(): number {
        if (this.spanEndTimeNanos) {
            return this.spanEndTimeNanos;
        } else if (this.spanEndTimeMicros) {
            return this.spanEndTimeMicros * 1000;
        } else if (this.spanEndTimeMillis) {
            return this.spanEndTimeMillis * 1000000;
        } else if (this.spanEndTimeSecs) {
            return this.spanEndTimeSecs * 1000000000;
        } else {
            throw new Error('No span end time is specified');
        }
    }

    private _normalizeId(id: string): string {
        if (id && id.startsWith('0x')) {
            id = id.substring('0x'.length);
        }
        return id;
    }

    private _createSpan(): Span {
        const traceId: string = this._normalizeId(this.traceId);
        const spanId: string | undefined = this._normalizeId(this.spanId);
        const traceState: string | null = null;
        const parentSpanId: string | undefined = this._normalizeId(
            this.parentSpanId
        );
        const name: string = this.spanName;
        const kind: SpanKind = SpanKind[this.spanKind as keyof typeof SpanKind];
        const startTimeUnixNano: number = this._resolveSpanStartTimeNanos();
        const endTimeUnixNano: number = this._resolveSpanEndTimeNanos();
        const statusCode: SpanStatusCode =
            SpanStatusCode[this.spanStatusCode as keyof typeof SpanStatusCode];
        const statusMessage: string | undefined = this.spanStatusMessage;
        const status: SpanStatus = {
            code: statusCode || SpanStatusCode.UNSET,
            message: statusMessage,
        };
        const attributes: Attribute[] = flattenAttributes(this.spanAttributes);

        return {
            traceId,
            spanId,
            traceState,
            parentSpanId,
            name,
            kind,
            startTimeUnixNano,
            endTimeUnixNano,
            status,
            attributes,
            droppedAttributesCount: 0,
        } as Span;
    }

    private _createTraceExporter(): TraceExporter {
        if (this.serverPort) {
            return createServerTraceExporter(this.serverPort);
        } else {
            return createTraceExporter(
                this.exporterOTLPProtocol,
                this.exporterOTLPEndpoint,
                this.exporterOTLPHeaders
            );
        }
    }

    private async _exportSpans(
        metadata: TraceMetadata,
        spans: Span[]
    ): Promise<void> {
        const traceExporter: TraceExporter = this._createTraceExporter();
        try {
            if (logger.isDebugEnabled()) {
                logger.debug(`Exporting spans:`, spans);
            }
            await traceExporter.export(metadata, spans);
            logger.debug('Exported spans');
        } catch (err: any) {
            logger.error('Unable to export spans', err);
        }
    }

    private _generateTraceParent(): string {
        return `00-${this.traceId}-${this.spanId}-01`;
    }

    commandName(): string {
        return Commands.EXPORT;
    }

    defineOptions(command: Command) {
        command
            .addOption(
                new Option('-v, --verbose', 'Enable verbose mode')
                    .makeOptionMandatory(false)
                    .default(
                        process.env.OTEL_CLI_VERBOSE &&
                            process.env.OTEL_CLI_VERBOSE.toLowerCase() ===
                                'true'
                    )
            )
            .addOption(
                new Option(
                    '-e, --endpoint <url>',
                    'OTEL Exporter OTLP endpoint'
                )
                    .makeOptionMandatory(true)
                    .default(process.env.OTEL_EXPORTER_OTLP_ENDPOINT)
            )
            .addOption(
                new Option(
                    '-p, --protocol <protocol>',
                    'OTEL Exporter OTLP protocol'
                )
                    .makeOptionMandatory(false)
                    .default(
                        process.env.OTEL_EXPORTER_OTLP_PROTOCOL ||
                            ExporterOTLPProtocols.HTTP_JSON
                    )
                    .choices(Object.values(ExporterOTLPProtocols))
            )
            .addOption(
                new Option(
                    '-h, --headers <key-value-pairs...>',
                    'OTEL Exporter OTLP headers'
                )
                    .makeOptionMandatory(false)
                    .default(
                        process.env.OTEL_EXPORTER_OTLP_HEADERS &&
                            process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',')
                    )
            )
            .addOption(
                new Option(
                    '-tp, --traceparent <header>',
                    'Traceparent header in W3C trace context format'
                )
                    .makeOptionMandatory(false)
                    .default(process.env.TRACEPARENT)
            )
            .addOption(
                new Option(
                    '-tpd, --traceparent-disable',
                    'Disable traceparent header based W3C trace context propagation for the exported span'
                )
                    .makeOptionMandatory(false)
                    .default(
                        process.env.OTEL_CLI_TRACEPARENT_DISABLE &&
                            process.env.OTEL_CLI_TRACEPARENT_DISABLE.toLowerCase() ===
                                'true'
                    )
            )
            .addOption(
                new Option(
                    '-tpp, --traceparent-print',
                    'Print traceparent header in W3C trace context format for the exported span'
                )
                    .makeOptionMandatory(false)
                    .default(
                        process.env.OTEL_CLI_TRACEPARENT_PRINT &&
                            process.env.OTEL_CLI_TRACEPARENT_PRINT.toLowerCase() ===
                                'true'
                    )
            )
            .addOption(
                new Option('-t, --trace-id <id>', 'Trace id')
                    .makeOptionMandatory(false)
                    .default(process.env.OTEL_CLI_TRACE_ID)
            )
            .addOption(
                new Option('-s, --span-id <id>', 'Span id')
                    .makeOptionMandatory(false)
                    .default(generateSpanId())
            )
            .addOption(
                new Option(
                    '-p, --parent-span-id <id>',
                    'Parent span id'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '-n, --name <name>',
                    'Span name'
                ).makeOptionMandatory(true)
            )
            .addOption(
                new Option('-sn, --service-name <name>', 'Service name')
                    .makeOptionMandatory(true)
                    .default(
                        process.env.OTEL_CLI_SERVICE_NAME ||
                            process.env.OTEL_SERVICE_NAME
                    )
            )
            .addOption(
                new Option('-k, --kind <kind>', 'Span kind')
                    .makeOptionMandatory(false)
                    .default(SpanKind[SpanKind.INTERNAL])
                    .choices(
                        Object.keys(SpanKind).filter((o) => isNaN(Number(o)))
                    )
            )
            .addOption(
                new Option(
                    '--start-time-nanos <nanos>',
                    'Start time in nanoseconds'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '--start-time-micros <micros>',
                    'Start time in microseconds'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '--start-time-millis <millis>',
                    'Start time in milliseconds'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '--start-time-secs <secs>',
                    'Start time in seconds'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '--end-time-nanos <nanos>',
                    'End time in nanoseconds'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '--end-time-micros <micros>',
                    'End time in microseconds'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '--end-time-millis <millis>',
                    'End time in milliseconds'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '--end-time-secs <secs>',
                    'End time in seconds'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option('-sc --status-code <code>', 'Status code')
                    .makeOptionMandatory(false)
                    .default(SpanStatusCode[SpanStatusCode.UNSET])
                    .choices(
                        Object.keys(SpanStatusCode).filter((o) =>
                            isNaN(Number(o))
                        )
                    )
            )
            .addOption(
                new Option(
                    '-sm --status-message <message>',
                    'Status message'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '-a --attributes <key-value-pairs...>',
                    'Span attributes as space seperated key-value pairs (key1=value1 key2=value2 key3=value3)'
                ).makeOptionMandatory(false)
            )
            .addOption(
                new Option(
                    '-ra --resource-attributes <key-value-pairs...>',
                    'Resource attributes as space seperated key-value pairs (key1=value1 key2=value2 key3=value3)'
                )
                    .makeOptionMandatory(false)
                    .default(
                        process.env.OTEL_RESOURCE_ATTRIBUTES &&
                            process.env.OTEL_RESOURCE_ATTRIBUTES.split(',')
                    )
            )
            .addOption(
                new Option(
                    '-sp, --server-port <port>',
                    'OTEL CLI server port for communicating over to export traces asynchronously in background'
                )
                    .makeOptionMandatory(false)
                    .default(process.env.OTEL_CLI_SERVER_PORT)
            );
    }

    async execute(options: OptionValues): Promise<void> {
        this._parseOptions(options);

        this._checkOptions();

        const spans: Span[] = [this._createSpan()];
        await this._exportSpans(this.traceMetadata, spans);

        if (this.traceParentPrint) {
            console.log(this._generateTraceParent());
        }
    }
}
