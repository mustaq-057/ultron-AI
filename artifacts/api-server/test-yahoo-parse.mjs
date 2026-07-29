import * as cheerio from "cheerio";

(async () => {
  const res = await fetch("https://search.yahoo.com/search?p=spider-man+brand+new+day+screen+count", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const results = [];
  $('.algo').each((_, el) => {
    const title = $(el).find('h3.title a').text();
    const url = $(el).find('h3.title a').attr('href');
    const desc = $(el).find('.compText, .fc-falcon').text();
    if (title && url) {
      results.push({ title, url, desc });
    }
  });
  console.log("Algo results:", results);

  // If empty, let's just grab all a hrefs to see what's going on
  if (results.length === 0) {
    console.log("HTML Snippet:", html.substring(0, 1000));
  }
})();
