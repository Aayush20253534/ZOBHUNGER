/* eslint-disable @next/next/no-img-element */

const scenes = {
  "team-collaboration":
    "AI-generated illustration of ZOBHUNGER colleagues in burgundy company polos discussing a work plan together in an office.",
  "learning-together":
    "AI-generated illustration of a ZOBHUNGER mentor helping two new colleagues learn a task using a tablet and notebook.",
  "field-opportunities":
    "AI-generated illustration of two ZOBHUNGER field colleagues in branded uniforms planning a store visit outside a neighbourhood shop.",
} as const;

export function CareerImage({
  scene,
  sizes,
  priority = false,
}: {
  scene: keyof typeof scenes;
  sizes: string;
  priority?: boolean;
}) {
  const base = `/images/careers/${scene}`;

  return (
    <div className="zb-careers-image">
      {/* Pre-sized local WebPs keep these scenes usable without an image service.
          Intrinsic dimensions reserve space; only the hero loads eagerly. */}
      <img
        src={`${base}-1200.webp`}
        srcSet={`${base}-600.webp 600w, ${base}-960.webp 960w, ${base}-1200.webp 1200w, ${base}-1536.webp 1536w`}
        sizes={priority ? sizes : `auto, ${sizes}`}
        width={1200}
        height={800}
        alt={scenes[scene]}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
    </div>
  );
}
