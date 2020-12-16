import WebSocket from "ws";

const server = new WebSocket.Server({ noServer: true });
server.on("connection", (socket: WebSocket) => {});

setInterval(() => {}, 1000 / 64);

export default server;
