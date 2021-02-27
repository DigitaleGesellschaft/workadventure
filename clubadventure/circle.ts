import {RoomConnection} from "../front/src/Connexion/RoomConnection";
import {connectionManager} from "../front/src/Connexion/ConnectionManager";
import * as WebSocket from "ws"
import { PositionMessage, UserMovedMessage } from "../front/src/Messages/generated/messages_pb";
import { MessageUserJoined } from "../front/src/Connexion/ConnexionModels";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

RoomConnection.setWebsocketFactory((url: string) => {
    return new WebSocket(url);
});

const names = ['Ada', 'Ben', 'Carla', 'Dan', 'Emiliy', 'Fred', 'Gianna', 'Howard']
const layers = ['Female1', 'male1', 'Female2', 'male2', 'Female3', 'male3', 'Female4', 'male4'];
const radius = 64;
const directions = ['down', 'right', 'up', 'left'];
const starts = [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];
const speed = Math.PI * 0.1;

async function startOneUser(anchor: number, follower: number): Promise<void> {
    await connectionManager.anonymousLogin(true);
    const roomId = process.env.ROOM_ID ? process.env.ROOM_ID : '_/global/maps.workadventure.localhost/Floor0/floor0.json';
    const characterName = names[follower];
    const characterLayers = [layers[follower]];
    console.log(`connecting ${characterName} on ${roomId}`);

    let actionStarted = false;

    // Crew will synchronize with this player.
    const anchorPlayer = {
        x: 0,
        y: 0,
    }

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
    console.log(`connected ${characterName} on ${roomId}`);

    const actionStart = async () => {
        if (actionStarted) {
            return;
        }
        actionStarted = true;

        let φ = starts[follower];
        let d = 0;
        while(true) {
            await sleep(120);
            φ = (φ + speed) % (Math.PI * 2);
            d = (d + 1) % 4;

            let x = radius * Math.cos(φ);
            let y = radius * Math.sin(φ);

            const direction = directions[d];

            connection.sharePosition(anchorPlayer.x + x, anchorPlayer.y + y, direction, true, {
                top: anchorPlayer.y + y - 200,
                bottom: anchorPlayer.y + y + 200,
                left: anchorPlayer.x + x - 320,
                right: anchorPlayer.x + x + 320
            });
        }
    };

    connection.onUserJoins((message: MessageUserJoined) => {
        if (message.userId == anchor) {
            anchorPlayer.x = message.position.x;
            anchorPlayer.y = message.position.y;
            actionStart();
        }
    })

    connection.onUserMoved((message: UserMovedMessage) => {
        console.log(`player moved: ${message.getUserid()}, anchor is: ${anchor}`);
        if (message.getUserid() == anchor) {
            const pos = message.getPosition();
            anchorPlayer.x = pos.getX();
            anchorPlayer.y = pos.getY();
            actionStart();
        }
    });
}

(async () => {
    connectionManager.initBenchmark();

    const anchor = process.env.ANCHOR_PLAYER_ID ? parseInt(process.env.ANCHOR_PLAYER_ID) : 1;
    for (let userNo = 0; userNo < 8; userNo++) {
        startOneUser(anchor, userNo);
    }
})();

