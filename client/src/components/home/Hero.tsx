import { ArrowDown, ArrowUpRight, ClipboardList } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { home } from "@/data/home";
import { site } from "@/data/site";

export function Hero() {
  return (
    <section className="zb-home-hero" aria-labelledby="home-heading">
      <div className="zb-home-hero-copy">
        <p className="zb-eyebrow">{home.hero.eyebrow}</p>
        <h1 id="home-heading">
          {home.hero.title} <span>{home.hero.emphasis}</span>
        </h1>
        <p className="zb-home-hero-description">{home.hero.description}</p>
        <div className="zb-home-hero-actions">
          <ActionLink href={site.primaryAction.href}>
            Hire workforce <ArrowUpRight aria-hidden="true" />
          </ActionLink>
          <ActionLink href="/solutions" variant="secondary">
            Explore solutions
          </ActionLink>
        </div>
        <p className="zb-home-worker-link">
          Looking for your next role?{" "}
          <ActionLink href={site.workerAction.href} variant="text">
            Find work
          </ActionLink>
        </p>
      </div>
      <figure className="zb-home-hero-figure">
        <div className="zb-home-hero-image">
          {/* Pre-sized local variants avoid a second lossy image conversion. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={home.hero.image.src}
            srcSet={home.hero.image.srcSet}
            alt={home.hero.image.alt}
            width={2400}
            height={1600}
            sizes="(min-width: 1200px) 500px, (min-width: 900px) 43vw, (min-width: 640px) 560px, calc(100vw - 40px)"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <figcaption>
          <ClipboardList aria-hidden="true" />
          <div>
            <strong>Built around your requirement</strong>
            <p>The roles. The locations. The work ahead.</p>
          </div>
        </figcaption>
      </figure>
      <div className="zb-home-hero-footer">
        <ul
          className="zb-home-engagements"
          aria-label="Workforce engagement types"
        >
          {home.hero.engagements.map((engagement) => (
            <li key={engagement}>{engagement}</li>
          ))}
        </ul>
        <a className="zb-home-scroll-link" href="#home-solutions">
          <ArrowDown aria-hidden="true" /> Find your solution
        </a>
      </div>
    </section>
  );
}
