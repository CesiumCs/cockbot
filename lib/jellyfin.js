const https = require('https');
const http = require('http');

function fetchJson(urlStr, headers = {}, redirectCount = 0) {
    const MAX_REDIRECTS = 5;
    return new Promise((resolve, reject) => {
        if (redirectCount > MAX_REDIRECTS) return reject(new Error('Too many redirects'));
        const url = new URL(urlStr);
        const lib = url.protocol === 'https:' ? https : http;
        const opts = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'GET',
            headers: Object.assign({ Accept: 'application/json', 'User-Agent': 'cockbot/1.0' }, headers),
        };

        const req = lib.request(opts, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const next = new URL(res.headers.location, url);
                res.resume();
                return resolve(fetchJson(next.toString(), headers, redirectCount + 1));
            }

            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                if (!data || data.trim() === '') return resolve({});
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.log('Jellyfin response invalid JSON:');
                    console.log('Status:', res.statusCode);
                    console.log('Headers:', res.headers);
                    console.log('Body:', data);
                    reject(new Error(`Invalid JSON response (status ${res.statusCode})`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function createClient(cfg) {
    if (!cfg || !cfg.url) throw new Error('Missing jellyfin config.url');
    const base = cfg.url.replace(/\/$/, '');
    const key = cfg.key;

    function buildUrl(path, params = {}) {
        const u = new URL(`${base}${path}`);
        //if (key) u.searchParams.set('api_key', key);
        Object.keys(params).forEach((k) => u.searchParams.set(k, params[k]));
        return u.toString();
    }

    async function request(path, params = {}) {
        const url = buildUrl(path, params);
        const headers = {};
        if (key) headers['X-Emby-Token'] = key;
        return fetchJson(url, headers);
    }

    async function getCurrentUser() {
        return request('/Users/Me');
    }

    async function getUserViews(userId) {
        return request(`/Users/${encodeURIComponent(userId)}/Views`);
    }

    return { getCurrentUser, getUserViews, request };
}

module.exports = { createClient };
