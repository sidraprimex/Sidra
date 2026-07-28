import type { MetadataRoute } from "next";

const SITE_URL = "https://www.sidrajewels.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/studio-admin/",
          "/account/",
          "/checkout/",
          "/cart",
          "/login",
          "/register",
          "/forgot-password",
          "/verify-email",
          "/not-authorized",
          "/order/",
          "/sell-on-sidra/status",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
