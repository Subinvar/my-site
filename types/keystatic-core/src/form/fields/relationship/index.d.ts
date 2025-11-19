import type { BasicFormField } from "../../api.d.ts";
import type { RequiredValidation } from "../utils.d.ts";
export declare function relationship<IsRequired extends boolean | undefined>({ label, collection, validation, description, }: {
    label: string;
    collection: string;
    validation?: {
        isRequired?: IsRequired;
    };
    description?: string;
} & RequiredValidation<IsRequired>): BasicFormField<string | null, string | (IsRequired extends true ? never : null)>;
