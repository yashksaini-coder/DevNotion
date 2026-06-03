/** Shared design-system stylesheet for the DevNotion dashboard. */
export const STYLES = /* css */ `
  :root {
    --bg: #0a0a0b; --surface: #141417; --surface-2: #1c1c21; --border: #27272a;
    --text: #e7e7ea; --muted: #a1a1aa; --faint: #71717a; --dim: #52525b;
    --brand: #6366f1; --brand-2: #818cf8;
    --green-bg:#052e16; --green:#4ade80; --yellow-bg:#3b2f00; --yellow:#fbbf24;
    --red-bg:#3b0f0f; --red:#f87171; --blue-bg:#1e3a5f; --blue:#60a5fa; --gray-bg:#27272a;
    --radius: 0.75rem; --radius-sm: 0.5rem;
    --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --mono: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; line-height: 1.5; }
  a { color: var(--brand-2); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { font-family: var(--mono); font-size: 0.82em; background: var(--surface-2); padding: 0.15em 0.45em; border-radius: 0.3rem; }
  header.app { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0.9rem 1.5rem; display: flex; align-items: center; gap: 0.85rem; position: sticky; top: 0; z-index: 10; }
  header.app .logo { font-size: 1.3rem; }
  header.app h1 { font-size: 1.1rem; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
  header.app .subtitle { color: var(--faint); font-size: 0.8rem; }
  header.app nav { margin-left: auto; display: flex; gap: 0.6rem; align-items: center; }
  main { max-width: 1080px; margin: 2rem auto; padding: 0 1.5rem; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1.25rem; }
  .card > h2 { font-size: 0.7rem; font-weight: 600; color: var(--faint); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
  .headline { font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1.25; letter-spacing: -0.01em; margin-bottom: 0.5rem; }
  .tldr { color: var(--muted); font-size: 0.95rem; }
  .meta { display: flex; gap: 1.25rem; flex-wrap: wrap; margin-top: 0.9rem; font-size: 0.8rem; color: var(--dim); }
  .meta strong { color: var(--faint); font-weight: 500; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 0.55rem 0.75rem; font-size: 0.7rem; color: var(--faint); text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border); }
  td { padding: 0.8rem 0.75rem; font-size: 0.875rem; border-bottom: 1px solid var(--surface); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tbody tr { transition: background 0.12s; }
  tbody tr:hover td { background: var(--surface-2); }
  .btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1.1rem; border-radius: var(--radius-sm); font-size: 0.875rem; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: opacity 0.15s, background 0.15s; }
  .btn:hover { opacity: 0.9; text-decoration: none; }
  .btn-primary { background: var(--brand); color: #fff; }
  .btn-ghost { background: transparent; border-color: var(--border); color: var(--muted); }
  .btn-sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; }
  .badge { display: inline-flex; align-items: center; padding: 0.2em 0.65em; border-radius: 9999px; font-size: 0.72rem; font-weight: 600; }
  .badge-gray { background: var(--gray-bg); color: var(--muted); }
  .badge-blue { background: var(--blue-bg); color: var(--blue); }
  .badge-yellow { background: var(--yellow-bg); color: var(--yellow); }
  .badge-green { background: var(--green-bg); color: var(--green); }
  .badge-red { background: var(--red-bg); color: var(--red); }
  label { display: block; font-size: 0.82rem; font-weight: 500; color: var(--muted); margin-bottom: 0.4rem; }
  input, select, textarea { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.6rem 0.75rem; color: var(--text); font-size: 0.9rem; outline: none; transition: border-color 0.15s; }
  input:focus, select:focus, textarea:focus { border-color: var(--brand); }
  .field { margin-bottom: 1.25rem; }
  .hint { font-size: 0.74rem; color: var(--dim); margin-top: 0.35rem; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.85rem; }
  .stat { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.85rem; text-align: center; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--brand-2); }
  .stat-label { font-size: 0.68rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.2rem; }
  .empty { text-align: center; padding: 3rem 1rem; color: var(--faint); }
  .notice { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.7rem 1rem; font-size: 0.8rem; color: var(--muted); margin-bottom: 1.25rem; }
  .img-row { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0; }
  .img-row img { max-width: 48%; border-radius: var(--radius-sm); border: 1px solid var(--border); }
  .spinner { display: inline-block; width: 1.5rem; height: 1.5rem; border: 2px solid var(--border); border-top-color: var(--brand); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .center-state { text-align: center; padding: 3rem 1rem; color: var(--faint); }
  .error-state { padding: 1.5rem; background: var(--red-bg); border: 1px solid #7f1d1d; border-radius: var(--radius); }
  .error-state h3 { color: var(--red); margin-bottom: 0.5rem; }
  .error-state pre { color: #fca5a5; font-size: 0.8rem; white-space: pre-wrap; word-break: break-word; }
  @media (max-width: 640px) {
    main { padding: 0 1rem; margin: 1.25rem auto; }
    header.app { padding: 0.8rem 1rem; }
    header.app .subtitle { display: none; }
    .img-row img { max-width: 100%; }
    .meta { gap: 0.75rem; }
    th:nth-child(2), td:nth-child(2) { display: none; }
  }
`;

export interface PageOpts {
  title: string;
  body: string;
  activeNav?: 'history' | 'run';
  showNewRun?: boolean;
  headExtra?: string;
}

/** Wrap inner body HTML in the shared shell (header, nav, theme). */
export function page(opts: PageOpts): string {
  const showNewRun = opts.showNewRun !== false;
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <style>${STYLES}</style>
  ${opts.headExtra ?? ''}
</head>
<body>
  <header class="app">
    <span class="logo">📊</span>
    <div>
      <h1>DevNotion</h1>
      <div class="subtitle">Weekly GitHub activity → blog posts</div>
    </div>
    <nav>
      <a href="/" class="btn btn-ghost btn-sm">History</a>
      ${showNewRun ? '<a href="/run" class="btn btn-primary btn-sm">+ New Run</a>' : ''}
    </nav>
  </header>
  <main>${opts.body}</main>
</body>
</html>`;
}
