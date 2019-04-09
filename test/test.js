const tap = require('tap')
const express = require('express')
const request = require('supertest')
const rateLimit = require('../lib/').default
class Store {
  constructor() {
    this._store = {}
  }
  get(key, cb) {
    cb(null, this._store[key] || null)
  }
  set(key, value, cb) {
    this._store[key] = value
    cb(null)
  }
}

tap.test('rate limit', t => {
  const app = createApp({ store: new Store(), times: 2, window: 200 })
  request(app)
    .get('/')
    .end(response(t, 200, 1, noop))
  request(app)
    .get('/')
    .end(response(t, 200, 0, noop))
  setTimeout(() => {
    request(app)
      .get('/')
      .end(response(t, 429, 0, noop))
  }, 50)
  setTimeout(() => {
    request(app)
      .get('/')
      .end(response(t, 200, 0, noop))
  }, 120)
  setTimeout(() => {
    request(app)
      .get('/')
      .end(response(t, 200, 1))
  }, 320)
})

tap.test('custom key', t => {
  const customKey = 'customKey'
  const store = new Store()
  const app = createApp({
    window: 100,
    times: 1,
    store,
    key() {
      return customKey
    },
  })

  request(app)
    .get('/')
    .end((err, res) => {
      t.equal(res.status, 200)
      store.get(customKey, (err, bucket) => {
        t.ok(bucket)
        t.end()
      })
    })
})
tap.test('custom onReject', t => {
  const app = createApp({
    onReject: function(req, res, next, bucket) {
      res.status(503).json(bucket)
    },
    window: 100,
    times: 1,
    store: new Store(),
  })

  request(app)
    .get('/')
    .end(noop)
  request(app)
    .get('/')
    .end(response(t, 503, 0))
})
function createApp(options) {
  const app = express()
  options.onPass = (req, res, next, bucket) => {
    res.status(200).json(bucket)
  }
  app.get('*', rateLimit(options))
  return app
}

function response(t, status, tokens, callback) {
  return (err, res) => {
    t.equal(res.status, status)

    if (tokens) {
      t.equal(Math.round(res.body.tokens), tokens)
    }

    if (callback) {
      callback()
    } else {
      t.end()
    }
  }
}

function noop() {}
