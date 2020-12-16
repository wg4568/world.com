// var socket = new WebSocket(
//     `${config.server.wss ? "wss" : "ws"}://${config.server.host}:${
//         config.server.port
//     }`
// );
// var players = new Map<
//     number,
//     { x: number; y: number; z: number; a: number; d: THREE.Mesh }
// >();

// socket.onmessage = (msg) => {
//     var data = JSON.parse(msg.data);

//     if (data.t == 0) me_id = data.i;
//     if (data.t == 2) players.delete(data.i);
//     else if (data.t == 1) {
//         var frame = data.p as {
//             i: number;
//             x: number;
//             y: number;
//             z: number;
//             a: number;
//             d: number;
//         }[];

//         frame.forEach((e) => {
//             var pl = players.get(e.i);
//             if (e.i == me_id) return;

//             if (pl) {
//                 players.set(e.i, {
//                     x: e.x,
//                     y: e.y,
//                     z: e.z,
//                     a: e.a,
//                     d: pl.d
//                 });
//             } else {
//                 var m = create_dude(e.d);
//                 players.set(e.i, {
//                     x: e.x,
//                     y: e.y,
//                     z: e.z,
//                     a: e.a,
//                     d: m
//                 });
//                 scene.add(m);
//             }
//         });
//     }
// };

// function send_position() {
//     if (socket.readyState != WebSocket.OPEN) return;

//     socket.send(
//         JSON.stringify({
//             x: camera.position.x,
//             y: camera.position.y,
//             z: camera.position.z,
//             a: camera.rotation.y,
//             d: dude
//         })
//     );
// }
