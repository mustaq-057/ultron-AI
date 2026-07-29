

(async () => {
  try {
    const res = await fetch("https://html.duckduckgo.com/html/?q=latest+news", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const html = await res.text();
    console.log(html.includes("result__snippet") ? "Success" : "Failed");
    console.log(html.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
})();
