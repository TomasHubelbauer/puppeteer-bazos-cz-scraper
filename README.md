# Bazos Puppeteer Scraper

Bazos.cz scraper built using Puppeteer used for obtaining search results as JSON.

## Running

- `npm run demo` for an iPhone in Prague 1 between 3000 and 6000 CZK demo query

![](demo.gif)

- `npm start -- search {query} {zip} -f {priceFrom} -t {priceTo}` for custom query (headless)
- `npm start -- search {query} {zip} -f {priceFrom} -t {priceTo} -w` for custom query (non-headless)
- `npm start -- -h` for the program help
- `npm start -- search -h` for the `search` command help

You can add `--record` to have the script produce `trace.json` with embedded
screenshots (search for `snapshot`).

## To-Do

Also see `TODO` comments in the code.

Open detail for each post and fetch full description from it.

Implement diff to report updates/inserts in a separate file.

Run this in Azure Pipelines using a scheduled trigger and
push the generated report back to the repo and set up GitHub
Pages for the repository to show it on a live URL.

Consider having the pipeline send out an email with a diff.

Consider going directly to the search URL instead of filling in the form.
The search URL structure is likely to be more stable than the form DOM as
Bazos might consider people who bookmark search results, but has no reason
to care about the form DOM being stable for 3rd parties.

Implement session recording using tracing by stitching together the snapshots
and creating a GIF out of them which is then saved to `demo.gif`.
If this is too slow (the trace takes a while to save), taking screenshots myself
should fix it albeit at the cost of more fluff code.

The related Puppeteer GitHub issue also discusses using CDP directly to start a
screencast:
https://github.com/GoogleChrome/puppeteer/issues/478

Or maybe use `getDisplayMedia` and send that over a WebRTC stream and listen to
it in Node? But that would get me a video stream and conversion to GIF would be
more work than stiching a GIF together from screenshots probably. Do not want to
introduce a dependency on FFMPEG.
