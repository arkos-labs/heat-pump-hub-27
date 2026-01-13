const https = require('https');

const data = JSON.stringify({
    lastname: "Testeur",
    firstname: "Automatique",
    email: "test.auto@example.com",
    phone: "0600000000",
    city: "Cyberville",
    zipcode: "99000",
    id: "test-manual-https"
});

const options = {
    hostname: 'heat-pump-hub-27.vercel.app',
    path: '/api/webhook',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Envoi du test webhook...");

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let responseBody = '';
    res.on('data', (chunk) => {
        responseBody += chunk;
    });
    res.on('end', () => {
        console.log('RÉPONSE DU SERVEUR:');
        console.log(responseBody);
    });
});

req.on('error', (e) => {
    console.error(`Erreur lors de la requête: ${e.message}`);
});

req.write(data);
req.end();
