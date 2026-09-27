import test from 'node:test';
import assert from 'node:assert/strict';
import { connectVotingApi } from '../src/voting-connection.js';

test('presentation connects immediately and reports loss and recovery', () => {
  const statuses = [];
  let stream;
  class FakeEventSource {
    constructor(url) {
      this.url = url;
      stream = this;
    }

    close() {
      this.closed = true;
    }
  }

  const disconnect = connectVotingApi((status) => statuses.push(status), FakeEventSource);
  assert.equal(stream.url, 'https://vote-api.emrecanulu.com/v1/connection');
  stream.onopen();
  stream.onerror();
  stream.onopen();
  assert.deepEqual(statuses, ['connecting', 'connected', 'disconnected', 'connected']);
  disconnect();
  assert.equal(stream.closed, true);
});
