# Bazos Puppeteer Scraper

Bazos.cz scraper built using Puppeteer used for obtaining search results as JSON.

## Running

- `npm run demo` for an iPhone in Prague 1 between 3000 and 6000 CZK demo query

![](demo.gif)

- `npm start -- search {query} {zip} -f {priceFrom} -t {priceTo}` for custom query (headless)
- `npm start -- search {query} {zip} -f {priceFrom} -t {priceTo} -w` for custom query (non-headless)
- `npm start -- -h` for the program help
- `npm start -- search -h` for the `search` command help

## To-Do

Also see `TODO` comments in the code.

Open detail for each post and fetch full description from it.

Implement diff to report updates/inserts in a separate file.

Run this in Azure Pipelines using a scheduled trigger and
push the generated report back to the repo and set up GitHub
Pages for the repository to show it on a live URL.

Consider having the pipeline send out an email with a diff.
