const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const { WebcastPushConnection } = require("tiktok-live-connector");
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

let tiktokLiveConnection;

io.on("connection", (socket) => {
	console.log(`user connected ${socket.id}`);

	socket.on("chat-tiktok", (userId) => {
		console.log(`LIVE: ${userId}`);
		if (userId) {
			tiktokLiveConnection = new WebcastPushConnection(userId);
			tiktokLiveConnection
				.connect()
				.then((state) => {
					console.info(`Connected to roomId ${state.roomId}`);
				})
				.catch((err) => {
					console.error("Failed to connect", err);
				});

			tiktokLiveConnection.on(
				"chat",
				({
					comment,
					userId,
					nickname,
					uniqueId,
					profilePictureUrl,
					createTime,
				}) => {
					console.log(`${nickname}-${comment}-${createTime}`);

					const data = {
						comment,
						userId,
						uniqueId,
						nickname,
						profilePictureUrl,
						createTime,
					};

					io.emit("get-comment", data);
					io.emit("in-process", true);
				}
			);
		} else {
			tiktokLiveConnection && tiktokLiveConnection.disconnect();
		}
	});

	socket.on("close-tiktok", () => {
		if (tiktokLiveConnection) {
			io.emit("in-process", false);
			tiktokLiveConnection.disconnect();
		}
	});

	socket.on("disconnect", () => {
		console.log("user disconnect");
	});
});

io.listen(4000, () => {
	console.log("listening on *:4000");
});
