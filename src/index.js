"use strict";

const net = require("net");
const path = require("path");
const process = require("process");

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

/**
 * attaches logging event listeners to socket.io obj
 * @method setupSocketIoLogM
 * @param  {obj}          io socket.io object
 * @returns {void}
 */
function setupSocketIoLogM(io) {

    io.on("connection", _socket => {
        console.log("socket.io new connection");
    });

    io.on("disconnect", reason => {
        console.log(`socket.io disconnect: ${reason}`);
    });

    io.on("error", err => {
        console.error(`socket.io error: ${err}`);
    });

    io.on("connect_timeout", timeout => {
        console.error(`socket.io connect timeout: ${timeout}`);
    });

    io.on("reconnect_error", err => {
        console.error(`socket.io reconnect error: ${err}`);
    });

    io.on("reconnect_failed", () => {
        console.error("socket.io reconnect failed");
    });
}

/**
 * setup logs for net socket (mutable)
 * @method setupUnixSocketLogM
 * @param  {Object}           socket      socket object
 * @param  {string}           socketPath socket path
 * @returns {void}                       [description]
 */
function setupUnixSocketLogM(socket, socketPath) {

    socket.on("connect", () =>
        console.log(`connected to unix domain socket at: ${socketPath}`)
    );

    socket.on("end", () =>
        console.log(`disconnect from unix domain socket at: ${socketPath}`)
    );

    socket.on("error", error => {
        console.error(`error from unix domain socket at: ${socketPath}`);
        throw (error);
    });
}

/**
 * [gracefulShutdown description]
 * @method gracefulShutdown
 * @param  {[type]}         ipcSocketReader [description]
 * @param  {[type]}         io              [description]
 * @returns {void}
 */
function gracefulShutdown(ipcSocketReader, io) {
    ipcSocketReader.end();
    io.close();
}

/**
 *
 * @method main
 * @param  {string} udsPath   path to unix daemon socket
 * @param  {string} eventName name to emit events for via socket.io
 * @param  {int} port      tcp port number
 * @param  {string|null} encoding stream encoding
 * @returns {void}
 */
function main(udsPath, eventName, port, encoding) {

    const ipcSocketReader = net.createConnection(udsPath);

    setupUnixSocketLogM(ipcSocketReader, udsPath);

    const app = express();
    const server = new http.Server(app);
    const io = socketIo(server);

    process.on("SIGINT", () => {
        console.log("Received SIGINT. Gracefully shutting down...");
        gracefulShutdown(ipcSocketReader, io);
    });

    process.on("SIGTERM", () => {
        console.log("Received SIGTERM. Gracefully shutting down...");
        gracefulShutdown(ipcSocketReader, io);
    });


    setupSocketIoLogM(io);

    app.get("/", (req, res) => {
        res.sendStatus(200);
    });

    if (encoding) {
        ipcSocketReader.setEncoding(encoding);
    }

    server.listen(port, () => {

        console.log(`listening on *:${port}`);

        ipcSocketReader.on("data", data => {
            io.emit(eventName, data);
        });
    });
}

/**
 * Handle the inputs
 * @method main
 * @returns {void}
 */
function configAndRun() {

    const udsPathInput = process.argv[2];
    const eventName = process.argv[3];
    const port = parseInt(process.argv[4], 10) || 5294;
    const encoding = process.argv[5] || null;

    if (!udsPathInput || udsPathInput === "--help" || !eventName) {

        console.error(`usage: ${process.argv0} socketPath eventName [listen_port (default=5294)] [encoding (default=utf8)]`);

        console.error(`example: ${process.argv0} /tmp/socket.sock "unix event" 1080 hex`);

        throw new Error("invalid input");
    }

    const udsPath = path.normalize(udsPathInput);

    main(udsPath, eventName, port, encoding);
}

configAndRun();
