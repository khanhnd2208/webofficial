import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

expand(config({ path: '.env.local', quiet: true }));

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			testIgnore: /teaching-learning-experience-mobile\.spec\.ts/,
		},
		{
			name: 'mobile-chrome-smoke',
			testMatch: /(mobile-smoke|teaching-learning-experience-mobile)\.spec\.ts/,
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'mobile-safari-smoke',
			testMatch: /(mobile-smoke|teaching-learning-experience-mobile)\.spec\.ts/,
			use: { ...devices['iPhone 13'] },
		},
	],
	webServer: process.env.CI
		? {
				command: 'npm run start -- -p 3000',
				url: 'http://localhost:3000',
				reuseExistingServer: false,
				timeout: 180_000,
				env: {
					...process.env,
					RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_e2e_not_used',
					INQUIRY_FROM_EMAIL: process.env.INQUIRY_FROM_EMAIL ?? 'Duy Khanh <noreply@example.com>',
					INQUIRY_NOTIFY_EMAIL: process.env.INQUIRY_NOTIFY_EMAIL ?? 'admin@example.com',
					AUTH_SECRET: process.env.AUTH_SECRET ?? 'e2e-rate-limit-secret',
				},
			}
		: undefined,
});
