import Image from "next/image";
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
        <ul
          className="zb-home-engagements"
          aria-label="Workforce engagement types"
        >
          {home.hero.engagements.map((engagement) => (
            <li key={engagement}>{engagement}</li>
          ))}
        </ul>
      </div>
      <figure className="zb-home-hero-figure">
        <div className="zb-home-hero-image">
          <Image
            src={home.hero.image.src}
            alt={home.hero.image.alt}
            fill
            sizes="(min-width: 1200px) 480px, (min-width: 900px) 42vw, (min-width: 600px) 560px, 92vw"
            preload
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
      <a className="zb-home-scroll-link" href="#home-solutions">
        <ArrowDown aria-hidden="true" /> Find your solution
      </a>
    </section>
  );
}
