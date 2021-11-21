const statik = require('node-static');

const file = new statik.Server('./static');

require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    file.serve(request, response);
  }).resume();
}).listen(3001);