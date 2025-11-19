import type { ComponentSchema, ObjectField, ObjectFieldOptions } from "../../api.d.ts";
export declare function object<Fields extends Record<string, ComponentSchema>>(fields: Fields, opts?: ObjectFieldOptions): ObjectField<Fields>;
