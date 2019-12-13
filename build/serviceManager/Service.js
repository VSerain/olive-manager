"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var service_helper_1 = __importDefault(require("../helpers/service-helper"));
var Service = /** @class */ (function () {
    function Service(socket, serviceManager) {
        var _this = this;
        this.socket = socket;
        this.serviceManager = serviceManager;
        this.initialized = false;
        this.requestsPending = [];
        this.socketOn("close", function (data) { return _this.serviceManager.serviceClosed(_this); });
        this.socketOn("error", function (data) { return _this.serviceManager.serviceClosed(_this); });
        this.socketOn("data", this.onData.bind(this));
    }
    Object.defineProperty(Service.prototype, "config", {
        get: function () {
            return this._CONFIG;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Service.prototype, "name", {
        get: function () {
            if (this.config && this.initialized) {
                return this.config.name;
            }
            throw new Error("Service is not correctly initialized");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Service.prototype, "requireAuth", {
        get: function () {
            if (this.config && this.initialized) {
                return this.config.requireAuth;
            }
            throw new Error("Service is not correctly initialized");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Service.prototype, "requireAuthRoutes", {
        get: function () {
            if (this.config && this.initialized) {
                return this.config.requireAuthRoutes || [];
            }
            throw new Error("Service is not correctly initialized");
        },
        enumerable: true,
        configurable: true
    });
    Service.prototype.sendRequest = function (res, requestParams, data, auth) {
        if (data === void 0) { data = {}; }
        if (auth === void 0) { auth = {}; }
        return this._sendRequestToMicroSerivce("request", res, requestParams, data, auth);
    };
    Service.prototype.sendAuthRequest = function (res, requestParams, data, auth) {
        if (data === void 0) { data = {}; }
        if (auth === void 0) { auth = {}; }
        return this._sendRequestToMicroSerivce("authRequest", res, requestParams, data, auth);
    };
    Service.prototype.socketOn = function (name, callback) {
        this.socket.on(name, function (data) {
            var objectData = service_helper_1.default.jsonValid(data.toString());
            if (objectData.error) {
                return;
            }
            callback(objectData);
        });
    };
    Service.prototype.socketWrite = function (request) {
        this.socket.write(JSON.stringify(request));
    };
    Service.prototype.onData = function (request) {
        switch (request.name) {
            case "config":
                this.initConfiguration(request.data);
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
    };
    Service.prototype.initConfiguration = function (data) {
        this._CONFIG = data;
        if (!this.serviceManager.checkCluster(this)) {
            this.initialized = true;
            this.log("Service " + data.name + " initialized");
            if (data.isAuth) {
                this.serviceManager.addServiceAuth(this);
            }
        }
    };
    Service.prototype.sendResponse = function (response) {
        var requestIndex = this.requestsPending.findIndex(function (request) { return request.uid === response.uid; });
        if (!this.requestsPending[requestIndex]) {
            return;
        }
        this.requestsPending[requestIndex].resolver.resolve(response.data.body);
        this.requestsPending[requestIndex].res.status(response.data.headers.status).send(response.data.body);
        this.requestsPending.splice(requestIndex, 1);
    };
    Service.prototype.onAuthResponse = function (response) {
        var requestIndex = this.requestsPending.findIndex(function (request) { return request.uid === response.uid; });
        if (!this.requestsPending[requestIndex]) {
            return;
        }
        this.requestsPending[requestIndex].resolver.resolve(response.data);
        this.requestsPending.splice(requestIndex, 1);
    };
    Service.prototype._sendRequestToMicroSerivce = function (name, res, requestParams, data, auth) {
        var _this = this;
        if (data === void 0) { data = {}; }
        if (auth === void 0) { auth = {}; }
        return new Promise(function (resolve, reject) {
            var uid = new Date().getTime() * (Math.random() + 1 * 100);
            var request = {
                name: name,
                uid: uid,
                data: data,
                auth: auth,
                requestParams: requestParams,
            };
            var requestPending = {
                name: name,
                uid: uid,
                data: data,
                auth: auth,
                requestParams: requestParams,
                resolver: {
                    resolve: resolve,
                    reject: reject,
                },
                res: res,
            };
            _this.requestsPending.push(requestPending);
            _this.socketWrite(request);
        });
    };
    Service.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // tslint:disable-next-line: no-console
        console.log.apply(console, args);
    };
    return Service;
}());
exports.default = Service;
