export type Attribute = {
    key: string;
    value: Value;
};

export type Value = {
    stringValue?: string | null;
    boolValue?: boolean | null;
    intValue?: number | null;
    doubleValue?: number | null;
};
