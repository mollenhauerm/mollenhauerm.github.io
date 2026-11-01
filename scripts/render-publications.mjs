import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const htmlPath = new URL("../index.html", import.meta.url);
const dataPath = new URL("../publications.json", import.meta.url);
const startMarker = "        <!-- publications:start -->";
const endMarker = "        <!-- publications:end -->";

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function assertKeys(value, expected, label) {
  assert.ok(
    value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`,
  );
  assert.deepEqual(
    Object.keys(value).sort(),
    [...expected].sort(),
    `${label} contains unsupported or missing fields`,
  );
}

function validate(data) {
  assertKeys(data, ["groups"], "publication data");
  assert.ok(Array.isArray(data.groups) && data.groups.length > 0, "groups must be a non-empty array");

  const groupNames = new Set();
  const titles = new Set();

  for (const group of data.groups) {
    assertKeys(group, ["name", "publications"], `group ${group.name ?? ""}`);
    assert.equal(typeof group.name, "string");
    assert.ok(group.name.length > 0, "group names cannot be empty");
    assert.ok(!groupNames.has(group.name), `duplicate group: ${group.name}`);
    groupNames.add(group.name);
    assert.ok(Array.isArray(group.publications), `${group.name} publications must be an array`);

    for (const publication of group.publications) {
      assertKeys(
        publication,
        ["title", "authors", "venue", "url"],
        `publication ${publication.title ?? ""}`,
      );
      assert.equal(typeof publication.title, "string");
      assert.ok(publication.title.length > 0, "publication titles cannot be empty");
      assert.ok(!titles.has(publication.title), `duplicate publication: ${publication.title}`);
      titles.add(publication.title);
      assert.ok(Array.isArray(publication.authors) && publication.authors.length > 0, `${publication.title} needs at least one author`);
      assert.ok(publication.authors.every((author) => typeof author === "string" && author.length > 0), `${publication.title} has an invalid author`);
      assert.equal(typeof publication.venue, "string");
      assert.ok(publication.venue.length > 0, `${publication.title} needs a venue`);
      assert.match(publication.url, /^https?:\/\//, `${publication.title} needs an absolute HTTP(S) URL`);
    }
  }
}

function renderPublication(publication) {
  const title = escapeHtml(publication.title);
  const authors = publication.authors.map(escapeHtml).join(", ");
  const venue = escapeHtml(publication.venue);
  const url = escapeHtml(publication.url);

  return [
    '          <article class="paper">',
    `            <h4>${title}</h4>`,
    `            <p>${authors}</p>`,
    "            <p>",
    `              ${venue} ·`,
    `              <a href="${url}" target="_blank" rel="noopener noreferrer">Paper ↗</a>`,
    "            </p>",
    "          </article>",
  ].join("\n");
}

function renderGroups(groups) {
  return groups
    .map((group) =>
      [
        '        <div class="group">',
        `          <h3>${escapeHtml(group.name)}</h3>`,
        ...group.publications.map(renderPublication),
        "        </div>",
      ].join("\n"),
    )
    .join("\n");
}

const [html, json] = await Promise.all([
  readFile(htmlPath, "utf8"),
  readFile(dataPath, "utf8"),
]);
const data = JSON.parse(json);
validate(data);

const markerPattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);
assert.match(html, markerPattern, "index.html is missing publication markers");
const generatedRegion = `${startMarker}\n${renderGroups(data.groups)}\n${endMarker}`;
const renderedHtml = html.replace(markerPattern, generatedRegion);

if (process.argv.includes("--check")) {
  assert.equal(html, renderedHtml, "index.html publications are stale; run npm run build");
  console.log("Publication data and generated HTML are in sync");
} else {
  await writeFile(htmlPath, renderedHtml);
  console.log(`Rendered ${data.groups.reduce((count, group) => count + group.publications.length, 0)} publications`);
}
