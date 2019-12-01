# Puppeteer Bazos.cz Scraper

Bazos.cz scraper built using Puppeteer used for obtaining search results as JSON.

## Running

- `npm run demo` to run a demo query *iPhone in Prague 1 between 3000 and 6000 CZK*

![](screenshot.gif)

- `npm start -- search {query} {zip} -f {priceFrom} -t {priceTo}` for custom query (headless)
- `npm start -- search {query} {zip} -f {priceFrom} -t {priceTo} -w` for custom query (non-headless)
- `npm start -- -h` for the program help
- `npm start -- search -h` for the `search` command help

You can add `--record` to have the script produce the `screenshot.gif` animation.

## To-Do

### Open detail for each post and fetch full description from it.

### Implement diff to report updates/inserts in a separate file.

### Run this in Github Actions using a scheduled trigger

Push the generated report back to the repo and set up GitHub
Pages for the repository to show it on a live URL.

### Consider having the pipeline send out an email with a diff

### Consider going directly to the search URL instead of filling in the form

The search URL structure is likely to be more stable than the form DOM as
Bazos might consider people who bookmark search results, but has no reason
to care about the form DOM being stable for 3rd parties.
