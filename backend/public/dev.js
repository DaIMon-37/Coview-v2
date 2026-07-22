let socket;

function log(message) {

    const div = document.getElementById("logs");

    div.innerHTML += `<p>${message}</p>`;

    div.scrollTop = div.scrollHeight;

}

function connectSocket() {

    const token = document.getElementById("token").value;

    socket = io("http://localhost:5000", {
        auth: {
            token
        }
    });

    socket.on("connect", () => {
        console.log("CONNECTED", socket.id);
        log("✅ Connected");
    });

    socket.on("joined-success", (data) => {
        console.log("JOINED", data);
        log("JOINED: " + JSON.stringify(data));
    });

    socket.on("receive-message", (data) => {
        console.log("MESSAGE RECEIVED", data);
        log("MESSAGE: " + JSON.stringify(data));
    });

    socket.on("chat-error", (data) => {
        console.log("CHAT ERROR", data);
        log("CHAT ERROR: " + JSON.stringify(data));
    });

    socket.onAny((event, data) => {
        console.log("ANY EVENT:", event, data);
    });

    socket.on("online-users", (users) => {
        log("ONLINE USERS: " + JSON.stringify(users));
    });

    socket.on("user-joined", (user) => {
        log("USER JOINED: " + user.email);
    });

    socket.on("user-left", (user) => {
        log("USER LEFT: " + user.email);
    });

    socket.on("video-loaded", (data) => {
        log("VIDEO LOADED: " + JSON.stringify(data));
    });

    socket.on("video-played", (data) => {
        log("VIDEO PLAYED: " + JSON.stringify(data));
    });

    socket.on("video-paused", (data) => {
        log("VIDEO PAUSED: " + JSON.stringify(data));
    });

    socket.on("video-seeked", (data) => {
        log("VIDEO SEEKED: " + JSON.stringify(data));
    });

    socket.on("typing-users", (users) => {
    console.log("TYPING USERS:", users);
    log("TYPING: " + users.map(u => u.email).join(", "));
});

}

function joinRoom() {
    socket.emit("join-party", {
        partyCode: document.getElementById("partyCode").value

    });

}

function leaveRoom() {
    socket.emit("leave-party", {
        partyCode: document.getElementById("partyCode").value
    });

}

function loadVideo() {

    socket.emit("video-load", {

        partyCode:

            document.getElementById("partyCode").value,

        provider:

            document.getElementById("provider").value,

        source:

            document.getElementById("source").value

    });

}

function play() {

    socket.emit("video-play", {

        partyCode:

            document.getElementById("partyCode").value,

        currentTime:

            Number(document.getElementById("time").value)

    });

}

function pause() {

    socket.emit("video-pause", {

        partyCode:

            document.getElementById("partyCode").value,

        currentTime:

            Number(document.getElementById("time").value)

    });

}

function seek() {

    socket.emit("video-seek", {

        partyCode:

            document.getElementById("partyCode").value,

        currentTime:

            Number(document.getElementById("time").value)

    });

}

function sendMessage() {

    socket.emit("send-message", {

        partyCode:

            document.getElementById("partyCode").value,

        message:

            document.getElementById("message").value

    });

}

function typingStart() {

    socket.emit("typing-start", {

        partyCode:

            document.getElementById("partyCode").value

    });

}

function typingStop() {

    socket.emit("typing-stop", {

        partyCode:

            document.getElementById("partyCode").value

    });

}
