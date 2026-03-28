/* ════════════════════════════════════════════════════════════════════════
   Device Fingerprint — Lightweight browser fingerprinting
   
   Generates a deterministic hash from browser/device characteristics
   to track same-device multiple test submissions.
   
   Signals used (privacy-respecting — no tracking cookies):
   - Canvas rendering hash (GPU/font rendering differences)
   - Screen dimensions + color depth + pixel ratio
   - Timezone offset + Intl timezone name
   - Navigator platform + language + hardware concurrency
   - WebGL renderer (GPU identifier)
   
   NOT used: cookies, localStorage IDs, IP (server-side only)
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Generate a lightweight device fingerprint.
 * Returns a hex-encoded SHA-256 hash of combined signals.
 */
export async function generateDeviceFingerprint(): Promise<string> {
	const signals: string[] = [];

	// 1. Screen characteristics
	try {
		signals.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`);
		signals.push(`dpr:${window.devicePixelRatio}`);
		signals.push(`avail:${screen.availWidth}x${screen.availHeight}`);
	} catch {
		signals.push('screen:unknown');
	}

	// 2. Timezone
	try {
		signals.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
		signals.push(`tzoff:${new Date().getTimezoneOffset()}`);
	} catch {
		signals.push('tz:unknown');
	}

	// 3. Navigator basics
	try {
		signals.push(`platform:${navigator.platform}`);
		signals.push(`lang:${navigator.language}`);
		signals.push(`cores:${navigator.hardwareConcurrency}`);
		signals.push(`touch:${navigator.maxTouchPoints}`);
	} catch {
		signals.push('nav:unknown');
	}

	// 4. Canvas fingerprint (GPU rendering differences)
	try {
		const canvas = document.createElement('canvas');
		canvas.width = 200;
		canvas.height = 50;
		const ctx = canvas.getContext('2d');
		if (ctx) {
			// Draw text with specific font/style to capture rendering differences
			ctx.textBaseline = 'top';
			ctx.font = "14px 'Arial'";
			ctx.fillStyle = '#f60';
			ctx.fillRect(125, 1, 62, 20);
			ctx.fillStyle = '#069';
			ctx.fillText('Cwm fjordbank 🎭', 2, 15);
			ctx.fillStyle = 'rgba(102,204,0,0.7)';
			ctx.fillText('Cwm fjordbank 🎭', 4, 17);
			signals.push(`canvas:${canvas.toDataURL()}`);
		}
	} catch {
		signals.push('canvas:unsupported');
	}

	// 5. WebGL renderer (GPU identifier)
	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		if (gl && gl instanceof WebGLRenderingContext) {
			const ext = gl.getExtension('WEBGL_debug_renderer_info');
			if (ext) {
				signals.push(`gpu:${gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}`);
				signals.push(`vendor:${gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)}`);
			}
		}
	} catch {
		signals.push('webgl:unsupported');
	}

	// 6. Audio context (audio stack fingerprint)
	try {
		const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (AudioCtx) {
			const ctx = new AudioCtx();
			signals.push(`audio:${ctx.sampleRate}`);
			ctx.close();
		}
	} catch {
		signals.push('audio:unsupported');
	}

	// Hash all signals together
	const raw = signals.join('|');
	return await sha256(raw);
}

/**
 * Compute SHA-256 hash using Web Crypto API.
 */
async function sha256(input: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);

	try {
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	} catch {
		// Fallback: simple djb2-based hash (not cryptographic, but deterministic)
		let hash = 5381;
		for (let i = 0; i < input.length; i++) {
			hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xFFFFFFFF;
		}
		return `fallback-${(hash >>> 0).toString(16).padStart(8, '0')}`;
	}
}
