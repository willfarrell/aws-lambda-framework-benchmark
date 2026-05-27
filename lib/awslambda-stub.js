// Mirrors AWS Lambda's response-streaming protocol: on first write to the
// response stream, prepend the JSON metadata prelude followed by 8 NUL bytes
// as the body delimiter. Same pattern middy's own tests use.
const DELIMITER_LEN = 8;

globalThis.awslambda ??= {};

globalThis.awslambda.streamifyResponse ??= (handler) => handler;

globalThis.awslambda.HttpResponseStream ??= {
  from(stream, prelude) {
    let firstWrite = true;
    const originalWrite = stream.write.bind(stream);
    stream.write = (...args) => {
      if (firstWrite) {
        firstWrite = false;
        originalWrite(JSON.stringify(prelude));
        originalWrite(new Uint8Array(DELIMITER_LEN));
      }
      return originalWrite(...args);
    };
    return stream;
  },
};
