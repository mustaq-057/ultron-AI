import { search } from "duck-duck-scrape";

(async () => {
  try {
    const results = await search("latest news", { safeSearch: 0 });
    console.log("Success:", results.results.length);
  } catch (e) {
    console.error("Search failed:", e);
  }
})();
