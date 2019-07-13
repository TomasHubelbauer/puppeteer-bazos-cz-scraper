# Bazos Puppeteer Scraper

Bazos.cz scraper built using Puppeteer used for obtaining search results as JSON.

## Running

```sh
cd src
nvm use
yarn
node --experimental-modules index.mjs "query" zip priceMin priceMax # Or `nodemon` for continuous file change watching.
```

## To-Do

Also see `TODO` comments in the code.

Open detail for each post and fetch full description from it.

Persist captured errors to a log file.

Implement diff to report updates/inserts in a separate file.

Add a guide on how to hook up with cron for email reporting.

Run this in Azure Pipelines using a scheduled trigger and
push the generated report back to the repo and set up GitHub
Pages for the repository to show it on a live URL.
