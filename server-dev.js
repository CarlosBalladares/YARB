import { ServerStyleSheets, ThemeProvider } from "@material-ui/styles";
import React from "react";
import ReactDOMServer from "react-dom/server";
import App from "./src/App";
import config from "./webpack.dev.config.js";

const webpack = require("webpack");
// const middleware = require("webpack-dev-middleware");
const compiler = webpack(
  // webpack options
  config
);

var webpackDevMiddleware = require("webpack-dev-middleware");
var webpackHotMiddleware = require("webpack-hot-middleware");

const path = require("path");
const express = require("express");
const app = express(),
  DIST_DIR = path.resolve(__dirname, "./dist"),
  HTML_FILE = path.join(DIST_DIR, "index.html");

const fs = require("fs");

let rawdata = fs.readFileSync(path.resolve(DIST_DIR, "./stats.json"));
let stats = JSON.parse(rawdata);

const parsedStats = Object.values(stats.assetsByChunkName)
  .map(item => {
    var res = item.reduce(
      (acc, reditem) => {
        // console.log(acc);
        if (/\.js$/.test(reditem)) {
          return [[...acc[0], "./" + reditem], [...acc[1]]];
        } else if (/\.css$/.test(reditem)) {
          return [[...acc[0]], [...acc[1], "./" + reditem]];
        }

        return acc;
      },
      [[], []]
    );
    return res;
  })
  .reduce(
    (acc, item) => {
      return [[...acc[0], ...item[0]], [...acc[1], ...item[1]]];
    },
    [[], []]
  );

app.use(webpackDevMiddleware(compiler, {}));

app.use(
  webpackHotMiddleware(compiler, {
    log: console.log,
    path: "/__webpack_hmr",
    heartbeat: 10 * 1000
  })
);

app.use(express.static(DIST_DIR));
app.set("view engine", "pug");
app.get("/*", (req, res) => {
  // console.log("hello");
  const materialUIssr = new ServerStyleSheets();

  const content = ReactDOMServer.renderToString(
    materialUIssr.collect(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    )
  );
  // console.log(content);

  const [scripts, styles] = parsedStats;

  res.render("index", { content, scripts, styles, materialUIssr });
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`);
  console.log("Press Ctrl+C to quit.");
});
