export type NgtProperties<T> = Pick<T, { [K in keyof T]: T[K] extends (_: any) => any ? never : K }[keyof T]>;
export type NgtAnyRecord<Value = any> = Record<string, Value>;
