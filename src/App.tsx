import { useEffect, useRef, useState } from 'react';
import { site } from './content';
import { Stage, type StageRefs } from './components/Stage';
import { SECTIONS, Sections } from './components/Sections';
import { createEngine, type Engine } from './vinyl/engine';

const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
}

export default function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<StageRefs>({} as StageRefs);
  const sleeveRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const topbarRef = useRef<HTMLElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [playing, setPlaying] = useState(() => !prefersReduced());
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    const s = stageRefs.current;
    const engine = createEngine({
      root: rootRef.current!,
      stage: s.stage!,
      orbit: s.orbit!,
      spin: s.spin!,
      disc: s.disc!,
      ribbons: s.ribbons!,
      tabs: [s.tabA!, s.tabB!],
      badgeOrbit: s.badgeOrbit!,
      badge: s.badge!,
      heroNote: s.heroNote!,
      cue: s.cue!,
      sleeve: sleeveRef.current!,
      content: contentRef.current!,
      rail: railRef.current!,
      toggle: toggleRef.current!,
      topbar: topbarRef.current!,
    });
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  useEffect(() => {
    engineRef.current?.setPlaying(playing);
  }, [playing]);

  // Highlight the section crossing the middle of the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach(s => {
      const node = document.getElementById(s.id);
      if (node) io.observe(node);
    });
    const top = document.querySelector('.cover');
    if (top) io.observe(top);
    return () => io.disconnect();
  }, []);

  // Sections fade up as they enter, once.
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    document.querySelectorAll('.liner').forEach(n => io.observe(n));
    return () => io.disconnect();
  }, []);

  const nav = (
    <ol>
      {SECTIONS.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            aria-current={active === s.id ? 'true' : undefined}
            onClick={e => {
              e.preventDefault();
              jump(s.id);
              history.replaceState(null, '', `#${s.id}`);
            }}
          >
            <span className="caps n">{String(i + 1).padStart(2, '0')}</span>
            <span className="l">{s.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="app" ref={rootRef} id="top">
      <a className="skip" href="#about" onClick={e => { e.preventDefault(); jump('about'); }}>
        Skip to content
      </a>

      <Stage ref={stageRefs} />
      <div className="sleeve" ref={sleeveRef} aria-hidden="true" />

      <header className="topbar" ref={topbarRef}>
        <a href="#top" className="brand" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' }); }}>
          <i className="dot" />
          {site.name}
        </a>
        <span className="caps status">
          <i className="dot" />
          {site.status}
        </span>
      </header>

      <nav className="rail" ref={railRef} aria-label="Sections">
        {nav}
      </nav>

      <main>
        <div className="intro-space" />
        <div className="content" ref={contentRef}>
          <nav className="tabs" aria-label="Section tabs">
            {nav}
          </nav>
          <Sections />
        </div>
      </main>

      <button
        ref={toggleRef}
        type="button"
        className="spin-toggle"
        aria-pressed={playing}
        aria-label={playing ? 'Pause the record' : 'Play the record'}
        title={playing ? 'Pause the record' : 'Play the record'}
        onClick={() => setPlaying(p => !p)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {playing ? <path d="M8 5v14M16 5v14" /> : <path d="M7 4.5v15l12-7.5z" />}
        </svg>
      </button>
    </div>
  );
}
