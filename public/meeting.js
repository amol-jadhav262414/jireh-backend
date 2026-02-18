// public/meeting.js

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

let localAudioTrack;
let localVideoTrack;
const remoteUsers = {};

async function fetchAppId() {
    const res = await fetch("/config/agora");
    const { appId } = await res.json();
    if (!appId) throw new Error("Missing Agora App ID");
    return appId;
}

function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function getBrowserId() {
    let id = localStorage.getItem("browserUid");
    if (!id) {
        id = `web_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
        localStorage.setItem("browserUid", id);
    }
    return id;
}

async function joinAgoraChannel() {
    const loadingSpinner = document.getElementById("loading-spinner");
    if (loadingSpinner) loadingSpinner.classList.remove("hidden");

    const meetingId = getQueryParam("id");
    if (!meetingId) {
        console.error("Meeting ID missing");
        return;
    }

    try {
        const AGORA_APP_ID = await fetchAppId();
        const desiredId = getBrowserId();

        // 🔥 Get token (this now validates meeting & isLive)
        const tokenResponse = await fetch(
            `/rtc-token?channelName=${encodeURIComponent(meetingId)}&uid=${encodeURIComponent(desiredId)}`
        );

        const data = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(data.error || "Failed to fetch token");
        }

        const { token, uid } = data;

        // 🔥 Join first
        await client.join(AGORA_APP_ID, meetingId, token, uid);
        console.log("Joined successfully:", uid);

        // 🔥 Mark meeting live (host behavior – simple version)
        await fetch(`/api/meetings/${meetingId}/start`, { method: "POST" });

        if (loadingSpinner) loadingSpinner.classList.add("hidden");

        // 🔥 OPTIONAL: Only publish if device permissions allowed
        try {
            localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            await client.publish(localAudioTrack);
        } catch (err) {
            console.warn("Mic not enabled:", err.message);
        }

        try {
            localVideoTrack = await AgoraRTC.createCameraVideoTrack();
            await client.publish(localVideoTrack);

            const videoGrid = document.getElementById("video-grid");
            const localPlayerContainer = document.createElement("div");
            localPlayerContainer.id = `local-player-${uid}`;
            localPlayerContainer.className = "video-player";
            videoGrid.append(localPlayerContainer);

            localVideoTrack.play(localPlayerContainer.id);
        } catch (err) {
            console.warn("Camera not enabled:", err.message);
        }

    } catch (error) {
        console.error("Join failed:", error);
        if (loadingSpinner) {
            loadingSpinner.textContent = error.message;
            loadingSpinner.classList.remove("hidden");
        }
    }
}

async function handleUserPublished(user, mediaType) {
    const uid = user.uid;
    remoteUsers[uid] = user;

    await client.subscribe(user, mediaType);

    const videoGrid = document.getElementById("video-grid");

    if (mediaType === "video") {
        let container = document.getElementById(`remote-player-${uid}`);
        if (!container) {
            container = document.createElement("div");
            container.id = `remote-player-${uid}`;
            container.className = "video-player";
            videoGrid.append(container);
        }
        user.videoTrack.play(container.id);
    }

    if (mediaType === "audio") {
        user.audioTrack.play();
    }
}

function handleUserLeft(user) {
    delete remoteUsers[user.uid];
    const container = document.getElementById(`remote-player-${user.uid}`);
    if (container) container.remove();
}

async function leaveAgoraChannel() {
    try {
        if (localAudioTrack) localAudioTrack.close();
        if (localVideoTrack) localVideoTrack.close();

        await client.leave();

        const meetingId = getQueryParam("id");
        await fetch(`/api/meetings/${meetingId}/end`, { method: "POST" });

        window.location.href = "/dashboard";
    } catch (error) {
        console.error("Leave failed:", error);
    }
}

client.on("user-published", handleUserPublished);
client.on("user-left", handleUserLeft);

window.onload = joinAgoraChannel;
document.getElementById("leave-call-button").addEventListener("click", leaveAgoraChannel);
