const express = require("express");
const app = express();
const snapsave = require("./snapsave-downloader/src/index");
const port = process.env.PORT || 3000; 

// CORS Fix
// --- UPDATED PROXY ENDPOINT ---
app.get("/proxy", async (req, res) => {
    try {
        const mediaUrl = req.query.url;
        if (!mediaUrl) return res.status(400).send("No media URL provided");

        // Faking a real browser to bypass CDN blocks
        const response = await fetch(mediaUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "*/*"
            }
        });

        if (!response.ok) {
            throw new Error(`Instagram CDN blocked request. Status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader("Content-Disposition", "attachment; filename=\"instagram_download.mp4\"");
        res.setHeader("Content-Type", response.headers.get("content-type") || "video/mp4");
        res.send(buffer);
    } catch (err) {
        // This will print the exact reason to your Render logs
        console.error("Proxy Error Details:", err.message); 
        // This will send the exact reason to your browser screen
        res.status(500).send("Server Error: " + err.message); 
    }
});
// -----------------------------------------

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

// Original endpoint to find the Instagram media URL
app.get("/igdl", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "URL parameter is missing" });

    const downloadedURL = await snapsave(url);
    res.json({ url: downloadedURL });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- THE "PRO" FIX: NEW PROXY ENDPOINT ---
app.get("/proxy", async (req, res) => {
    try {
        const mediaUrl = req.query.url;
        if (!mediaUrl) return res.status(400).send("No media URL provided");

        // 1. The server fetches the actual video file
        const response = await fetch(mediaUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. The server tells the browser "THIS IS A FILE DOWNLOAD"
        res.setHeader("Content-Disposition", "attachment; filename=\"instagram_download.mp4\"");
        res.setHeader("Content-Type", response.headers.get("content-type") || "video/mp4");

        // 3. Send the file to the user
        res.send(buffer);
    } catch (err) {
        console.error("Proxy Error:", err);
        res.status(500).send("Failed to proxy file.");
    }
});
// -----------------------------------------

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
