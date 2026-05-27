import { Writable } from "node:stream";

export function createNullStream() {
  const stream = new Writable({
    write(_chunk, _enc, cb) {
      cb();
    },
    final(cb) {
      cb();
    },
  });
  stream.setContentType = () => {};
  return stream;
}
