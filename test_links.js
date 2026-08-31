const { snapsave } = require('snapsave-media-downloader');
const btch = require('btch-downloader');

const links = [
  { name: 'Instagram', url: 'https://www.instagram.com/reel/DcsOKwAoeSq/?igsi=MXc3MzUzOTdzNjFqaQ==' },
  { name: 'TikTok', url: 'https://vt.tiktok.com/ZSV326g9o/' },
  { name: 'Facebook', url: 'https://www.facebook.com/share/r/14mbAdirycg/' },
  { name: 'YouTube', url: 'https://youtube.com/shorts/4Ltl-CDekNs?si=9beuViloCmDEsoUF' },
  { name: 'Pinterest', url: 'https://pin.it/4uxryP6TE' }
];

async function testAll() {
  for (const item of links) {
    console.log(`\n--- Testing ${item.name} ---`);
    if (item.name === 'Instagram' || item.name === 'Facebook' || item.name === 'TikTok') {
        try {
            console.log('Trying snapsave...');
            const snap = await snapsave(item.url);
            console.log('Snapsave OK:', snap.success, snap.data?.media?.length);
            if (!snap.success || !snap.data?.media?.length) throw new Error('snapsave fail');
        } catch (e) {
            console.log('Snapsave failed, trying btch...');
            try {
                let res;
                if (item.name === 'Instagram') res = await btch.igdl(item.url);
                if (item.name === 'TikTok') res = await btch.ttdl(item.url);
                if (item.name === 'Facebook') res = await btch.fbdl(item.url);
                console.log('btch result:', JSON.stringify(res).substring(0, 100));
            } catch (err) {
                console.log('btch failed:', err.message);
            }
        }
    } else if (item.name === 'YouTube') {
        try {
            const res = await btch.youtube(item.url);
            console.log('YouTube OK:', res.status, res.title);
        } catch(e) { console.log('YouTube error:', e.message); }
    } else if (item.name === 'Pinterest') {
        try {
            const res = await btch.pinterest(item.url);
            console.log('Pinterest OK:', res.status, res.result?.result?.video_url ? 'Video' : 'Image');
        } catch(e) { console.log('Pinterest error:', e.message); }
    }
  }
}
testAll();
