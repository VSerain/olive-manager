import * as net from "net";
import Service from "./Service";

export default class ServiceManager {
    private server: net.Server;
    private services: Array<Service> = [];
    private authSerivce: Service | null = null;

    constructor(private PORT: number, private HOST: string) {
        this.server = net.createServer((socket: net.Socket) => this.addService(socket)).listen(this.PORT, this.HOST);
    }

    private addService(socket: net.Socket) {
        this.services.push(new Service(socket, this));
    }

    public addServiceAuth(service: Service) {
        console.log("Service", service.name, "is the auth Service");
        this.authSerivce = service;
    }

    public serviceClosed(serviceClosed: Service) {
        const serviceIndex = this.services.findIndex((service) => service === serviceClosed);
        this.services.splice(serviceIndex,1);
        console.log("Service " + serviceClosed.name + " closed");
    }

    public onRequest(req: any,res: any) {
        const url: string = req.url;
        const serviceName = url.split(/\//g)[1].split("?")[0];
        const service = this.services.find(service => service.initialized && service.name === serviceName);
        if (!service) return res.sendStatus(404);
        const data = Object.assign({}, req.query, req.body);
        const headers = {
            url: req.originalUrl,
            parsedUrl: req._parsedUrl,
            method: req.method,
            headers: req.headers
        };
        if (service.requireAuth && !this.authSerivce) {
            return res.sendStatus(401);
        }

        return new Promise((resolve, reject) => {
            if (service.requireAuth && this.authSerivce) {
                return this.authSerivce.sendRequest(data, {}, headers, res).then(authResponse => {
                    if (authResponse.status != "200") {
                        if(!authResponse.status) authResponse.status = 401;
                        return reject(authResponse.status);
                    }
                    else {
                        return resolve(authResponse.data);
                    }
                });
            }
            resolve();
        }).then((auth = {}) => {
            return service.sendRequest(data, auth, headers, res);
        }).catch(status => {
            res.sendStatus(status)
        });
    
    }
};
