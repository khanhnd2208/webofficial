import { assertProductionEnvironment } from './lib/startupEnv';

export function register(): void {
	assertProductionEnvironment();
}
