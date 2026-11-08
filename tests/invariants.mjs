import fs from "node:fs";
import assert from "node:assert/strict";

const admin = fs.readFileSync("admin.js", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const html = fs.readFileSync("admin.html", "utf8");

// 1. A committed write must not be treated as failed because list refresh is separate.
assert.match(admin, /Download saved successfully\.[\s\S]*?try\{await loadAll\(\)\}catch\(refreshError\)/);
assert.match(admin, /Download deleted successfully\.[\s\S]*?try\{await loadAll\(\)\}catch\(refreshError\)/);

// 2. Logo encoding keeps alpha through WebP or PNG.
assert.match(admin, /toDataURL\("image\/webp",\.78\)/);
assert.match(admin, /preserveAlpha\?"image\/png":"image\/jpeg"/);

// 3. Legacy records without created are not filtered out or silently backfilled on edit.
assert.match(admin, /collection\("downloads"\)\.get\(\)/);
assert.match(app, /collection\("downloads"\)\.get\(\)/);
assert.match(admin, /old\.created!==undefined&&old\.created!==null/);
assert.doesNotMatch(admin, /orderBy\(["']created["']\)/);

// 4. Public search filters the already-loaded array locally.
assert.match(app, /all\.filter\(x=>/);
assert.match(app, /search\.addEventListener\("input",filterAndRender\)/);

// 5. Empty search results explain that the search did not match.
assert.match(app, /No downloads match your search\./);

// 6. Image dimensions and encoded size are bounded.
assert.match(admin, /readImage\(file,max=600/);
assert.match(admin, /out\.length>280000/);

// 7. Brand rendering preserves the OFFICIAL emphasis.
assert.match(app, /function setBrand/);
assert.match(app, /<b>OFFICIAL<\\/b>/);

// 8. Firebase requests have a finite timeout and explicit offline messaging.
assert.match(admin, /function withTimeout/);
assert.match(admin, /navigator\.onLine/);

// 9. Connection status is dynamic rather than hard-coded as Live.
assert.match(html, /id="stat-connection">Checking…/);
assert.match(admin, /textContent="Connected"/);
assert.doesNotMatch(html, />Live<\/strong>/);

console.log("MAXTROIT invariants: 9/9 passed");
