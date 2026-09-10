import {
  ArrowRight,
  BookOpenCheck,
  Cpu,
  GraduationCap,
  Home,
  MapPinned,
  Network,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ExecutionImage } from "@/components/common/ExecutionImage";
import { executionVisuals } from "@/data/execution-visuals";

import "@/styles/about-story.css";

const storyPillars = [
  {
    icon: GraduationCap,
    eyebrow: "More than work",
    title: "Building capabilities for the long term.",
    description:
      "We support our workforce with training, practical guidance, skill development and opportunities to gain experience so people can become more capable, independent and prepared for changing workforce requirements.",
  },
  {
    icon: Home,
    eyebrow: "Closer to home",
    title: "Creating opportunities without unnecessary migration.",
    description:
      "By building a geographically distributed talent network, we aim to help people work, learn and grow within their own city, district or state while businesses gain access to dependable talent across locations.",
  },
  {
    icon: Cpu,
    eyebrow: "Human + technology",
    title: "Technology connects the work. People stay at the centre.",
    description:
      "Digital processes help us understand requirements, identify suitable talent, coordinate assignments and support our workforce. Technology enables the connection, while human support keeps it practical.",
  },
] as const;

const journey = [
  {
    label: "Where it began",
    title: "COVID-19 changed how work reached people.",
    description:
      "Employment uncertainty and large-scale migration highlighted the need for a more accessible, locally connected way of working.",
  },
  {
    label: "What we built",
    title: "A local talent and workforce network.",
    description:
      "Zobhungr Solutions grew around a simple idea: connect businesses with dependable people across locations while helping individuals discover work closer to home.",
  },
  {
    label: "Where we are going",
    title: "400+ workers and a growing ecosystem.",
    description:
      "We continue to expand our network, strengthen training and build practical pathways between business requirements and employment opportunities.",
  },
] as const;

export function AboutStory() {
  const workforceVisual = executionVisuals["workforce-hiring"];
  const fieldVisual = executionVisuals["field-executives"];
  const coordinationVisual = executionVisuals["operations-coordination"];

  return (
    <section className="zb-company-section zb-about-story" aria-labelledby="about-story-title">
      <div className="zb-about-story__lead">
        <div className="zb-about-story__copy">
          <span className="zb-eyebrow">Our story</span>

          <h2 id="about-story-title">Connecting local talent with opportunity.</h2>

          <p className="zb-about-story__intro">
            <strong>Zobhungr Solutions Private Limited</strong> was born from a simple belief: <strong>opportunities should reach people where they are, rather than forcing people to leave their homes in search of work.</strong>
          </p>

          <p>
            Our journey began during the COVID-19 crisis, when employment opportunities became uncertain and migration became a reality for millions of people. We saw the need for a more accessible and locally connected way of working, one that could help people earn from their own cities and communities.
          </p>

          <p>
            That vision led us to build <strong>Zobhungr Solutions</strong>, a <strong>Local Talent &amp; Workforce Solutions</strong> company focused on connecting businesses with dependable talent across different locations while helping individuals discover flexible work opportunities closer to home.
          </p>

          <p>
            We believe that a person&apos;s location should not limit their potential. Through our network, we help businesses find suitable people for their workforce requirements and help individuals access opportunities within their <strong>own city, district or state</strong>, reducing the need for unnecessary migration.
          </p>

          <div className="zb-about-story__principle" aria-label="Our founding principle">
            <MapPinned aria-hidden="true" />
            <div>
              <small>Our founding principle</small>
              <strong>Opportunity should travel farther than people have to.</strong>
            </div>
          </div>
        </div>

        <div className="zb-about-story__visuals" aria-label="Illustrations of ZOBHUNGER workforce activity">
          <figure className="zb-about-story__visual zb-about-story__visual--primary">
            <ExecutionImage
              visual={workforceVisual}
              sizes="(min-width: 1100px) 520px, (min-width: 700px) 52vw, calc(100vw - 48px)"
            />
            <figcaption>
              <UsersRound aria-hidden="true" />
              <span>
                <small>Local talent</small>
                <strong>Finding the right opportunity closer to home.</strong>
              </span>
            </figcaption>
          </figure>

          <div className="zb-about-story__visual-pair">
            <figure className="zb-about-story__visual">
              <ExecutionImage
                visual={fieldVisual}
                sizes="(min-width: 1100px) 250px, (min-width: 700px) 26vw, calc(50vw - 32px)"
              />
              <figcaption>
                <MapPinned aria-hidden="true" />
                <span>
                  <small>Across locations</small>
                  <strong>Work where people already live.</strong>
                </span>
              </figcaption>
            </figure>

            <figure className="zb-about-story__visual">
              <ExecutionImage
                visual={coordinationVisual}
                sizes="(min-width: 1100px) 250px, (min-width: 700px) 26vw, calc(50vw - 32px)"
              />
              <figcaption>
                <Network aria-hidden="true" />
                <span>
                  <small>Connected execution</small>
                  <strong>People, projects and support in one flow.</strong>
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      <div className="zb-about-story__pillars" aria-label="How ZOBHUNGER creates opportunity">
        {storyPillars.map(({ icon: Icon, eyebrow, title, description }, index) => (
          <article key={title}>
            <div className="zb-about-story__pillar-head">
              <span className="zb-about-story__pillar-icon">
                <Icon aria-hidden="true" />
              </span>
              <small>{String(index + 1).padStart(2, "0")}</small>
            </div>
            <span className="zb-eyebrow">{eyebrow}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <div className="zb-about-story__journey" aria-labelledby="about-journey-title">
        <header>
          <div>
            <span className="zb-eyebrow">Our journey</span>
            <h3 id="about-journey-title">From a local need to a growing workforce network.</h3>
          </div>
          <div className="zb-about-story__journey-stat" aria-label="Growing network of more than 400 workers">
            <strong>400+</strong>
            <span>workers in our growing network</span>
          </div>
        </header>

        <ol>
          {journey.map((item, index) => (
            <li key={item.title}>
              <div className="zb-about-story__journey-marker">
                <span>{String(index + 1).padStart(2, "0")}</span>
                {index < journey.length - 1 ? <ArrowRight aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
              </div>
              <small>{item.label}</small>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="zb-about-story__vision">
        <div className="zb-about-story__vision-mark" aria-hidden="true">
          <BookOpenCheck />
        </div>
        <div>
          <span className="zb-eyebrow">Our vision</span>
          <h3>Location should not become a barrier to earning, learning or building a career.</h3>
          <p>
            Our goal is to create a connected workforce ecosystem where businesses can find the right people and individuals can find meaningful opportunities <strong>without having to move away from where they call home.</strong>
          </p>
          <div className="zb-about-story__signature">
            <span>Zobhungr Solutions Private Limited</span>
            <strong>Connecting Local Talent With Opportunity.</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
