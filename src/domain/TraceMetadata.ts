import { Attribute } from './Attribute';

export type TraceMetadata = {
    serviceName: string;
    resourceAttributes: Attribute[];
};
