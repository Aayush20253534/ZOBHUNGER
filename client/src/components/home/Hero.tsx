import { ArrowDown, ArrowUpRight, ClipboardCheck, ClipboardList, MapPinned, UsersRound } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { HeroVisualMotion } from "@/components/home/HeroVisualMotion";
import { home } from "@/data/home";
import { site } from "@/data/site";
import "@/styles/home-hero-motion.css";

export function Hero() {
  return (
    <section className="zb-home-hero" aria-labelledby="home-heading">
      <div className="zb-home-hero-copy">
        <p className="zb-eyebrow">{home.hero.eyebrow}</p>
        <h1 id="home-heading">
          {home.hero.title}
        </h1>
        <p className="zb-home-hero-description">{home.hero.description}</p>
        <div className="zb-home-hero-actions">
          <ActionLink href={site.primaryAction.href}>
            Hire workforce <ArrowUpRight aria-hidden="true" />
          </ActionLink>
          <ActionLink href="/solutions" variant="secondary">
            Explore services
          </ActionLink>
        </div>
        <p className="zb-home-worker-link">
          Looking for your next role?{" "}
          <ActionLink href={site.workerAction.href} variant="text">
            Find work
          </ActionLink>
        </p>
      </div>
      <HeroVisualMotion>
        <div className="zb-home-hero-image">
          <ExecutionImage
            visual={home.hero.image}
            sizes="(min-width: 1200px) 420px, (min-width: 900px) 35vw, (min-width: 640px) 560px, calc(100vw - 40px)"
            priority
          />
        </div>
        <div className="zb-hero-execution-rail" aria-label="Plan, deploy and review">
          <div className="zb-hero-rail-line" aria-hidden="true"><span /></div>
          <span><ClipboardCheck aria-hidden="true" /><strong>Plan</strong><small>The brief</small></span>
          <span><UsersRound aria-hidden="true" /><strong>Deploy</strong><small>The team</small></span>
          <span><MapPinned aria-hidden="true" /><strong>Review</strong><small>The work</small></span>
        </div>
        <figcaption>
          <ClipboardList aria-hidden="true" />
          <div>
            <strong>Built around your requirement</strong>
            <p>The roles. The locations. The work ahead.</p>
          </div>
        </figcaption>
      </HeroVisualMotion>
      <div className="zb-home-hero-footer">
        <ul
          className="zb-home-engagements"
          aria-label="Workforce engagement types"
        >
          {home.hero.engagements.map((engagement) => (
            <li key={engagement.title}>
              <strong>{engagement.title}</strong>
              <span>{engagement.description}</span>
            </li>
          ))}
        </ul>
        <a className="zb-home-scroll-link" href="#home-solutions">
          <ArrowDown aria-hidden="true" /> Find your solution
        </a>
      </div>
    </section>
  );
}
