/**
 * Shared design system for the DevNotion dashboard — Swiss / International
 * Typographic style: rigid grid, structural rules, bold grotesk type, one hot
 * accent. Dark, high-contrast, mobile-first. Every view routes through page().
 */
export const STYLES = /* css */ `
  :root {
    --bg: #0d0d0f; --surface: #141416; --surface-2: #1a1a1d;
    --line: #2a2a2e; --line-strong: #3f3f46;
    --text: #f4f4f5; --muted: #a1a1aa; --faint: #71717a; --dim: #52525b;
    --accent: #ff4d2e; --accent-ink: #0d0d0f;
    --green: #4ade80; --yellow: #fbbf24; --blue: #60a5fa; --red: #f87171;
    --font: 'Space Grotesk', system-ui, sans-serif;
    --mono: 'IBM Plex Mono', ui-monospace, monospace;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; line-height: 1.5; letter-spacing: -0.005em; }
  a { color: var(--text); text-decoration: none; border-bottom: 1px solid var(--accent); }
  a:hover { color: var(--accent); }
  code { font-family: var(--mono); font-size: 0.82em; color: var(--muted); }

  /* Header */
  header.app { display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.25rem; border-bottom: 1px solid var(--line-strong); position: sticky; top: 0; background: var(--bg); z-index: 10; }
  header.app .logo { width: 26px; height: 26px; background: var(--accent); display: inline-block; }
  header.app h1 { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; }
  header.app .subtitle { display: none; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--faint); }
  header.app nav { margin-left: auto; display: flex; gap: 0.5rem; align-items: center; }

  main { max-width: 1120px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }

  /* Type */
  .headline { font-size: 2rem; font-weight: 700; line-height: 1.02; letter-spacing: -0.03em; color: #fff; margin-bottom: 0.6rem; }
  .tldr { color: var(--muted); font-size: 1rem; max-width: 64ch; }
  .label, .card > h2 { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: var(--faint); }
  .kicker { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: var(--accent); }

  /* Surfaces — rules, not soft cards */
  .card { border: 1px solid var(--line); background: var(--surface); padding: 1.5rem; margin-bottom: 1.25rem; }
  .card > h2 { margin-bottom: 1.1rem; padding-bottom: 0.6rem; border-bottom: 1px solid var(--line); }
  .notice { border: 1px solid var(--line); border-left: 3px solid var(--accent); padding: 0.7rem 1rem; font-size: 0.8rem; color: var(--muted); margin-bottom: 1.5rem; }
  .notice strong { color: var(--text); }

  .meta { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-top: 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dim); }
  .meta strong { color: var(--faint); font-weight: 600; }

  /* Table — Swiss rules */
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 0.6rem 0.75rem; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--faint); border-bottom: 1px solid var(--line-strong); font-weight: 600; }
  td { padding: 0.85rem 0.75rem; font-size: 0.9rem; border-bottom: 1px solid var(--line); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: var(--surface-2); }

  /* Buttons — square, structural */
  .btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.1rem; font-family: var(--font); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; border: 1px solid var(--line-strong); background: transparent; color: var(--text); border-radius: 2px; transition: background 0.12s, color 0.12s, border-color 0.12s; min-height: 44px; }
  .btn:hover { border-color: var(--text); text-decoration: none; }
  .btn-primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .btn-primary:hover { color: var(--accent-ink); filter: brightness(1.08); }
  .btn-ghost { color: var(--muted); }
  .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.72rem; min-height: 0; }

  /* Badges — square, uppercase */
  .badge { display: inline-flex; align-items: center; padding: 0.2em 0.6em; font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 0; border: 1px solid var(--line-strong); color: var(--muted); }
  .badge-gray { color: var(--muted); }
  .badge-blue { color: var(--blue); border-color: var(--blue); }
  .badge-yellow { color: var(--accent); border-color: var(--accent); }
  .badge-green { color: var(--green); border-color: var(--green); }
  .badge-red { color: var(--red); border-color: var(--red); }

  /* Forms */
  label { display: block; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 0.5rem; }
  input, select, textarea { width: 100%; background: var(--bg); border: 1px solid var(--line-strong); padding: 0.7rem 0.85rem; color: var(--text); font-family: var(--font); font-size: 1rem; border-radius: 2px; outline: none; transition: border-color 0.12s; }
  textarea { font-family: var(--mono); font-size: 0.9rem; line-height: 1.6; }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  .field { margin-bottom: 1.5rem; }
  .hint { font-size: 0.72rem; color: var(--dim); margin-top: 0.4rem; }

  /* Stats — grid of rules */
  .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .stat { background: var(--surface); padding: 1.1rem; }
  .stat-value { font-size: 1.9rem; font-weight: 700; letter-spacing: -0.03em; color: #fff; font-variant-numeric: tabular-nums; }
  .stat-label { font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--faint); margin-top: 0.25rem; }

  /* Images */
  .img-row { display: grid; grid-template-columns: 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); margin: 1.25rem 0; }
  .img-row img { width: 100%; display: block; background: var(--surface); }

  /* States */
  .empty { padding: 3rem 1rem; color: var(--faint); border: 1px dashed var(--line-strong); text-align: center; }
  .center-state { text-align: center; padding: 3.5rem 1rem; color: var(--muted); }
  .error-state { padding: 1.5rem; border: 1px solid var(--red); border-left-width: 3px; background: var(--surface); }
  .error-state h3 { color: var(--red); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.9rem; margin-bottom: 0.6rem; }
  .error-state pre { color: #fca5a5; font-family: var(--mono); font-size: 0.8rem; white-space: pre-wrap; word-break: break-word; }
  .spinner { display: inline-block; width: 1.4rem; height: 1.4rem; border: 2px solid var(--line-strong); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Responsive — mobile-first; enhance up */
  @media (min-width: 640px) {
    header.app { padding: 1.1rem 2rem; }
    header.app .subtitle { display: block; }
    main { padding: 2.5rem 2rem 5rem; }
    .headline { font-size: 2.75rem; }
    .stat-grid { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
    .img-row { grid-template-columns: 1fr 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
`;

