require('dotenv').config();
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const testRoutes = require("./routes/testRoutes");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const admin = require("firebase-admin");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const Meeting = require("./models/Meeting");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/* ==============================
   MongoDB Connection
============================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

/* ==============================
   Firebase Admin SDK
============================== */
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
  console.log("✅ Firebase Admin SDK initialized.");
} catch (error) {
  console.error("❌ Firebase init failed:", error.message);
}

/* ==============================
   Agora Configuration
============================== */
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

if (!APP_ID || !APP_CERTIFICATE) {
  console.error("❌ AGORA_APP_ID or AGORA_APP_CERTIFICATE missing.");
} else {
  console.log("✅ Agora credentials loaded.");
}

app.get("/config/agora", (req, res) => {
  res.json({ appId: APP_ID });
});

/* ==============================
   Middleware
============================== */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ==============================
   Static Pages
============================== */
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', testRoutes);
app.use('/api/meetings', meetingRoutes);

app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "dashboard.html"))
);

app.get("/meeting", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "meeting.html"))
);

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* ==============================
   Google Token Verification
============================== */
app.post("/verify-google-token", async (req, res) => {
  const idToken = req.body.idToken;
  if (!idToken) return res.status(400).json({ message: "ID Token required." });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.status(200).json({ uid: decodedToken.uid });
  } catch (error) {
    res.status(401).json({ message: "Authentication failed.", error: error.message });
  }
});

/* ==============================
   Start Meeting (Host Joins)
============================== */
app.post('/api/meetings/:id/start', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    meeting.isLive = true;
    await meeting.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   End Meeting (Host Leaves)
============================== */
app.post('/api/meetings/:id/end', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    meeting.isLive = false;
    await meeting.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   Agora Token Endpoint
============================== */
app.get("/rtc-token", async (req, res) => {
  const { channelName, uid: uidParam } = req.query;

  if (!channelName) {
    return res.status(400).json({ error: "channelName is required" });
  }

  if (!APP_ID || !APP_CERTIFICATE) {
    return res.status(500).json({ error: "Server missing Agora credentials" });
  }

  try {
    // 🔥 Validate Meeting in MongoDB
    if (!mongoose.Types.ObjectId.isValid(channelName)) {
  return res.status(404).json({ error: "Meeting not found." });
}

app.get('/api/meetings/:id/validate', async (req, res) => {
  const meetingId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(meetingId)) {
    return res.status(404).json({ error: "Meeting not found." });
  }

  const meeting = await Meeting.findById(meetingId);

  if (!meeting) {
    return res.status(404).json({ error: "Meeting not found." });
  }

  if (!meeting.isLive) {
    return res.status(400).json({ error: "Meeting is not live." });
  }

  res.json({ success: true });
});


    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    let token, joinId;

    const isNumericUid = uidParam && /^\d+$/.test(String(uidParam));

    if (isNumericUid) {
      const uid = parseInt(uidParam, 10);
      token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        role,
        privilegeExpiredTs
      );
      joinId = uid;
    } else {
      const userAccount =
        (uidParam && String(uidParam).trim()) ||
        (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`).slice(0, 20);

      token = RtcTokenBuilder.buildTokenWithAccount(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        userAccount,
        role,
        privilegeExpiredTs
      );
      joinId = userAccount;
    }

    res.json({ token, uid: joinId });

  } catch (err) {
    console.error("❌ Failed to build Agora token:", err);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

/* ==============================
   Socket.IO
============================== */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("disconnect", () =>
    console.log("User disconnected:", socket.id)
  );
});

/* ==============================
   Start Server
============================== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
