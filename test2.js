import btch from 'btch-downloader';
import axios from 'axios';
async function test() {
    let url = 'https://pin.it/2K9J2bA';
    try {
        const res = await axios.get(url, { maxRedirects: 5 });
        url = res.request.res.responseUrl || res.request.url || url;
        console.log("Expanded URL:", url);
    } catch (e) {
        if (e.response && e.response.headers && e.response.headers.location) {
            url = e.response.headers.location;
            console.log("Expanded URL from location:", url);
        }
    }
    try {
        const snap = await btch.pinterest(url);
        console.log("Btch:", JSON.stringify(snap, null, 2));
    } catch (e) {}
}
test();