export interface PageOpts {
  title: string;
  body: string;
  activeNav?: 'history' | 'run';
  showNewRun?: boolean;
  headExtra?: string;
  hideHeader?: boolean;
}

/** Wrap inner body HTML in the shared Swiss shell (header, nav, theme, fonts). */
export function page(opts: PageOpts): string {
  const showNewRun = opts.showNewRun !== false;
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>${STYLES}</style>
  ${opts.headExtra ?? ''}
</head>
<body>
  ${opts.hideHeader ? '' : `<header class="app">
    <a href="/" style="display:flex;align-items:center;gap:0.75rem;border-bottom:none;color:inherit">
      <span class="logo"></span>
      <div>
        <h1>DevNotion</h1>
        <div class="subtitle">GitHub activity → published writing</div>
      </div>
    </a>
    <nav>
      <a href="/runs" class="btn btn-ghost btn-sm" style="border-bottom-color:var(--line-strong)">History</a>
      ${showNewRun ? '<a href="/run" class="btn btn-primary btn-sm" style="border-bottom-color:var(--accent)">+ New Run</a>' : ''}
    </nav>
  </header>`}
  <main>${opts.body}</main>
</body>
</html>`;
}

/** Escape untrusted text for safe interpolation into HTML (attributes + text). */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Token-entry component for the publish gate. Posts the token to /login (which sets a
 * 10-minute unlock session) and returns to `redirect`. The input is named `password`
 * to match the /login handler; `redirect` must be an internal path (safeInternalPath).
 */
export function tokenGate(redirect: string, message = 'Enter the token to unlock publishing'): string {
  return /* html */ `
    <div class="card" style="border-color:var(--accent)">
      <h2 style="font-size:1rem;margin-bottom:0.25rem">🔒 View-only</h2>
      <p style="font-size:0.85rem;color:#a1a1aa;margin-bottom:0.75rem">${escapeHtml(message)}</p>
      <form method="POST" action="/login" style="display:flex;gap:0.5rem;align-items:center">
        <input type="hidden" name="redirect" value="${escapeHtml(redirect)}">
        <input type="password" name="password" placeholder="Token" autocomplete="off" required
          style="flex:1;background:#0f0f0f;border:1px solid #27272a;border-radius:0.4rem;padding:0.55rem;color:#e5e5e5">
        <button type="submit" class="btn btn-primary btn-sm">Unlock</button>
      </form>
    </div>`;
}
