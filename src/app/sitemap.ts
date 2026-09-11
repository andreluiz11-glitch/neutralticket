import type { MetadataRoute } from "next";

const siteUrl = "https://www.ingresseclub.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/events/reveillon-riviera`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/events/reveillon-araxas-2027`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
