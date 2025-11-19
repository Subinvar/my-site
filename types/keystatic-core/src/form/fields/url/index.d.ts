import type { BasicFormField } from "../../api.d.ts";
import type { RequiredValidation } from "../utils.d.ts";
export declare function url<IsRequired extends boolean | undefined>({ label, defaultValue, validation, description, }: {
    label: string;
    defaultValue?: string;
    validation?: {
        isRequired?: IsRequired;
    };
    description?: string;
} & RequiredValidation<IsRequired>): BasicFormField<string | null, string | (IsRequired extends true ? never : null)>;
