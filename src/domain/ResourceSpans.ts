import { Resource } from './Resource';
import { ScopeSpans } from './ScopeSpans';

export type ResourceSpans = {
    resource?: Resource;
    scopeSpans: ScopeSpans[];
    schemaUrl?: string;
};
