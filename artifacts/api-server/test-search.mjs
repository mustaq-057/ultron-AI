import googlethis from 'googlethis';
googlethis.search('test query', { page: 0, safe: false, parse_ads: false })
  .then(r => { console.log('SUCCESS. Results:', r.results.slice(0,2).map(x => x.title)); process.exit(0); })
  .catch(e => { console.error('FAIL:', e.message); process.exit(1); });
