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
        // Check if service is loaded
        const serviceName = url.split(/\//g)[1].split("?")[0];
        const service = this.services.find(service => service.initialized && service.name === serviceName);
        if (!service) return res.sendStatus(404);

        // Build params for send to service
        const data = Object.assign({}, req.query, req.body);
        const requestParams = {
            url: req.originalUrl,
            parsedUrl: req._parsedUrl,
            method: req.method,
            headers: req.headers
        };

        // Check if service required auth and if auth is loaded
        if (service.requireAuth && (!this.authSerivce || !this.authSerivce.initialized)) {
            return res.sendStatus(401);
        }

        return new Promise((resolve, reject) => {
            if (service.requireAuth && this.authSerivce) {
                // Call authService with data
                return this.authSerivce.sendRequest(res, requestParams, data).then(authResponse => {
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
            return service.sendRequest(res, requestParams, data, auth);
        }).catch(status => {
            res.sendStatus(status);
        });
    
    }
};
