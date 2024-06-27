export type NgtProperties<T> = Pick<T, { [K in keyof T]: T[K] extends (_: any) => any ? never : K }[keyof T]>;
export type NgtAnyRecord = Record<string, any>;

export type NgtEquConfig = {
	/** Compare arrays by reference equality a === b (default), or by shallow equality */
	arrays?: 'reference' | 'shallow';
	/** Compare objects by reference equality a === b (default), or by shallow equality */
	objects?: 'reference' | 'shallow';
	/** If true the keys in both a and b must match 1:1 (default), if false a's keys must intersect b's */
	strict?: boolean;
};
