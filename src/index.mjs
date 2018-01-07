import puppeteer from 'puppeteer'; // https://github.com/GoogleChrome/puppeteer
import commander from 'commander'; // https://github.com/tj/commander.js/
import util from 'util';
import fs from 'fs';

fs.readFileAsync = util.promisify(fs.readFile);

const headless = true;

commander
  .version('1.0.0') // Use `JSON.parse(await fs.readFileAsync('package.json')).version`
  .command('search [query] [zip]')
  .description('Searches Bazos.cz for the given query within the given ZIP.')
  .option('-f, --from [amount]', 'Price from')
  .option('-t, --to [amount]', 'Price to')
  .action(scrape);

commander.parse(process.argv);

async function scrape(query, zip, { from: priceMin, to: priceMax }) {
  console.log(`Searching for '${query}' within area ${zip} between ${priceMin} and ${priceMax} CZK.`);
  const browser = await puppeteer.launch({ headless, slowMo: 10 });
  const page = (await browser.pages())[0];
  await page.bringToFront();
  await page.goto('https://bazos.cz');

  try {
    const hledatInput = await page.$('#hledat');
    await hledatInput.focus();
    await page.keyboard.type(query);
    // Discard the autocomplete prompt.
    if (!headless) {
      await page.waitForSelector('#vysledek');
      await page.evaluate(() => document.getElementById('vysledek').remove());
    }

    const hlokalitaInput = await page.$('#hlokalita');
    await hlokalitaInput.focus();
    await page.keyboard.type(zip);
    // Discard the autocomplete prompt.
    if (!headless) {
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

    let total;
    let counter = 0;
    const results = [];
    let hasNextPage = false;

    do {
      const summaryText = await page.$eval('table.listainzerat > tbody > tr > td', listaTd => listaTd.textContent);
      const summaryTextParts = summaryText.trim().split(/[\s-]/g);
      const firstPostNo = Number(summaryTextParts[1]);
      const lastPostNo = Number(summaryTextParts[2]);
      total = Number(summaryTextParts[5]);

      console.log(`Search reports ${total} results total, posts ${firstPostNo}-${lastPostNo} on this page.`);

      const pageResults = await page.evaluate((counter, firstPostNo, lastPostNo) => {
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
          const date = velikostSpan.textContent.substr(4).slice(0, -1).split('.').map(n => n.trim());
          const description = popisDiv.textContent;
          const price = cenaSpan.textContent.slice(2, -3).replace(/ /, '');

          results.push({ title, url, date, description, price });

          if (index === 0 && (counter + index) !== firstPostNo) {
            console.log(`Post did not have expected number! Expected first post to be ${firstPostNo} but it was ${counter}.`);
          }

          if (index === vypisSpans.length - 1 && (counter + index) !== lastPostNo) {
            console.log(`Post did not have expected number! Expected last post to be ${lastPostNo} but it was ${counter}.`);
          }
        }

        const strankovaniA = document.querySelector('p.strankovani > a:last-child');
        return { results, nextPageHref: strankovaniA && strankovaniA.href };
      }, firstPostNo, lastPostNo, counter);

      results.push(...pageResults.results);
      counter += pageResults.results.length;

      if (pageResults.nextPageHref) {
        await page.goto(pageResults.nextPageHref);
        hasNextPage = true;
        console.log(`Retrieved ${pageResults.results.length} page results. Retrieved ${results.length} total results so far. Advancing to next page.`);
      } else {
        hasNextPage = false;
        console.log(`Retrieved ${pageResults.results.length} page results. Retrieved ${results.length} total results. No more pages, closing.`);
      }
    } while (hasNextPage);

    if (counter !== total) {
      console.log(`Posts did not have expected total! Expected total to be ${total} but it was ${counter}.`);
    }

    fs.writeFileSync('../results.json', JSON.stringify(results, null, 2));
  } catch (e) {
    console.log(e);
  }

  await browser.close();
}
