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
    try {
      const res = await fetch('https://menma-dlx.vercel.app/dlx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url })
      });
      const data = await res.json();
      if (data.success) {
        console.log(`✅ Success: ${data.title?.substring(0, 50)} | ${data.media_type}`);
      } else {
        console.log(`❌ Failed: ${data.error}`);
      }
    } catch (e) {
      console.log(`❌ Fetch error: ${e.message}`);
    }
  }
}
testAll();
