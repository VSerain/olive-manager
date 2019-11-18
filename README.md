# Welcome to Olive Manager!
Olive Manager is node server for manage the Olive micro services.
He is manage the HTTP server and relays the request to micro services !

# Launch for dev

 1. Clone the repository !
 2. Use `npm i` for install dependency
 3. Use `npm run watch` for build and rebuild in case of a change in a file
 4. And use `nodemon` on other terminal for launch the manager

The files `test.js` and `testAuth.js` is micro service for test the manager. 
 1. Use `nodemon testAuth.js` for launch a micro service AuthTest ! Who's going to connect on manager as an auth service !
 2. Use `nodemon test.js` for launch a micro service Test ! Who's going to connect on manager.
 3. For call the micro service Test you can call `GET http://localhost:9999/test`
 4. If an 401 is returned check if AuthTest is loaded and if is initialized
 5. And now you can dev.

# Launch on production
## /!\  In Progress
 1. Use `npm i -g olive-manager` for install Olive Manager
 2. Use `olive start` for launch the manager
 3. You can change the default port whit option `--port 80` or `-p 80`
 4. You can change the default microservice port whit option  `--msport 1234` or `-msp 1234`

PS: Manager use pm2 for launch server 

# Interfaces between Manager and micro services

## On micro services call the manager

The micro service is connected to the manager with a TCP socket and for all request the format is a JSON.

For any request the interface is :
```
{
    name: string, // Type of request. Exemple : "response" or "config"
    uid: number, // The unique id
    data: any, // The content of request
}
```

The manage support many type !

### Definition types
1. The type `config` allows to configure the micro service in Manager.
2. The type `response` when the micro service respond has an request of the manager
3. The type `authResponse` when the Auth micro service respond has an request of the manager

For any types the params `data` as a special interface :

#### config :
```
data: {
    "name": string, // The name of micro service
    "requireAuth": boolean // If true, the micro service require authentification 
    "isAuth": boolean // The service is the AuthService or not
}
```
The params `name` will be used for create route and for differentiated the micro services. If name is `user` so the route for call the user micro service is {{HOST}}/user !

The params ``requireAuth`` define if the micro service require a auth for they routes (All routes of micro service). If is true, at the moment on the manager get an request, he send in first part the request to the AuthService and once the AuthService as responde the manager resend the request to the micro service ! Is the authService return an other status of 200, the manager return the error status code !

The params ``isAuth`` define if the micro service should be considered as a AuthService. 

#### response :
```
data: data: {
    status: number // HTTP Status
    data: any // All neceseray information for authService
}
```
The params `status` is the http code returned by the service if the is 200 the request continue that propagation, but if is not 200 the manager send an http response with the status code.

The params ``data`` is send unaltered form the client http

#### authResponse :
```
data: {
    status: number // HTTP Status
    data: any // All neceseray information for authService
}
```

The params `status` is the http code returned by the auth service if the is 200 the request continue that propagation, but if is not 200 the manager send an http response with the status code.

The params `data` is an object where all params is send to the next service with auth data. For exemple he contain the user data.

## On manager call micro service

The manager send various type of the request.

For any request the manager send allways from the same interface :
```
{
    name: string, // Name for the request type
    uid: number, // the unique id, allways build by the manager
    data: any, // All data send with HTTP request, query and/or body
    auth: any, // the data send by the auth service
    requestParams: any // Is the information from the http request
}
```

### Definition types

The type `request` send to micro service when the manager get an http request

The type `requestAuth` is send to auth micro service for authenticate the current http request

## Overall functioning of the architecture

On start manager, the different micro services connect to the manager and micro service send a request config !

On manager recieve a http request, the manager check if micro service where the request must be send is load and init.   
If micro service is ok, the manager check if the micro service require an auth, if is true, he (the manager) send a request to auth micro service ('requestAuth').   
If the auth service return an http code 200, this manager send the request to micro service, and after the answer of the micro service, the manager re-send the answer to http client .
If the auth service return an other http code the manager send the code to http client.