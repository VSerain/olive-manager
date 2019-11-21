import { Socket } from "net";
import serviceHelper  from "../helpers/service-helper";
import { Config, RequestMicroService, RequestMicroServicePending, RequestSerivce, RequestParams } from "../interfaces";
import ServiceManager from "./index";

export default class Service {
    public initialized: boolean = false;
    private _config?: Config;
    private requestsPending: Array<RequestMicroServicePending> = [];

    constructor(private socket: Socket, private serviceManager: ServiceManager) {
        this.socketOn("close", (data) => this.serviceManager.serviceClosed(this));
        this.socketOn("error", (data) => this.serviceManager.serviceClosed(this));
        this.socketOn("data", this.onData.bind(this));
    }

    private socketOn(name:string, callback: (data: RequestSerivce) => void) {
        this.socket.on(name,(data: any) => {
            const objectData = serviceHelper.jsonValid(data.toString());
            if (objectData.error) return;
            callback(objectData);
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
        const requestIndex = this.requestsPending.findIndex((request) => request.uid === response.uid);
        if (!this.requestsPending[requestIndex]) return;

        this.requestsPending[requestIndex].resolver.resolve(response.data.body);
        this.requestsPending[requestIndex].res.status(response.data.headers.status).send(response.data.body);
        this.requestsPending.splice(requestIndex,1);
    }

    private onAuthResponse(response: any) {
        const requestIndex = this.requestsPending.findIndex((request) => request.uid === response.uid);
        if (!this.requestsPending[requestIndex]) return;

        this.requestsPending[requestIndex].resolver.resolve(response.data);
        this.requestsPending.splice(requestIndex,1);
    }

    public sendRequest(res: any, requestParams: RequestParams, data: any = {}, auth: any = {}): Promise<any> {
        return this._sendRequestToMicroSerivce("request",res, requestParams, data, auth);
    }

    public sendAuthRequest(res: any, requestParams: RequestParams, data: any = {}, auth: any = {}): Promise<any>  {
        return this._sendRequestToMicroSerivce("authRequest",res, requestParams, data, auth);
    }

    private _sendRequestToMicroSerivce(name: string, res: any, requestParams: RequestParams, data: any = {}, auth: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const uid =  parseInt((new Date().getTime() * (Math.random() + 1 * 100)).toFixed(0));
            const request : RequestMicroService = {
                name,
                uid,
                data: data,
                auth,
                requestParams
            };
            const requestPending: RequestMicroServicePending = {
                name,
                uid,
                data: data,
                auth,
                requestParams,
                resolver : {
                    resolve,
                    reject
                },
                res: res,
            }

            this.requestsPending.push(requestPending);
            this.socketWrite(request);
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