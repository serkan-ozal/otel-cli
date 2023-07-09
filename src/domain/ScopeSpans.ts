import { InstrumentationScope } from './InstrumentationScope';
import { Span } from './Span';

export type ScopeSpans = {
    scope?: InstrumentationScope;
    spans?: Span[];
    schemaUrl?: string | null;
};
