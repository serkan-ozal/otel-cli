import { Attribute } from './Attribute';

export type InstrumentationScope = {
    name: string;
    version?: string;
    attributes?: Attribute[];
    droppedAttributesCount?: number;
};
