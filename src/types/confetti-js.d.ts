declare module 'confetti-js' {
	type ConfettiSettings = {
		target: HTMLCanvasElement | string;
		max?: number;
		size?: number;
		animate?: boolean;
		props?: string[];
		colors?: Array<[number, number, number]>;
		clock?: number;
		rotate?: boolean;
		start_from_edge?: boolean;
		respawn?: boolean;
	};

	export default class ConfettiGenerator {
		constructor(settings: ConfettiSettings);
		render(): void;
		clear(): void;
	}
}
