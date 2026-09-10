/* eslint-disable @next/next/no-img-element */
import "@/styles/public-visual-story.css";

export function WorkplacePhoto() {
  return (
    <figure className="zb-about-workplace-photo">
      <img
        src="/images/home/workforce-team-1280.webp"
        srcSet="/images/home/workforce-team-640.webp 640w, /images/home/workforce-team-1280.webp 1280w, /images/home/workforce-team-2400.webp 2400w"
        sizes="(min-width: 1100px) 1080px, calc(100vw - 48px)"
        width={1280}
        height={853}
        loading="lazy"
        decoding="async"
        alt="Colleagues collaborating around a tablet in a modern workplace, illustrating coordinated team planning."
      />
      <figcaption className="zb-about-workplace-photo__caption">
        <strong>People, planning and execution work better when they stay connected.</strong>
        <span>Workforce in context</span>
      </figcaption>
    </figure>
  );
}
