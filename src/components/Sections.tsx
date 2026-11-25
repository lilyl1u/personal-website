import { about, contact, experience, projects, site, skills } from '../content';
import { Txt } from './Txt';

export const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
] as const;

const num = (i: number) => String(i + 1).padStart(2, '0');

function Ext() {
  return (
    <svg className="ext" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2.2 7.8 7.8 2.2M3.4 2.2h4.4v4.4" />
    </svg>
  );
}

function Head({ index, title, id }: { index: number; title: string; id: string }) {
  return (
    <header className="liner-head">
      <span className="caps crumb">
        {num(index)} · Side {index < 3 ? 'A' : 'B'}
      </span>
      <h2 id={`${id}-h`}>{title}</h2>
    </header>
  );
}

export function Sections() {
  return (
    <>
      <section className="cover liner" aria-labelledby="name">
        <span className="caps crumb">Portfolio · {new Date().getFullYear()}</span>
        <h1 id="name">{site.name}</h1>
        <p className="lede">{site.role}</p>
        <p className="cover-line">
          <Txt>{site.heroLine}</Txt>
        </p>
        <p className="cover-meaning">
          <Txt>{site.vinylMeaning}</Txt>
        </p>
      </section>

      <section id="about" className="liner" aria-labelledby="about-h">
        <Head id="about" index={0} title={about.title} />
        <div className="about-intro">
          <figure className="photo">
            {about.photo ? (
              <img src={about.photo} alt={`Portrait of ${site.name}`} />
            ) : (
              <figcaption>
                <Txt>{about.photoPlaceholder}</Txt>
              </figcaption>
            )}
          </figure>
          <p className="lede">
            <Txt>{about.lede}</Txt>
          </p>
        </div>
        {about.paragraphs.map((p, i) => (
          <p key={i}>
            <Txt>{p}</Txt>
          </p>
        ))}
        <dl className="facts">
          {about.facts.map(f => (
            <div key={f.label}>
              <dt className="caps">{f.label}</dt>
              <dd>
                <Txt>{f.value}</Txt>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {projects.length > 0 && (
        <section id="projects" className="liner" aria-labelledby="projects-h">
          <Head id="projects" index={1} title="Projects" />
          <p className="caps side-note">Side A · Selected work</p>
          <ol className="tracks">
            {projects.map((p, i) => (
              <li key={i} className="track">
                <span className="caps no">A{i + 1}</span>
                <div className="track-main">
                  <div className="track-top">
                    <h3>
                      <Txt>{p.title}</Txt>
                    </h3>
                  </div>
                  <p className="track-summary">
                    <Txt>{p.summary}</Txt>
                  </p>
                  <ul className="points">
                    {p.points.map((pt, j) => (
                      <li key={j}>
                        <Txt>{pt}</Txt>
                      </li>
                    ))}
                  </ul>
                  <div className="track-foot">
                    <ul className="stack" aria-label="Built with">
                      {p.stack.map(s => (
                        <li key={s}>
                          <Txt>{s}</Txt>
                        </li>
                      ))}
                    </ul>
                    {p.links.length > 0 && (
                      <span className="track-links">
                        {p.links.map(l => (
                          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
                            {l.label}
                            <Ext />
                          </a>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {experience.length > 0 && (
        <section id="experience" className="liner" aria-labelledby="experience-h">
          <Head id="experience" index={2} title="Experience" />
          <ol className="roles">
            {experience.map((r, i) => (
              <li key={i} className="role">
                <span className="caps when">
                  <Txt>{r.dates}</Txt>
                </span>
                <div>
                  <h3>
                    <Txt>{r.role}</Txt>
                  </h3>
                  <p className="org">
                    <Txt>{r.org}</Txt> · <Txt>{r.location}</Txt>
                  </p>
                  <ul className="points">
                    {r.points.map((pt, j) => (
                      <li key={j}>
                        <Txt>{pt}</Txt>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {skills.length > 0 && (
        <section id="skills" className="liner" aria-labelledby="skills-h">
          <Head id="skills" index={3} title="Skills" />
          <div className="skills">
            {skills.map(g => (
              <div key={g.label} className="skill-group">
                <h3 className="caps">{g.label}</h3>
                <ul>
                  {g.items.map(s => (
                    <li key={s}>
                      <Txt>{s}</Txt>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="contact" className="liner" aria-labelledby="contact-h">
        <Head id="contact" index={4} title={contact.title} />
        <p className="lede">
          <Txt>{contact.lede}</Txt>
        </p>
        <dl className="facts">
          {contact.links.map(l => (
            <div key={l.label}>
              <dt className="caps">{l.label}</dt>
              <dd>
                <a href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <Txt>{l.value}</Txt>
                  {l.href.startsWith('http') && <Ext />}
                </a>
              </dd>
            </div>
          ))}
        </dl>
        <footer className="caps foot">
          <span>{contact.footer}</span>
          <a href="#top">Back to the top ↑</a>
        </footer>
      </section>
    </>
  );
}
