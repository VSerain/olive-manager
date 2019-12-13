import ServiceManager from "./serviceManager";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();


const HOST: string = "127.0.0.1";
const PORTFORSERVICES: number = 9999; // @todo Change by configurable port

const serviceManager: ServiceManager = new ServiceManager(PORTFORSERVICES, HOST);

app.use(cors());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true,
}));

app.options("*", cors({
    origin: "*",
}));

app.all("*", (req,res) => {
    serviceManager.onRequest(req, res);
});

app.listen(8999, () => {
    // tslint:disable-next-line: no-console
    console.log("Server started on port 8999 :)");
});
