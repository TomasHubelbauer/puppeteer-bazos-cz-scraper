import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrape(query, zip, priceMin, priceMax) {
  console.log(`Searching for '${query}' within area ${zip} between ${priceMin} and ${priceMax} CZK.`);
  const browser = await puppeteer.launch({ headless: true, slowMo: 10 });
  const page = (await browser.pages())[0];
  await page.bringToFront();
  await page.goto('https://bazos.cz');

  try {
    const hledatInput = await page.$('#hledat');
    await hledatInput.focus();
    await page.keyboard.type(query);

    const hlokalitaInput = await page.$('#hlokalita');
    await hlokalitaInput.focus();
    await page.keyboard.type(zip);

    const cenaodInput = await page.$('input[name=cenaod]');
    await cenaodInput.focus();
    await page.keyboard.type(priceMin);

    const cenadoInput = await page.$('input[name=cenado]');
    await cenadoInput.focus();
    await page.keyboard.type(priceMax);

    const submitInput = await page.$('input[name=Submit]');
    await submitInput.click();

    await page.waitForNavigation();

    const results = [];
    let hasNextPage = false;

    do {
      const pageResults = await page.evaluate(() => {
        let results = [];

        const vypisSpans = document.querySelectorAll('span.vypis');
        for (const vypisSpan of vypisSpans) {
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
        }

        const strankovaniA = document.querySelector('p.strankovani > a:last-child');
        return { results, nextPageHref: strankovaniA && strankovaniA.href };
      });

      results.push(...pageResults.results);

      if (pageResults.nextPageHref) {
        await page.goto(pageResults.nextPageHref);
        hasNextPage = true;
        console.log(`Retrieved ${pageResults.length} page results. Retrieved ${results.length} total results so far. Advancing to next page.`);
      } else {
        hasNextPage = false;
        console.log(`Retrieved ${pageResults.length} page results. Retrieved ${results.length} total results. No more pages, closing.`);
      }
    } while (hasNextPage);

    fs.writeFileSync('../results.json', JSON.stringify(results, null, 2));
  } catch (e) {
    console.log(e);
  }

  await browser.close();
}

scrape(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);
