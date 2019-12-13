import * as net from "net";
import { RequestParams } from "../interfaces";
import Service from "./Service";

export default class ServiceManager {
    private server: net.Server;
    private services: Service[] = [];
    private authSerivce: Service | null = null;

    constructor(private PORT: number, private HOST: string) {
        this.server = net.createServer((socket: net.Socket) => this.addService(socket)).listen(this.PORT, this.HOST);
    }

    public addServiceAuth(service: Service) {
        // tslint:disable-next-line: no-console
        console.log("Service", service.name, "is the authService");
        this.authSerivce = service;
    }

    private addService(socket: net.Socket) {
        this.services.push(new Service(socket, this));
    }

    public checkCluster(currentService: Service) {
        let isCluster = false;
        this.services.forEach((service:Service) => {
            if (service === currentService) return;
            if (service.config && currentService.config) {
                if (currentService.config.name === service.name) {
                    isCluster = true;
                }
            }
        });

        if (isCluster) {
            const serviceIndex = this.services.findIndex((service: Service) => service === currentService);
            this.services.splice(serviceIndex, 1);
        }
        return isCluster;
    }

    public serviceClosed(serviceClosed: Service) {
        const serviceIndex = this.services.findIndex((service: Service) => service === serviceClosed);
        if (this.authSerivce === this.services[serviceIndex]) { this.authSerivce = null; }
        this.services.splice(serviceIndex, 1);
        // tslint:disable-next-line: no-console
        console.log("Service " + serviceClosed.name + " closed");
    }

    public onRequest(req: any, res: any) {
        const url: string = req.url;
        // Check if service is loaded
        const serviceName = url.split(/\//g)[1].split("?")[0];
        const service = this.services.find((findService: Service) => findService.initialized && findService.name === serviceName);
        if (!service) { return res.sendStatus(404); }

        // Build params for send to service
        const data = Object.assign({}, req.query, req.body);
        const requestParams: RequestParams = {
            headers: req.headers,
            method: req.method,
            parsedUrl: req._parsedUrl,
            url: req.originalUrl,
        };
        // Check if service required auth and if auth is loaded
        if ((service.requireAuth || service.requireAuthRoutes.length === 0)
            && (!this.authSerivce || !this.authSerivce.initialized)) {
            return res.sendStatus(401);
        }

        return new Promise((resolve, reject) => {
            const authRequest = () => {
                if (!this.authSerivce) {
                    reject(401);
                    return;
                }
                return this.authSerivce.sendAuthRequest(res, requestParams, data).then((authResponse) => {
                    if (authResponse.headers.status !== "200" && authResponse.headers.status !== 200) {
                        if (!authResponse.headers.status) { authResponse.headers.status = 401; }
                        reject(authResponse.headers.status);
                    } else {
                        resolve(authResponse.body);
                    }
                });
            };
            if (service.requireAuth && this.authSerivce) {
                // Call authService with data
                authRequest();
            } else if (service.requireAuthRoutes.length > 0 && this.authSerivce) {
                const require = service.requireAuthRoutes.find((regexRoute: string) => url.match(new RegExp(regexRoute, "gi")));
                if (require) {
                    authRequest();
                } else {
                    resolve();
                }
            } else {
                resolve();
            }
        })
        .then((auth = {}) => service.sendRequest(res, requestParams, data, auth))
        .catch((status: number) => {
            res.sendStatus(status);
        });
    }
}
