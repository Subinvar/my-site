import type { BasicFormField } from "../../api.d.ts";
import type { RequiredValidation } from "../utils.d.ts";
export declare function integer<IsRequired extends boolean | undefined>({ label, defaultValue, validation, description, }: {
    label: string;
    defaultValue?: number;
    validation?: {
        isRequired?: IsRequired;
        min?: number;
        max?: number;
    };
    description?: string;
} & RequiredValidation<IsRequired>): BasicFormField<number | null, number | (IsRequired extends true ? never : null)>;
