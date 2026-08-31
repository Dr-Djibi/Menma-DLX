import btch from 'btch-downloader';
async function run() {
  try {
    const res = await btch.pinterest('https://pin.it/4uxryP6TE');
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();
