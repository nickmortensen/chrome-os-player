const assert = require('assert');

const util = require('../../../src/storage/util');

describe('Storage Util', () => {
  it('should parse GET URI', () => {
    const requestText =
      `GET /file1 HTTP/1.1
      Host: 127.0.0.1:8989
      User-Agent: curl/7.54.0
      Accept: */*`;

    const uri = util.parseUri(requestText);
    assert.equal(uri, '/file1');
  });

  it('should parse GET URI without query string', () => {
    const requestText =
      `GET /file?param1=1&param2=2 HTTP/1.1
      Host: 127.0.0.1:8989
      Connection: keep-alive
      Upgrade-Insecure-Requests: 1
      User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36
      Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8
      Accept-Encoding: gzip, deflate, br
      Accept-Language: en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7`;

    const uri = util.parseUri(requestText);
    assert.equal(uri, '/file');
  });

  it('should not parse POST URI', () => {
    const requestText =
      `POST / HTTP/1.1
      Host: localhost:8989
      User-Agent: curl/7.54.0
      Accept: */*
      Content-Length: 27
      Content-Type: application/x-www-form-urlencoded

      param1=value1&param2=value2`;

    const uri = util.parseUri(requestText);
    assert.equal(uri, null);
  });
});
