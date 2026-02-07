self.addEventListener("install", () => {
  console.log("AuctorRC Service Worker installed");
});

self.addEventListener("activate", () => {
  console.log("AuctorRC Service Worker activated");
});
