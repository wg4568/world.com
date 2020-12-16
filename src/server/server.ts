import express from "express";
import Twig from "twig";

import config from "../../config.json";
import gameServer from "./game";

Twig.cache(!config.debug);

const app = express();

app.use("/static", express.static("static"));

app.get("/", (req, res) => {
    Twig.renderFile("./pages/game.html", {}, (err, html) => {
        res.send(html);
    });
});

app.get("/help", (req, res) => {
    Twig.renderFile("./pages/help.html", {}, (err, html) => {
        res.send(html);
    });
});

app.get("/favicon.ico", (req, res) => {
    res.sendFile("img/favicon.ico", { root: "static" });
});

const server = app.listen(config.server.port, () => {
    console.log(`Server listening on port ${config.server.port}`);
});

server.on("upgrade", (req, sock, head) => {
    gameServer.handleUpgrade(req, sock, head, (socket) => {
        gameServer.emit("connection", socket, req);
    });
});
