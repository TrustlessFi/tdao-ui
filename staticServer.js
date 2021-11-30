const statik = require('node-static');

const file = new statik.Server('./static');
const port = process.env.PROXY_PORT || 3001;

require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    file.serve(request, response);
  }).resume();
}).listen(port);