export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/preview",
        "/bootcamp-2026",
        "/_next/static/",
        "/assets/student1.jpeg",
        "/assets/student2.jpeg",
        "/assets/student3.jpeg",
        "/assets/founder.jpeg",
        "/assets/video-1.jpeg",
        "/assets/video1.mp4",
        "/assets/video2.jpeg",
        "/assets/video2.mp4",
        "/assets/video3.jpeg",
        "/assets/video3.mp4",
      ],
      disallow: "/",
    },
  };
}
