import Store from "./store";
export default (middlewareOptions: IMiddlewareOptions) => {
  const options = new Options(middlewareOptions);
  return async (req: any, res: any, next: any) => {
    const key = options.key(req);
    try {
      let bucket = await options.store.get(key);
      const currentTime = Date.now();
      if (!bucket) {
        bucket = options.createBucket(currentTime);
      }

      const tokens =
        (options.times / options.window) * (currentTime - bucket.lastTime) +
        bucket.tokens;
      bucket.tokens = tokens > options.times ? options.times : tokens;
      let pass = false;
      if (bucket.tokens >= 1) {
        bucket.tokens--;
        pass = true;
      }
      bucket.lastTime = currentTime;
      await options.store.set(key, bucket);
      if (pass) {
        options.onPass(req, res, next, bucket);
      } else {
        options.onReject(req, res, next, bucket);
      }
    } catch (err) {
      return next(err);
    }
  };
};

class Options {
  public store: Store;
  public times: number;
  public window: number;
  public key: (req: any) => string;
  public onPass: (req: any, res: any, next: any, bucket: IBucket) => void;
  public onReject: (req: any, res: any, next: any, bucket: IBucket) => void;
  constructor(options: IMiddlewareOptions) {
    this.window = options.window;
    this.times = options.times;
    this.store = new Store(options.store);
    this.key = options.key || ((req) => req.ip as string);
    this.onReject = options.onReject || ((req, res) => res.status(429).end());
    this.onPass = options.onPass || ((req, res, next) => next());
  }
  public createBucket(currentTime: number): IBucket {
    return {
      lastTime: currentTime,
      tokens: this.times,
    };
  }
}
interface IBucket {
  tokens: number;
  lastTime: number;
}
interface IMiddlewareOptions {
  store: Store;
  times: number;
  window: number;
  key?: (req: any) => string;
  onPass?: (req: any, res: any, next: any) => void;
  onReject?: (req: any, res: any) => void;
}
