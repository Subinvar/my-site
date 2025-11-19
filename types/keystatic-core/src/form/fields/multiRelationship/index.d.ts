import type { BasicFormField } from "../../api.d.ts";
export declare function multiRelationship({ label, collection, validation, description, }: {
    label: string;
    collection: string;
    validation?: {
        length?: {
            min?: number;
            max?: number;
        };
    };
    description?: string;
}): BasicFormField<string[]>;
