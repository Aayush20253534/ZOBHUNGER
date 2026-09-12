import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8d0d18",
    icons: [
      {
        src: "/Logo/Logo.png",
        sizes: "1254x1254",
        type: "image/png",
      },
    ],
  };
}
