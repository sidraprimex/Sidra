import type { MetadataRoute } from "next";

const SITE_URL = "https://www.sidrajewels.in";

type PublicRoute = {
  readonly path: string;
  readonly changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  readonly priority: number;
};

const PUBLIC_ROUTES: readonly PublicRoute[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/collections", changeFrequency: "daily", priority: 0.9 },
  { path: "/studios", changeFrequency: "daily", priority: 0.9 },
  { path: "/custom-orders", changeFrequency: "weekly", priority: 0.8 },
  { path: "/journal", changeFrequency: "weekly", priority: 0.7 },
  { path: "/sell-on-sidra", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/support", changeFrequency: "monthly", priority: 0.4 },
  { path: "/shipping-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/no-refund-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
