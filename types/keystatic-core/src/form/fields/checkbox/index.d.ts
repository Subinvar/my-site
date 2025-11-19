import type { BasicFormField } from "../../api.d.ts";
export declare function checkbox({ label, defaultValue, description, }: {
    label: string;
    defaultValue?: boolean;
    description?: string;
}): BasicFormField<boolean>;
