const express = require('express');
const app = express();
const http = require('http').createServer(app);
const PORT = process.env.PORT || 3000;
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

let arr = [];
let playingArray = [];

io.on('connection', (socket) => {
    console.log('Connected.....');
    socket.on('find', (e) => {
        if (e.name != null) {
            arr.push({ name: e.name, sid: e.sid })
            if (arr.length >= 2) {
                let p1obj = {
                    p1name: arr[0].name,
                    p1value: 'X',
                    p1move: "",
                    sid1: arr[0].sid
                };
                let p2obj = {
                    p2name: arr[1].name,
                    p2value: 'O',
                    p2move: "",
                    sid2: arr[1].sid
                };
                let obj = {
                    p1: p1obj,
                    p2: p2obj,
                    sum: 1,
                    reason: "",
                }
                playingArray.push(obj)
                arr.splice(0, 2)
                io.emit("find", { allPlayers: playingArray })
            }
        }
    })

    socket.on("playing", (e) => {
        if (e.value == "X") {
            let objToChange = playingArray.find(obj => obj.p1.p1name === e.name)
            if (objToChange && (objToChange.sum) % 2 === 1) {
                objToChange.p1.p1move = e.id
                objToChange.sum++
            }
        }
        else if (e.value == "O") {
            let objToChange = playingArray.find(obj => obj.p2.p2name === e.name)
            if (objToChange && (objToChange.sum) % 2 === 0) {
                objToChange.p2.p2move = e.id
                objToChange.sum++
            }
        }
        io.emit("playing", { allPlayers: playingArray })
    })
    socket.on("gameOver", (e) => {
        playingArray = playingArray.filter(obj => obj.p1.p1name !== e.name);
    })

    socket.on("disconnect", (reason) => {
        let team = playingArray.find(obj => obj.p1.sid1 === socket.id || obj.p2.sid2 === socket.id);
        if (team) {
            team.sum = 10;
            team.reason = "disconnected";
            io.emit("playing", { allPlayers: playingArray })
            playingArray = playingArray.filter(obj => obj.p1.sid1 !== socket.id || obj.p2.sid2 !== socket.id);
        }
    })
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

http.listen(PORT, () => {
    console.log(`Server listening at port no ${PORT}`)
})