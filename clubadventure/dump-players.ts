import {RoomConnection} from "../front/src/Connexion/RoomConnection";
import {connectionManager} from "../front/src/Connexion/ConnectionManager";
import * as WebSocket from "ws"
import { MessageUserJoined } from "../front/src/Connexion/ConnexionModels";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

RoomConnection.setWebsocketFactory((url: string) => {
    return new WebSocket(url);
});

async function dumpUsers(): Promise<void> {
    await connectionManager.anonymousLogin(true);
    const roomId = process.env.ROOM_ID ? process.env.ROOM_ID : '_/global/maps.workadventure.localhost/Floor0/floor0.json';
    const characterName = 'ghost';
    const characterLayers = ['male1'];

    const onConnect = await connectionManager.connectToRoomSocket(roomId,
        characterName,
        characterLayers,
        {
            x: 0,
            y: 0
        }, {
            top: 0,
            bottom: 4096,
            left: 0,
            right: 4096
        });

    const connection = onConnect.connection;

    connection.onUserJoins((message: MessageUserJoined) => {
        console.log(`${message.name}: ${message.userId} (${message.position.x},${message.position.y})`);
    });

    await sleep(100);
    connection.closeConnection();
}

(async () => {
    connectionManager.initBenchmark();
    await dumpUsers();
})();
