import type { BasicFormField } from "../../api.d.ts";
import type { RequiredValidation } from "../utils.d.ts";
export declare function number<IsRequired extends boolean | undefined>({ label, defaultValue, step, validation, description, }: {
    label: string;
    defaultValue?: number;
    step?: number;
    validation?: {
        isRequired?: IsRequired;
        min?: number;
        max?: number;
        step?: boolean;
    };
    description?: string;
} & RequiredValidation<IsRequired>): BasicFormField<number | null, number | (IsRequired extends true ? never : null)>;
