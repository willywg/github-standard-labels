var mapLimit = require('map-limit')
var request = require('request')

var colors = {
  'Priority: Low': '009800',
  'Priority: Medium': 'fbca04',
  'Priority: High': 'eb6420',
  'Priority: Critical': 'e11d21',
  'Status: Abandoned': '000000',
  'Status: Accepted': '009800',
  'Status: Available': 'bfe5bf',
  'Status: Blocked': 'e11d21',
  'Status: Completed': '006b75',
  'Status: In Progress': 'cccccc',
  'Status: On Hold': 'e11d21',
  'Status: Pending': 'fef2c0',
  'Status: Review Needed': 'fbca04',
  'Status: Revision Needed': 'e11d21',
  'Type: Bug': 'e11d21',
  'Type: Maintenance': 'fbca04',
  'Type: Enhancement': '84b6eb',
  'Type: Question': 'cc317c'
}

module.exports = githubStandardLabels

// https://developer.github.com/v3/issues/labels/
function githubStandardLabels (opts, cb) {
  var username = opts.username
  var github = opts.github
  var repo = opts.repo

  var auth = github.token + ':x-oauth-basic@'
  var uri = 'https://' + auth +
    'api.github.com/repos/' +
    username + '/' + repo + '/labels'

  var reqOpts = {
    uri: uri,
    headers: { 'User-Agent': github.user }
  }

  var labels = null
  var operations = [
    getLabels,
    cleanLabels,
    createLabels
  ]

  mapLimit(operations, 1, iterator, cb)

  function iterator (fn, cb) {
    fn(cb)
  }

  function getLabels (done) {
    request(reqOpts, function (err, res, body) {
      if (err) return done(err)
      if (res.statusCode !== 200) {
        return done(new Error('non-200 statusCode received. ' + body))
      }
      if (!body) return done(new Error('no body returned'))

      try {
        labels = JSON.parse(body)
      } catch (e) {
        return done(e)
      }

      done()
    })
  }

  function cleanLabels (done) {
    mapLimit(labels, 1, iterator, done)

    function iterator (label, done) {
      var opts = {
        uri: uri + '/' + label.name,
        headers: { 'User-Agent': github.user }
      }
      request.del(opts, function (err, res, body) {
        if (err) return done(err)
        if (res.statusCode !== 204) {
          return done(new Error('non-204 statusCode received. ' + body))
        }
        done()
      })
    }
  }

  function createLabels (done) {
    mapLimit(Object.keys(colors), 1, iterator, done)
    function iterator (name, done) {
      var color = colors[name]
      var opts = {
        uri: uri,
        headers: { 'User-Agent': github.user }
      }
      var req = request.post(opts, function (err, res, body) {
        if (err) return done(err)
        if (res.statusCode !== 201) {
          return done(new Error('non-201 statusCode received. ' + body))
        }
        done()
      })

      req.end(JSON.stringify({
        name: name,
        color: color
      }))
    }
  }
}
