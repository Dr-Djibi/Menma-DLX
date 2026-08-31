import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';
async function test() {
    console.log("Testing Pinterest...");
    try {
        const snap = await snapsave('https://pin.it/2K9J2bA');
        console.log("Snapsave:", JSON.stringify(snap, null, 2));
    } catch (e) {
        console.log("Snapsave Error:", e.message);
    }
    try {
        const res = await btch.pinterest('https://pin.it/2K9J2bA');
        console.log("Btch:", JSON.stringify(res, null, 2));
    } catch (e) {
        console.log("Btch Error:", e.message);
    }
}
test();
