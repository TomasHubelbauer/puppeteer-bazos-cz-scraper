# Bazos Puppeteer Scraper

Bazos.cz scraper built using Puppeteer used for obtaining search results as JSON.

## Running

```sh
cd src
nvm use
yarn
node --experimental-modules index.mjs "query" zip priceMin priceMax # Or `nodemon` for continuous file change watching.
```

## Studying

See [development log](doc/notes.md).

## Contributing

See [suggested contributions](doc/tasks.md).
