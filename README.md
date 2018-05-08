# Unix Domain To Web Socket

A simple utility to pipe unix domain data to web sockets.

## Usage

Command line
```bash
node src/index.js /path/to/progname.sock "my-socket-io-event-name" 1080 utf8
```

Docker
```bash
docker run 
```

## TODO / Issues
PRs on these are especially welcome.
* Currently this only supports data moving from the domain socket to the web socket, but someone may wish it to be bidirectional.
* Add ava tests (no tests yet. lame, I know. PRs welcome :-))
