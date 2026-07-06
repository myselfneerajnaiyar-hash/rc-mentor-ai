export default function sitemap() {
  const baseUrl = "https://rc.auctorlabs.in";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/preview`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/workout`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/welcome`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/daily-challenge`,
      lastModified: new Date(),
    },
  ];
}