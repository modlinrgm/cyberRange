var http = require('http');
var url = require('url');

http.createServer(function (request, response) {

  // Check request for valid URL path - should be in the form '/locations/24060'

  var inputPath = url.parse(request.url,true).pathname;
  var pathArray = inputPath.split("/");
  var numberRegExp = /^[0-9]+$/;

  if (pathArray.length == 3 && pathArray[0] == "" && pathArray[1] == "locations"
       && pathArray[2].length == 5 && pathArray[2].match(numberRegExp)) {

    // URL Path is valid
    // Need zip code and optional scale paramater for HTTP call - use Farenheit scale by default

    var zipCode = pathArray.pop();

    var scaleOutput = "Fahrenheit"; // Fahrenheit, by default
    var scaleUnit = "f"; // code for Fahrenheit

    // Check for scale paramter set to 'Celsius'

    var queryString = url.parse(request.url,true).query;

    var scaleJson = JSON.stringify(queryString);
    var scaleMsg = JSON.parse(scaleJson);
    var scale = scaleMsg.scale;
    if (scale == "Celsius") {
      scaleOutput = "Celsius";
      scaleUnit = "m";  // code for Celsius
    }

    console.log("ready for call " + zipCode + " " + scaleOutput + " " + scaleUnit);

    // Query remote api for current temperature

    var api = 'http://api.weatherstack.com/current'; // api
    var accessKey = '381f4f598cd36bc8f1c7ae81f642aed3'; // api access key

    http.get(api + '?access_key=' + accessKey + '&query=' + zipCode + '&units='+scaleUnit, 
      (resp) => {
        var data = '';

        // HTTP requires poll for data.
        resp.on('data', (chunk) => {
          data += chunk;
        });

        // When all data is received, extract temperature
        resp.on('end', () => {
          console.log("call complete " + data);
          var  weather = JSON.parse(data);
          var temperature = weather.current.temperature;
          var temperString = { "temperature" : temperature, "scale" : scaleOutput };

          // Set response here, within a context where temperature value is accessible
          response.writeHead(200, {'Content-Type': 'text/json'});
          response.end("200  " + JSON.stringify(temperString));
      });

    }).on("error", (err) => {
          console.log("Error: " + err.message);
          response.writeHead(404, {'Content-Type': 'text/plain'});
          response.end("404 Error: " + err.message);
    });

  } else {

    // URL Path is not valid - return error code and explanatory body

    console.log("Invalid path format");
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.end("404 Path Not Found - Path should be formatted: \'/locations/ZZZZZ\' where ZZZZZ is a 5 digit zip code");

  }
}).listen(8080);

console.log('Server started');
