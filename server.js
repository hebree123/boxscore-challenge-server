const express = require("express");
const axios = require("axios");
const MongoClient = require("mongodb").MongoClient;
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  "mongodb+srv://ghebrews:BrPIV3E0w4ZHXAN1@boxscore-challenge.pmsbfip.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/api/game/:gameId", async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const now = new Date();
    const fifteenSecondsAgo = new Date(now.getTime() - 15000);

    await client.connect();
    const db = client.db("boxscore-challenge-db");
    const collection = db.collection("games");

    let gameData = await collection.findOne({
      gameId: gameId,
      lastUpdated: { $gte: fifteenSecondsAgo },
    });

    if (!gameData) {
      const response = await axios.get(
        `https://chumley.barstoolsports.com/dev/data/games/${gameId}.json`
      );
      gameData = response.data;

      await collection.updateOne(
        { gameId: gameId },
        { $set: { ...gameData, lastUpdated: now } },
        { upsert: true }
      );
    }

    res.json(gameData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
