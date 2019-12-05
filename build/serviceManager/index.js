"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var net = __importStar(require("net"));
var Service_1 = __importDefault(require("./Service"));
var ServiceManager = /** @class */ (function () {
    function ServiceManager(PORT, HOST) {
        var _this = this;
        this.PORT = PORT;
        this.HOST = HOST;
        this.services = [];
        this.authSerivce = null;
        this.server = net.createServer(function (socket) { return _this.addService(socket); }).listen(this.PORT, this.HOST);
    }
    ServiceManager.prototype.addServiceAuth = function (service) {
        // tslint:disable-next-line: no-console
        console.log("Service", service.name, "is the authService");
        this.authSerivce = service;
    };
    ServiceManager.prototype.serviceClosed = function (serviceClosed) {
        var serviceIndex = this.services.findIndex(function (service) { return service === serviceClosed; });
        if (this.authSerivce === this.services[serviceIndex]) {
            this.authSerivce = null;
        }
        this.services.splice(serviceIndex, 1);
        // tslint:disable-next-line: no-console
        console.log("Service " + serviceClosed.name + " closed");
    };
    ServiceManager.prototype.onRequest = function (req, res) {
        var _this = this;
        var url = req.url;
        // Check if service is loaded
        var serviceName = url.split(/\//g)[1].split("?")[0];
        var service = this.services.find(function (findService) { return findService.initialized && findService.name === serviceName; });
        if (!service) {
            return res.sendStatus(404);
        }
        // Build params for send to service
        var data = Object.assign({}, req.query, req.body);
        var requestParams = {
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
        return new Promise(function (resolve, reject) {
            var authRequest = function () {
                if (!_this.authSerivce) {
                    reject(401);
                    return;
                }
                return _this.authSerivce.sendAuthRequest(res, requestParams, data).then(function (authResponse) {
                    if (authResponse.headers.status !== "200" && authResponse.headers.status !== 200) {
                        if (!authResponse.headers.status) {
                            authResponse.headers.status = 401;
                        }
                        reject(authResponse.headers.status);
                    }
                    else {
                        resolve(authResponse.body);
                    }
                });
            };
            if (service.requireAuth && _this.authSerivce) {
                // Call authService with data
                authRequest();
            }
            else if (service.requireAuthRoutes.length > 0 && _this.authSerivce) {
                var require_1 = service.requireAuthRoutes.find(function (regexRoute) { return url.match(new RegExp(regexRoute, "gi")); });
                if (require_1) {
                    authRequest();
                }
                else {
                    resolve();
                }
            }
            else {
                resolve();
            }
        })
            .then(function (auth) {
            if (auth === void 0) { auth = {}; }
            return service.sendRequest(res, requestParams, data, auth);
        })
            .catch(function (status) {
            res.sendStatus(status);
        });
    };
    ServiceManager.prototype.addService = function (socket) {
        this.services.push(new Service_1.default(socket, this));
    };
    return ServiceManager;
}());
exports.default = ServiceManager;
