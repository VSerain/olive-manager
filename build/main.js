"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var serviceManager_1 = __importDefault(require("./serviceManager"));
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var app = express_1.default();
var HOST = "127.0.0.1";
var PORTFORSERVICES = 9999; // @todo Change by configurable port
var serviceManager = new serviceManager_1.default(PORTFORSERVICES, HOST);
app.use(body_parser_1.default.json()); // to support JSON-encoded bodies
app.use(body_parser_1.default.urlencoded({
    extended: true,
}));
app.all("*", function (req, res) {
    serviceManager.onRequest(req, res);
});
app.listen(8999, function () {
    // tslint:disable-next-line: no-console
    console.log("Server started on port 8999 :)");
});
