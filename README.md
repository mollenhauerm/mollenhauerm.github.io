# mollenhauer.dev

Dependency-free static website. GitHub Pages serves `index.html` directly.

## Update publications

Publication data lives in [`publications.json`](publications.json). Entries are grouped under `Published`, `Preprints`, and `Miscellaneous` and appear on the website in the same order as in that file.

Each publication has four fields:

```json
{
  "title": "Paper title",
  "authors": ["First Author", "Second Author"],
  "venue": "Journal or conference, year",
  "url": "https://example.com/paper"
}
```

To add, remove, edit, or reorder publications:

1. Edit `publications.json`.
2. Regenerate the publication HTML:

   ```sh
   npm run build
   ```

3. Verify that the JSON and generated HTML agree:

   ```sh
   npm run check
   ```

4. Review and commit both `publications.json` and the regenerated `index.html`.

The build requires Node.js 18 or newer and does not require `npm install`.

## Preview locally

Run a static server from the repository root, for example:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

Do not edit the publication markup between the `publications:start` and `publications:end` comments in `index.html`; `npm run build` replaces that block from `publications.json`.
