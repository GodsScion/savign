import type { MetadataRoute } from "next";
import { SITE_NAME, routes } from "./lib/seo";

export const dynamic = "force-static";

const GROUND = "#0e0c09";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: routes["/"].description,
    start_url: "/",
    display: "browser",
    background_color: GROUND,
    theme_color: GROUND,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/og/logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
