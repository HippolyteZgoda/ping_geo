const https = require('https');
const http = require('http');

console.log("🌍 STARTING NETWORK DIAGNOSTIC...");
console.log("==================================");

// 1. Check IP Public (Où suis-je ?)
https.get('https://api.ipify.org?format=json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const ip = JSON.parse(data).ip;
            console.log(`📍 MY PUBLIC IP: ${ip}`);
            
            // Appel à ip-api pour la localisation (HTTP simple)
            http.get(`http://ip-api.com/json/${ip}`, (res2) => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => {
                    try {
                        const geo = JSON.parse(data2);
                        console.log(`🗺️ LOCATION: ${geo.city}, ${geo.regionName}, ${geo.country}`);
                        console.log(`🏢 ISP: ${geo.isp}`);
                        console.log("----------------------------------");
                        runPings();
                    } catch (e) {
                        console.error("❌ Failed to parse Geo IP:", e.message);
                        runPings();
                    }
                });
            });
        } catch (e) {
            console.error("❌ Failed to parse IP:", e.message);
            runPings();
        }
    });
}).on('error', (e) => {
    console.error("❌ Failed to get IP:", e.message);
    runPings();
});

function runPings() {
    // 2. Ping BLS.GOV (Washington DC)
    console.log("📡 TESTING BLS.GOV (Origin)...");
    const startBLS = Date.now();
    const reqBLS = https.request({
        hostname: 'www.bls.gov',
        path: '/',
        method: 'HEAD', // Juste les headers pour aller vite
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        }
    }, (res) => {
        const latencyBLS = Date.now() - startBLS;
        console.log(`✅ BLS Response: ${res.statusCode} OK`);
        console.log(`⏱️ BLS Latency (HTTP Handshake): ${latencyBLS}ms`);
        console.log("----------------------------------");
        testPolymarket();
    });
    
    reqBLS.on('error', (e) => {
        console.error("❌ BLS Error:", e.message);
        testPolymarket();
    });
    reqBLS.end();
}

function testPolymarket() {
    // 3. Test Polymarket CLOB (Latence + Geo-block)
    console.log("📡 TESTING POLYMARKET CLOB...");
    const startPoly = Date.now();
    
    // On tape /time qui est public et léger
    const options = {
        hostname: 'clob.polymarket.com',
        path: '/time', 
        method: 'GET',
        headers: { 
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json'
        }
    };

    const reqPoly = https.request(options, (res) => {
        const latencyPoly = Date.now() - startPoly;
        console.log(`STATUS CODE: ${res.statusCode}`);
        
        if (res.statusCode === 403) {
            console.error("❌ 403 FORBIDDEN -> YOU ARE GEO-BLOCKED! (Server is likely in USA)");
            console.error("⚠️ ACTION REQUIRED: Change Railway Region or Use Proxy");
        } else if (res.statusCode === 200) {
            console.log("✅ 200 OK -> ACCESS GRANTED (Server is in Allowed Region)");
        } else {
            console.log(`⚠️ Status: ${res.statusCode}`);
        }
        
        console.log(`⏱️ Polymarket Latency: ${latencyPoly}ms`);
        console.log("==================================");
        
        // Keep process alive for a bit so Railway logs are visible
        setTimeout(() => process.exit(0), 5000);
    });

    reqPoly.on('error', (e) => {
        console.error("❌ Polymarket Error:", e.message);
        setTimeout(() => process.exit(1), 5000);
    });
    reqPoly.end();
}

