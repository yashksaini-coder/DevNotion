import { Router, type IRouter } from 'express';
import { page } from '../views/layout.js';
import { author, socialLinks } from '../../config/author.js';
import { icon } from '../views/icons.js';

const LANDING_CSS = /* css */ `
  .landing { text-align: center; max-width: 920px; margin: 0 auto; padding-top: 2.5rem; }
  .landing > * { animation: fadeUp 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
  .landing > *:nth-child(1) { animation-delay: 0.02s; }
  .landing > *:nth-child(2) { animation-delay: 0.08s; }
  .landing > *:nth-child(3) { animation-delay: 0.16s; }
  .landing > *:nth-child(4) { animation-delay: 0.22s; }
  .landing > *:nth-child(5) { animation-delay: 0.28s; }
  .landing > *:nth-child(6) { animation-delay: 0.34s; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

  .brand { display: inline-flex; align-items: center; gap: 0.6rem; margin-bottom: 2.5rem; }
  .brand .logo { width: 24px; height: 24px; background: var(--accent); display: inline-block; }
  .brand b { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text); }

  .hero { padding: 1rem 0 3rem; }
  .hero .kicker { margin-bottom: 1.5rem; }
  .hero h2 { font-size: clamp(2.5rem, 6.5vw, 4.5rem); font-weight: 700; line-height: 1.02; letter-spacing: -0.03em; color: #ffffff; margin: 0 auto; max-width: 18ch; }
  .hero h2 em { font-style: normal; color: var(--accent); }
  .hero p { margin: 1.5rem auto 0; color: #c7c7cf; font-size: 1.2rem; line-height: 1.6; max-width: 58ch; }
  .hero .cta { margin-top: 2.5rem; display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
  .hero .btn { transition: transform 0.15s ease, background 0.12s, color 0.12s, border-color 0.12s; }
  .hero .btn:hover { transform: translateY(-2px); }

  .flow { display: grid; grid-template-columns: 1fr; border: 1px solid var(--line); margin: 3rem 0; gap: 1px; background: var(--line); }
  .flow .step { background: var(--surface); padding: 1.4rem; text-align: left; transition: transform 0.16s ease, background 0.16s ease; }
  .flow .step:hover { transform: translateY(-3px); background: var(--surface-2); }
  .flow .step .n { font-family: var(--mono); color: var(--accent); font-size: 0.8rem; }
  .flow .step h3 { font-size: 1.05rem; margin: 0.45rem 0 0.3rem; color: #fff; }
  .flow .step p { font-size: 0.82rem; color: var(--muted); }

  .feats { display: grid; grid-template-columns: 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .feat { background: var(--surface); padding: 1.5rem; text-align: left; transition: transform 0.16s ease, background 0.16s ease; }
  .feat:hover { transform: translateY(-3px); background: var(--surface-2); }
  .feat .tag { font-family: var(--mono); font-size: 0.7rem; color: var(--accent); }
  .feat h4 { font-size: 1rem; margin: 0.4rem 0; color: #fff; }
  .feat p { font-size: 0.85rem; color: var(--muted); }

  .land-footer { margin-top: 3.5rem; border-top: 1px solid var(--line-strong); padding: 2.5rem 0 1rem; display: flex; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 1.25rem; text-align: left; }
  .land-footer .who b { display: block; font-size: 1.1rem; color: var(--text); }
  .land-footer .who span { color: var(--faint); font-size: 0.85rem; }
  .socials { margin-left: auto; display: flex; gap: 0.6rem; }
  .social { width: 44px; height: 44px; border: 1px solid var(--line-strong); border-radius: 2px; display: inline-flex; align-items: center; justify-content: center; color: var(--muted); transition: border-color 0.15s ease, color 0.15s ease, transform 0.15s ease; }
  .social:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-2px); }

  @media (min-width: 760px) { .flow { grid-template-columns: repeat(4, 1fr); } .feats { grid-template-columns: repeat(3, 1fr); } }
`;

/** Pure: the landing page HTML (testable without Express). */
export function buildLandingPage(): string {
  const links = socialLinks();
  const repo = links.find((l) => l.key === 'repo')!.url;

  // Footer: author social links only — the repo lives in the hero "Star on GitHub" CTA.
  const footerLinks = links.filter((l) => l.key !== 'repo');
  const socials = footerLinks
    .map(
      (l) =>
        `<a href="${l.url}" target="_blank" rel="noopener noreferrer" aria-label="${l.label}" title="${l.label}" class="social">${icon(l.key)}</a>`,
    )
    .join('');

  const body = `
    <div class="landing">
      <div class="brand"><span class="logo"></span><b>DevNotion</b></div>

      <section class="hero">
        <div class="kicker">Open source · weekly dev blogging</div>
        <h2>Turn your GitHub week into a <em>published</em> blog post.</h2>
        <p>A Mastra pipeline of specialist agents harvests your week, narrates it in your voice, generates the artwork, and publishes to Notion, DEV.to &amp; Hashnode — after you review it.</p>
        <div class="cta">
          <a href="/runs" class="btn btn-primary">Open the dashboard →</a>
          <a href="${repo}" target="_blank" rel="noopener noreferrer" class="btn">★ Star on GitHub</a>
        </div>
      </section>

      <div class="flow">
        <div class="step"><div class="n">01</div><h3>Harvest</h3><p>GitHub GraphQL — commits, PRs, diffs, touched areas.</p></div>
        <div class="step"><div class="n">02</div><h3>Narrate</h3><p>Gemini 3 writes a first-person post. Fail-loud.</p></div>
        <div class="step"><div class="n">03</div><h3>Illustrate</h3><p>A deterministic stats card, used as the cover.</p></div>
        <div class="step"><div class="n">04</div><h3>Publish</h3><p>Notion · DEV.to · Hashnode — on your approval.</p></div>
      </div>

      <div class="label" style="margin-bottom:1rem">Why it's different</div>
      <div class="feats">
        <div class="feat"><div class="tag">REVIEW</div><h4>You approve every post</h4><p>Preview, edit the markdown, then publish. Nothing ships blind.</p></div>
        <div class="feat"><div class="tag">MULTI-LLM</div><h4>Gemini · OpenAI · Claude</h4><p>One provider abstraction; swap with an env var.</p></div>
        <div class="feat"><div class="tag">FAIL-LOUD</div><h4>A bad run publishes nothing</h4><p>Quota or parse errors fail the run, never your feed.</p></div>
      </div>

      <div class="land-footer">
        <div class="who"><b>${author.displayName}</b><span>${author.bio}</span></div>
        <div class="socials">${socials}</div>
      </div>
    </div>`;

  return page({
    title: 'DevNotion — GitHub activity → published writing',
    body,
    hideHeader: true,
    headExtra: `<style>${LANDING_CSS}</style>`,
  });
}

export const landingRouter: IRouter = Router();
landingRouter.get('/', (_req, res) => res.send(buildLandingPage()));
