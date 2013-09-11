//
// Serve the fasters
//
var Hapi = require('hapi');

var port = parseInt(process.env.PORT) || 5000;

var packageJSON = require("./package.json");

var appVersion = packageJSON.version || '13.3.7';

//
// Start the server configuration engines!
//
var server = Hapi.createServer(port, {
	views: {
		path: 'templates',
		engines: {
			html: {
        module: handlebarsEngine()
      }
		}
	}
});

server.route([{
  method: 'GET',
  path: '/',
  handler: function(request) {
    request.reply.view('index.html', {
      version: appVersion,
      development: process.env['NODE_ENV'] !== "production"
    });
  }
}, {
  method: 'GET',
  path: '/{ignore}/{path*}',
  config: {
    cache: {
      mode: 'client',
      expiresIn: 31536000 /* 1000ms * 60s * 60min * 24hrs * 365days == 1 year! */
    },
    handler: {
      directory: {
        path: '.',
        listing: false,
        index: true
      }
    }
  }
}]);

// Print out the errors please
server.on('request', function (request, event, tags) {
    if (tags.error) {
        console.error(event);
    }
});

// After you start, please let me know where you are listening
server.start(function() {
  console.log("The server is listening at", server.info.uri);
});


//
// Helper Functions
//

function handlebarsEngine() {
  var handlebars = require('handlebars');

  var uniqueVersion = new Buffer(appVersion).toString('base64');

  handlebars.registerHelper('uurl', function(url) {
    return "/v" + uniqueVersion + "/" + url;
  });

  return handlebars;
}
