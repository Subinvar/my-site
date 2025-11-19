import type { AssetFormField } from "../../api.d.ts";
import type { RequiredValidation } from "../utils.d.ts";
export declare function image<IsRequired extends boolean | undefined>({ label, directory, validation, description, publicPath, transformFilename, }: {
    label: string;
    directory?: string;
    validation?: {
        isRequired?: IsRequired;
    };
    description?: string;
    publicPath?: string;
    /**
     * This function will only be used when `fields.image` is used in a field like `fields.markdoc`/`fields.mdx`.
     *
     * When used outside of editor fields, this function will **not** be used. Instead only the extension of the uploaded file is used and the start of the filename is based on the field key.
     */
    transformFilename?: (originalFilename: string) => string;
} & RequiredValidation<IsRequired>): AssetFormField<{
    data: Uint8Array;
    extension: string;
    filename: string;
} | null, {
    data: Uint8Array;
    extension: string;
    filename: string;
} | (IsRequired extends true ? never : null), string | (IsRequired extends true ? never : null)>;
