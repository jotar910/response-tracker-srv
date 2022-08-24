const fs = require('fs');
const https = require("https");
const express = require("express");
const URL = require('url');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

https
  .createServer(
    {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    },
    app
  )
  .listen(port, () => {
    console.log("Server started on port " + port);
  });

app.route("/").get(handleRedirect).options(handleOptions);
app.route("/health").get(handleHealth);

function handleRedirect(req, res) {
  const definition = req.get("X-Definition");
  const body = definition ? JSON.parse(definition) : '{}';
  const url = URL.parse(req.param("from"));

  for (const { name, value } of req.cookies || []) {
    res.cookie(name, value);
  }

  res
    .status(+body.status || 200)
    .set({ "Access-Control-Allow-Origin": url.protocol + "//" + url.host })
    .set(body.headers || {})
    .json(JSON.parse(body.response) || '');
}

function handleOptions(req, res) {
  const requestedHeaders = req.get("Access-Control-Request-Headers");
  const allowHeaders = "Content-Type, Origin, Accept, X-Definition" + (requestedHeaders ? ", " + requestedHeaders : "");
  const url = URL.parse(req.param("from"));
  res
    .set({
      "Vary": "Origin",
      "Access-Control-Expose-Headers": "X-Definition",
      "Access-Control-Allow-Origin": url.protocol + "//" + url.host,
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS, HEAD",
      "Access-Control-Allow-Headers": allowHeaders,
    })
    .sendStatus(200);
}

function handleHealth(_, res) {
  res.sendStatus(200);
}
