import puppeteer from 'puppeteer';
import commander from 'commander';
import filenamify from 'filenamify';
import fs from 'fs-extra';
import metadata from './package.json';

commander
  .version(metadata.version)
  .command('search [query] [zip]')
  .description('Searches Bazos.cz using the given search query within the given Czech Republic ZIP code area.')
  .option('-f, --from [amount]', 'price from amount (CZK)')
  .option('-t, --to [amount]', 'price to amount (CZK)')
  .option('-w, --window', 'to run in non-headless mode (windowed)')
  .option('-r, --record', 'record trace / screenshots')
  .action(scrape)
  ;

commander.parse(process.argv);

async function scrape(query, zip, { from: priceMin, to: priceMax, window, record }) {
  console.log(`Searching for '${query}' in Czech Republic ZIP code area ${zip} priced between ${priceMin} and ${priceMax} CZK.`);
  const browser = await puppeteer.launch({ headless: !window, slowMo: 10, defaultViewport: null /* Stretch to size */ });
  const page = (await browser.pages())[0];
  await page.bringToFront();

  if (record) {
    await page.tracing.start({ path: 'trace.json', screenshots: true });
  }

  // Speed up browsing and clean up screenshots by blocking 3rd party networking
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.hostname !== 'bazos.cz' && url.hostname !== 'www.bazos.cz') {
      console.log(url.hostname);
      request.abort()
    } else {
      request.continue();
    }
  });

  await page.goto('https://bazos.cz');

  try {
    const hledatInput = await page.$('#hledat');
    await hledatInput.focus();
    await page.keyboard.type(query);

    // Discard the autocomplete prompt.
    if (window) {
      await page.waitForSelector('#vysledek');
      await page.evaluate(() => document.getElementById('vysledek').remove());
    }

    const hlokalitaInput = await page.$('#hlokalita');
    await hlokalitaInput.focus();
    await page.keyboard.type(zip);

    // Discard the autocomplete prompt.
    if (window) {
      await page.waitForSelector('#vysledekpsc');
      await page.evaluate(() => document.getElementById('vysledekpsc').remove());
    }

    if (priceMin) {
      const cenaodInput = await page.$('input[name=cenaod]');
      await cenaodInput.focus();
      await page.keyboard.type(priceMin);
    }

    if (priceMax) {
      const cenadoInput = await page.$('input[name=cenado]');
      await cenadoInput.focus();
      await page.keyboard.type(priceMax);
    }

    const submitInput = await page.$('input[name=Submit]');
    await submitInput.click();

    await page.waitForNavigation();

    const start = new Date();

    let total;
    const results = [];
    let hasNextPage = false;
    do {


      // Remove the advertisement banner to prevent jump and make screenshots nice
      // Note that this is done this way because request interception doesn't seem to work
      // https://github.com/GoogleChrome/puppeteer/issues/4702
      //await page.addStyleTag({ content: '#adcontainer1 { display: none !important; }' });

      const summaryText = await page.$eval('table.listainzerat > tbody > tr > td', listaTd => listaTd.textContent);
      const summaryTextParts = summaryText.trim().split(/[\s-]/g);
      const firstPostNo = Number(summaryTextParts[1]);
      const lastPostNo = Number(summaryTextParts[2]);
      const pageTotal = lastPostNo - firstPostNo + 1;
      total = Number(summaryTextParts[5]);

      console.log(`Showing posts #${firstPostNo}-${lastPostNo} (${pageTotal} on the page) out of ${total} total results.`);

      const pageResults = await page.evaluate(pageTotal => {
        let results = [];

        const vypisSpans = document.querySelectorAll('span.vypis');
        for (let index = 0; index < vypisSpans.length; index++) {
          const vypisSpan = vypisSpans[index];

          const nadpisA = vypisSpan.querySelector('span.nadpis > a');
          const velikostSpan = vypisSpan.querySelector('span.velikost10');
          const popisDiv = vypisSpan.querySelector('div.popis');
          const cenaSpan = vypisSpan.querySelector('span.cena > b');

          const title = nadpisA.textContent;
          const url = nadpisA.href;
          const [year, month, day] = velikostSpan.lastChild.textContent.substr(4).slice(0, -1).split('.').map(n => Number(n.trim())).reverse();
          const description = popisDiv.textContent;
          const price = Number(cenaSpan.textContent.slice(2, -3).replace(/ /, ''));

          results.push({ title, url, year, month, day, description, price });
        }

        if (results.length !== pageTotal) {
          throw new Error(`Expected to collect ${pageTotal} posts on the page but got ${results.length}.`);
        }

        const strankovaniA = document.querySelector('p.strankovani > a:last-child');
        return { results, nextPageHref: strankovaniA && strankovaniA.href };
      }, pageTotal);

      results.push(...pageResults.results);

      if (pageResults.nextPageHref) {
        await page.goto(pageResults.nextPageHref);
        hasNextPage = true;
        console.log(`Collected ${pageResults.results.length} results on the page, ${results.length} total so far.\nAdvancing to the further page.`);
      } else {
        hasNextPage = false;
        console.log(`Collected ${pageResults.results.length} results on the page, ${results.length} total.\nQuitting as this is the final page.`);
      }
    } while (hasNextPage);

    if (results.length !== total) {
      throw new Error(`Expected to collect ${total} posts but got ${results.length}.`);
    }

    const end = new Date();

    await fs.writeJSON(filenamify(`${query}-in-${zip}-from-${priceMin || 'any'}-czk-to-${priceMax || 'any'}-czk.json`), { start, end, results }, { spaces: 2 });
  } finally {
    if (record) {
      await page.tracing.stop();
    }

    await browser.close();
  }
}
