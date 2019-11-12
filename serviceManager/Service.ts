import { Socket } from "net";
import ServiceManager from "./index";

interface Config {
    name: string,
    requireAuth: boolean
    isAuth?: boolean
}

interface RequestSerivce {
    name: string,
    data: any
}

interface requestApi {
    uid: number;
    res: any;
    data: any;
    promiseCallback: any;
}

export default class Service {
    public initialized: boolean = false;
    private _config?: Config;
    private requestPending: Array<requestApi> = [];

    constructor(private socket: Socket, private serviceManager: ServiceManager) {
        this.socketOn("close", (data) => this.serviceManager.serviceClosed(this));
        this.socketOn("data", this.onData.bind(this));
    }

    private socketOn(name:string, callback: (data: RequestSerivce) => void) {
        this.socket.on(name,(data: any) => {
            callback(JSON.parse(data.toString()) );
        });
    }

    private socketWrite(request: any) {
        this.socket.write(JSON.stringify(request));
    }

    private onData(request: RequestSerivce) {
        switch (request.name) {
            case "config":
                this.initConfiguration(request.data)
                break;
            case "response":
                this.sendResponse(request);
                break;
            case "authResponse":
                this.onAuthResponse(request);
                break;
            default:
                break;
        }
    }

    private initConfiguration(data: Config) {
        console.log("Service " + data.name + " initialized");
        this._config = data;
        this.initialized = true;
        if (data.isAuth) {
            this.serviceManager.addServiceAuth(this);
        }
    }
    private sendResponse(response: any) {
        const requestIndex = this.requestPending.findIndex((request) => request.uid === response.uid);
        this.requestPending[requestIndex].promiseCallback.resolve(response.data);
        this.requestPending[requestIndex].res.send(response.data);
        this.requestPending.splice(requestIndex,1);
    }

    private onAuthResponse(response: any) {
        const requestIndex = this.requestPending.findIndex((request) => request.uid === response.uid);
        this.requestPending[requestIndex].promiseCallback.resolve(response.data);
        this.requestPending.splice(requestIndex,1);
    }

    public sendRequest(data: any, auth: any, headers: any, res: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = {
                name: "request",
                uid: parseInt((new Date().getTime() * (Math.random() + 1 * 100)).toFixed(0)),
                res: res,
                data: data,
                promiseCallback : {
                    resolve,
                    reject
                },
                headers
            }
            this.requestPending.push(request);
            this.socketWrite({name: request.name,uid: request.uid, data, auth, req: headers});
        });
    }

    public get config(): Config | undefined {
        return this._config;
    }

    get name(): string {
        if (this.config && this.initialized) {
            return this.config.name;
        }
        throw new Error("Service is not correctly initialized");
    }

    get requireAuth(): boolean {
        if (this.config && this.initialized) {
            return this.config.requireAuth;
        }
        throw new Error("Service is not correctly initialized");
    }
}