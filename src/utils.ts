import { Attribute, Value } from './domain';
import * as logger from './logger';
import { exit } from './exit';

const SPAN_ID_BYTES = 8;
const TRACE_ID_BYTES = 16;
const SHARED_BUFFER: Buffer = Buffer.allocUnsafe(TRACE_ID_BYTES);

export function isInteger(value: string): boolean {
    return /^-?\d+$/.test(value);
}

export function isDouble(value: string): boolean {
    return /^\d+\.\d+$/.test(value);
}

export function generateId(bytes: number): string {
    for (let i = 0; i < bytes / 4; i++) {
        // unsigned right shift drops decimal part of the number
        // it is required because if a number between 2**32 and 2**32 - 1 is generated,
        // an out of range error is thrown by writeUInt32BE
        SHARED_BUFFER.writeUInt32BE((Math.random() * 2 ** 32) >>> 0, i * 4);
    }

    // If buffer is all 0, set the last byte to 1 to guarantee a valid w3c id is generated
    for (let i = 0; i < bytes; i++) {
        if (SHARED_BUFFER[i] > 0) {
            break;
        } else if (i === bytes - 1) {
            SHARED_BUFFER[bytes - 1] = 1;
        }
    }

    return SHARED_BUFFER.toString('hex', 0, bytes);
}

export function generateSpanId(): string {
    return generateId(SPAN_ID_BYTES);
}

export function generateTraceId(): string {
    return generateId(TRACE_ID_BYTES);
}

export function validateSpanId(spanId: string): boolean {
    return /^[a-f\d]{16}$/.test(spanId);
}

export function validateTraceId(spanId: string): boolean {
    return /^[a-f\d]{32}$/.test(spanId);
}

export function validateTraceParent(traceParent: string): boolean {
    return /^00-[a-f\d]{32}-[a-f\d]{16}-[a-f\d]{2}$/.test(traceParent);
}

export function extractTraceIdFromTraceParent(traceParent: string): string {
    if (validateTraceParent(traceParent)) {
        return traceParent.split('-')[1];
    } else {
        throw new Error(`Invalid trace parent: ${traceParent}`);
    }
}

export function extractSpanIdFromTraceParent(traceParent: string): string {
    if (validateTraceParent(traceParent)) {
        return traceParent.split('-')[2];
    } else {
        throw new Error(`Invalid trace parent: ${traceParent}`);
    }
}

export function flattenAttributes(
    attributeMap: Map<string, string>
): Attribute[] {
    return Array.from(attributeMap, ([key, value]) => {
        let val: Value;
        if (value.startsWith('"') && value.endsWith('"')) {
            val = {
                stringValue: value.substring(1, value.length - 1),
            };
        } else if (
            value.toLowerCase() === 'true' ||
            value.toLowerCase() === 'false'
        ) {
            val = {
                boolValue: value.toLowerCase() === 'true',
            };
        } else if (isInteger(value)) {
            val = {
                intValue: parseInt(value),
            };
        } else if (isDouble(value)) {
            val = {
                doubleValue: parseFloat(value),
            };
        } else {
            val = {
                stringValue: value,
            };
        }
        return { key, value: val } as Attribute;
    });
}

export function parseKeyValue(keyValuePairs: string[]): Map<string, string> {
    return new Map(
        (keyValuePairs || []).map((pair: string) => {
            const separatorIdx: number = pair.indexOf('=');
            if (separatorIdx < 0) {
                logger.error(
                    `Key-value pair must be in "key=value" format: ${pair}`
                );
                exit(1);
            }
            return [
                pair.substring(0, separatorIdx),
                pair.substring(separatorIdx + 1),
            ];
        })
    );
}
