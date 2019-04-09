import * as express from "express";
import * as redis from "redis";
import rateLimit from "../src/index";

const app = express();

app.post(
  "/test",
  rateLimit({
    onReject: (req, res) => res.end("reject"),
    store: redis.createClient(),
    times: 1,
    window: 2000,
  }),
  (req, res, next) => {
    res.end("pass");
  },
);
app.listen(3000);
