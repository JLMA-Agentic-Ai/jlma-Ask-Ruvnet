console.log("🚀 Index.js starting...");
console.log("Current directory:", process.cwd());
const fs = require('fs');
console.log("Files in root:", fs.readdirSync('.'));
try {
    console.log("Files in src:", fs.readdirSync('src'));
    console.log("Files in src/server:", fs.readdirSync('src/server'));
} catch (e) {
    console.error("Error listing src:", e.message);
}

require('./src/server/app.js');
