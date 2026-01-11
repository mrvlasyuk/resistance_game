const routes = [
  { path: '1/', shot: 'captain-m4-specialrule' },
  { path: '2/', shot: 'team-vote-m4-tension' },
  { path: '3/', shot: 'mission-vote-m4-private' },
  { path: '4/', shot: 'mission-result-m4-fail-2red' },
];

const port = process.env.PORT ?? '5173';
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}/`;
const base = new URL(baseUrl);

console.log('Short demo links:');
for (const r of routes) {
  const url = new URL(r.path, base);
  console.log(`- /${r.path.replace(/\\/$/, '')} -> ${r.shot}: ${url.toString()}`);
}
