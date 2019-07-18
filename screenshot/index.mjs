import trace from '../trace.json';
import cliProgress from 'cli-progress';
import GIFEncoder from 'gifencoder';
import fs from 'fs';
import inkjet from 'inkjet';

void async function () {
  const bar = new cliProgress.Bar();
  bar.start(trace.traceEvents.filter(te => te.args.snapshot).length, 0);
  let gifEncoder;
  let index = 0;
  for (const traceEvent of trace.traceEvents) {
    if (traceEvent.args.snapshot) {
      bar.update(++index);
      const { width, height, data } = await new Promise((resolve, reject) => inkjet.decode(Buffer.from(traceEvent.args.snapshot, 'base64'), (error, data) => {
        if (error) {
          reject(error);
        }

        resolve(data);
      }));

      if (!gifEncoder) {
        gifEncoder = new GIFEncoder(width, height);
        gifEncoder.createReadStream().pipe(fs.createWriteStream('../screenshot.gif'));
        gifEncoder.start();
        gifEncoder.setRepeat(0); // Repeat
        gifEncoder.setDelay(50);
        gifEncoder.setQuality(10); // Best?
      }

      gifEncoder.addFrame(data);
    }
  }

  gifEncoder.finish();
  bar.stop();
}()
