import { consola, createConsola } from "consola";

export const logger = createConsola({
	formatOptions: {
		date: true,
		colors: true,
	},
});

export { consola };
