#
# Serve the fasters
#
Hapi = require 'hapi'

port = parseInt(process.env.PORT, 10) or 5000

appVersion = require('./package.json')?.version or '13.3.7'

#
# Helper Functions
#

handlebarsEngine = ->
  handlebars = require 'handlebars'

  uniqueVersion = new Buffer(appVersion).toString('base64')

  handlebars.registerHelper 'uurl', (url) -> "/v#{uniqueVersion}/#{url}"

  return handlebars

#
# Start the server configuration engines!
#
server = Hapi.createServer port,
  views:
    path: 'templates'
    engines:
      html:
        module: handlebarsEngine()

server.route [
  method: 'GET'
  path: '/'
  handler: (request) ->
    request.reply.view 'index.html',
      version: appVersion
      development: process.env.NODE_ENV isnt "production"
,
  method: 'GET'
  path: '/{ignore}/{path*}'
  config:
    cache:
      mode: 'client'
      expiresIn: 31536000 # 1000ms * 60s * 60min * 24hrs * 365days == 1 year!
    handler:
      directory:
        path: '.'
        listing: false
        index: true
]

# Print out the errors please
server.on 'request', (request, event, tags) ->
  console?.error event if tags.error

# After you start, please let me know where you are listening
server.start ->
  console?.log "The server is listening at", server.info.uri

