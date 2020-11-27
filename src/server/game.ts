import WebSocket from "ws";

const server = new WebSocket.Server({ noServer: true });
const clients: Client[] = [];

class Client {
    public readonly id: number;
    public socket: WebSocket;

    public static LAST_ID: number = 0;

    constructor(sock: WebSocket) {
        this.socket = sock;
        this.id = Client.LAST_ID++;

        if (this.socket.readyState != WebSocket.OPEN) {
            this.socket.on("open", () => {
                this.socket.send(
                    JSON.stringify({
                        t: 0,
                        i: this.id
                    })
                );
            });
        } else {
            this.socket.send(
                JSON.stringify({
                    t: 0,
                    i: this.id
                })
            );
        }
    }

    onMessage(func: (client: Client, msg: string) => any) {
        this.socket.on("message", (msg: string) => {
            func(this, msg);
        });
    }
}

function broadcast(msg: WebSocket.Data) {
    clients.forEach((c) => {
        if (c.socket.readyState != c.socket.CLOSED) c.socket.send(msg);
        else disconnect(c);
    });
}

function disconnect(client: Client) {
    console.log("disconnected");
    var idx = clients.indexOf(client);
    if (idx != -1) delete clients[idx];
    broadcast(
        JSON.stringify({
            t: 2,
            i: client.id
        })
    );
}

var this_packet: {
    i: number;
    x: number;
    y: number;
    z: number;
    a: number;
    d: number;
}[] = [];
server.on("connection", (socket: WebSocket) => {
    var c = new Client(socket);
    clients.push(c);

    c.onMessage((c: Client, msg: string) => {
        var data = JSON.parse(msg);

        this_packet.push({
            i: c.id,
            x: data.x,
            y: data.y,
            z: data.z,
            a: data.a,
            d: data.d
        });
    });
});

setInterval(() => {
    broadcast(
        JSON.stringify({
            t: 1,
            p: this_packet
        })
    );
    this_packet = [];
}, 1000 / 64);

export default server;
