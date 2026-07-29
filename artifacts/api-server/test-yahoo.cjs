(async () => {
  try {
    const res = await fetch("https://search.yahoo.com/search?p=latest+news");
    const html = await res.text();
    console.log(html.includes("algo-sr") ? "Success" : "Failed");
    console.log(html.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
})();
