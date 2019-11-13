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