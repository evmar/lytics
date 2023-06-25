lytics, ANalytics without the Ad Network

Nothing to see here, mostly just tinkering with typed arrays.

## Running

Ingest logs:

```
$ cd ingest
$ cat path/to/all/my/logs | go run . path/to/output/dir
```

Run server:

```
$ cd web
$ npm run serve
```
