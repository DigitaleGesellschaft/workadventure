import Axios from "axios";
import {API_URL} from "../Enum/EnvironmentVariable";
import {RoomConnection} from "./RoomConnection";

interface LoginApiData {
    authToken: string
    userUuid: string
    mapUrlStart: string
    newUrl: string
}

class ConnectionManager {
    private initPromise: Promise<LoginApiData> = Promise.reject();
    private mapUrlStart: string|null = null;
    
    private authToken:string|null = null;
    private userUuid: string|null = null;
    
    public async init(): Promise<void> {
        const match = /\/register\/(.+)/.exec(window.location.toString());
        const organizationMemberToken = match ? match[1] : null;
        this.initPromise = Axios.post(`${API_URL}/login`, {organizationMemberToken}).then(res => res.data);
        const data = await this.initPromise
        this.authToken = data.authToken;
        this.userUuid = data.userUuid;
        this.mapUrlStart = data.mapUrlStart;
        const newUrl = data.newUrl;

        if (newUrl) {
            history.pushState({}, '', newUrl);
        }
    }
    
    public connectToRoomSocket(): Promise<RoomConnection> {
        return new Promise<RoomConnection>((resolve, reject) => {
            const connection = new RoomConnection(this.authToken as string);
            connection.onConnectError((error: object) => {
                console.log('An error occurred while connecting to socket server. Retrying');
                reject(error);
            });
            resolve(connection);
        }).catch((err) => {
            // Let's retry in 4-6 seconds
            return new Promise<RoomConnection>((resolve, reject) => {
                setTimeout(() => {
                    //todo: allow a way to break recurrsion?
                    this.connectToRoomSocket().then((connection) => resolve(connection));
                }, 4000 + Math.floor(Math.random() * 2000) );
            });
        });
    }
    
    public getMapUrlStart(): Promise<string> {
        return this.initPromise.then(() => {
            if (!this.mapUrlStart) {
                throw new Error('No map url set!');
            }
            return this.mapUrlStart;
        })
    }
}

export const connectionManager = new ConnectionManager();