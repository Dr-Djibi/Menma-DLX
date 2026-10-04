## 2026-10-04 - Innertube instance creation bottleneck in serverless/Node environment

**Learning:** `Innertube.create()` in `youtubei.js` takes ~1.3s - 1.7s to execute per call as it fetches session data and initializes client contexts. Re-creating this instance inside extractor request handlers causes massive latency on every YouTube extraction call (~1.5s total duration per request).
**Action:** Always maintain a module-scoped singleton promise for `Innertube` instances in media extractor modules, resetting on promise rejection so initialization overhead is paid only once per container cold start rather than on every warm request.
