import type { cloudImageSchema } from "../../../component-blocks/cloud-image-schema.d.ts";
import type { ObjectField } from "../../api.d.ts";
export declare function cloudImage({ label, description, validation, }: {
    label: string;
    description?: string;
    validation?: {
        isRequired?: boolean;
    };
}): ObjectField<typeof cloudImageSchema>;
