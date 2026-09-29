/**
 * Client half of the Turnstile check on the signup form.
 *
 * The script is fetched only when the form mounts, and in explicit-render mode
 * so the form controls the widget's lifecycle: a token is single-use, and the
 * page stays open after a failed attempt, so it has to be reset before a retry.
 */

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Public by design. The secret lives only in the Worker (TURNSTILE_SECRET). */
export const TURNSTILE_SITEKEY = '0x4AAAAAAFJA8D_SgZPmcokB';

type RenderOptions = {
  sitekey: string;
  action: string;
  execution: 'render' | 'execute';
  appearance: 'always' | 'execute' | 'interaction-only';
  callback: (token: string) => void;
  'error-callback': () => boolean | void;
  'timeout-callback': () => void;
};

export type TurnstileApi = {
  render(container: HTMLElement, options: RenderOptions): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

/** Loads the Turnstile script once and resolves with its API. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;

  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('turnstile_unavailable'));
    };
    script.onerror = () => {
      // Allow a later mount to try again rather than caching the failure.
      loading = null;
      reject(new Error('turnstile_load_failed'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
