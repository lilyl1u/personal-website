import { forwardRef } from 'react';
import { site } from '../content';
import { plain, Txt } from './Txt';

export type StageRefs = {
  stage: HTMLDivElement | null;
  orbit: HTMLDivElement | null;
  spin: HTMLDivElement | null;
  disc: HTMLCanvasElement | null;
  ribbons: HTMLCanvasElement | null;
  tabA: HTMLDivElement | null;
  tabB: HTMLDivElement | null;
  badgeOrbit: HTMLDivElement | null;
  badge: HTMLDivElement | null;
  heroNote: HTMLDivElement | null;
  cue: HTMLDivElement | null;
};

/** Paper label printed on the record, with text running around it. */
function Sticker() {
  return (
    <svg className="sticker" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id="ring" d="M100,100 m-79,0 a79,79 0 1,1 158,0 a79,79 0 1,1 -158,0" />
      </defs>
      <circle cx="100" cy="100" r="99" className="sticker-paper" />
      <circle cx="100" cy="100" r="93" className="sticker-line" />
      <circle cx="100" cy="100" r="67" className="sticker-line thin" />
      <text className="sticker-text">
        <textPath href="#ring" startOffset="0" textLength={2 * Math.PI * 79 - 6} lengthAdjust="spacing">
          {plain(site.labelRing)} ·
        </textPath>
      </text>
    </svg>
  );
}

export const Stage = forwardRef<StageRefs>(function Stage(_, ref) {
  const refs = ref as React.MutableRefObject<StageRefs>;
  const set = <K extends keyof StageRefs>(k: K) => (node: StageRefs[K]) => {
    refs.current[k] = node;
  };

  return (
    <div className="stage" ref={set('stage')} aria-hidden="true">
      <div className="orbit" ref={set('orbit')}>
        <canvas className="disc" ref={set('disc')} />
        <div className="spin" ref={set('spin')}>
          <Sticker />
        </div>
      </div>

      <canvas className="ribbons" ref={set('ribbons')} />
      <div className="ribbon-tab" ref={set('tabA')} />
      <div className="ribbon-tab" ref={set('tabB')} />

      <div className="orbit badge-orbit" ref={set('badgeOrbit')}>
        <div className="badge" ref={set('badge')}>
          <span className="badge-top">{site.labelTop}</span>
          <span className="badge-bottom">{site.labelBottom}</span>
          <span className="badge-side">Side A</span>
        </div>
      </div>

      <div className="hero-note" ref={set('heroNote')}>
        <span className="mono kicker">{site.heroKicker}</span>
        <p>
          <Txt>{site.heroLine}</Txt>
        </p>
        <span className="hero-meaning">
          <Txt>{site.vinylMeaning}</Txt>
        </span>
      </div>

      <div className="cue" ref={set('cue')}>
        <span className="mono">Drop the needle</span>
        <i>↓</i>
      </div>
    </div>
  );
});
