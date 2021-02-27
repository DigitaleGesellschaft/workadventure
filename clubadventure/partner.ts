import {RoomConnection} from "../front/src/Connexion/RoomConnection";
import {connectionManager} from "../front/src/Connexion/ConnectionManager";
import * as WebSocket from "ws"
import { PositionMessage, UserMovedMessage } from "../front/src/Messages/generated/messages_pb";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

RoomConnection.setWebsocketFactory((url: string) => {
    return new WebSocket(url);
});

async function startOneUser(anchor: number): Promise<void> {
    await connectionManager.anonymousLogin(true);
    const roomId = process.env.ROOM_ID ? process.env.ROOM_ID : '_/global/maps.workadventure.localhost/Floor0/floor0.json';
    const characterName = 'Meggie';
    const characterLayers = ['Female3'];
    console.log(`connecting ${characterName} on ${roomId}`);

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

    connection.onUserMoved((message: UserMovedMessage) => {
        console.log(`player moved: ${message.getUserid()}, anchor is: ${anchor}`);
        if (message.getUserid() == anchor) {
            const pos = message.getPosition();
            const x = pos.getX();
            const y = pos.getY();
            let direction: string = "";
            let xoff = 0;
            let yoff = 0;
            switch(pos.getDirection()) {
                case PositionMessage.Direction.UP:
                    direction = 'down';
                    yoff = 2;
                    break;
                case PositionMessage.Direction.DOWN:
                    direction = 'up';
                    yoff = -2;
                    break;
                case PositionMessage.Direction.LEFT:
                    direction = 'right';
                    xoff = -2;
                    break;
                case PositionMessage.Direction.RIGHT:
                    direction = 'left';
                    xoff = 2;
                    break;
            }

            connection.sharePosition(x, y, direction, true, {
                top: y - 200,
                bottom: y + 200,
                left: x - 320,
                right: x + 320
            });
        }
    });
}

(async () => {
    connectionManager.initBenchmark();

    const anchor = process.env.ANCHOR_PLAYER_ID ? parseInt(process.env.ANCHOR_PLAYER_ID) : 1;
    startOneUser(anchor);
})();
