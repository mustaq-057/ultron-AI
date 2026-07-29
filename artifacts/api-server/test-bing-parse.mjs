import * as cheerio from "cheerio";

(async () => {
  const res = await fetch("https://www.bing.com/search?q=spider-man+brand+new+day+screen+count", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const results = [];
  $('.b_algo').each((_, el) => {
    const title = $(el).find('h2 a').text();
    const url = $(el).find('h2 a').attr('href');
    const desc = $(el).find('.b_caption p, .b_algoSlug').text();
    if (title && url) {
      results.push({ title, url, desc });
    }
  });
  console.log("Algo results length:", results.length);
  if (results.length > 0) {
    console.log("First result:", results[0]);
  } else {
    console.log("Title of page:", $('title').text());
  }
})();
