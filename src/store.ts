export default class Store {
  constructor(private client: any) {}
  public get = (key: string): any => {
    return new Promise((res, rej) => {
      this.client.get(key, (err: Error, value: string) => {
        if (err) {
          rej(err);
        } else {
          res(JSON.parse(value));
        }
      });
    });
  }
  public set = (key: string, value: any) => {
    return new Promise((res, rej) => {
      this.client.set(key, JSON.stringify(value), (err: Error) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      });
    });
  }
}
