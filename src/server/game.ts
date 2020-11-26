import WS from "ws";

const server = new WS.Server({ noServer: true });

server.on("connection", (socket: WebSocket) => {
    console.log("New connection");
});

export default server;
