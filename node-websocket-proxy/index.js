var httpProxy = require('http-proxy');
const ociAuth = require("./oci-auth");
const redisClient = require("./redis");

var proxy = httpProxy.createProxy({
    ws: true,
    secure: false // for the localhost
});

(async () => {
  await redisClient.initializeRedisFromJson();
})();

async function validateRequestAndGetUserDetails(req, userDetails) {
  if (!req.method) {
    console.error("Request has no method defined");
    return false;
  }
  if (!req.url) {
    console.error("Request has no url defined");
    return false;
  }
  const userIdentifier = req.headers["x-email"] || req.headers["x-user"];
  if (!userIdentifier) {
    console.error("Request has no email/user defined");
    return false;
  }
  console.log("Received web request: " + req.method + " url: " + req.url + " user: " + userIdentifier);

  try {
    const detailsFromRedis = JSON.parse(await redisClient.getUserDetails(userIdentifier));
    for (const key in detailsFromRedis) {
      userDetails[key] = detailsFromRedis[key];
    }
    return true;
  } catch(err) {
    console.error(`Error during fetching data for user from cache: ${err}`);
    return false;
  }

  return true;
}

function validateAuthHeaderIsPresent(req) {
  if (!!req.headers["authorization"] || !!req.headers["Authorization"]) {
    return true;
  }
  return false;
}

function getBody(request) {
  return new Promise((resolve) => {
      const bodyParts = [];
      let body;
      request.on('data', (chunk) => {
          bodyParts.push(chunk);
      }).on('end', () => {
          body = Buffer.concat(bodyParts).toString();
          resolve(body);
      });
  });
}

proxy.on('proxyReq', function(proxyReq, req, res, options) {
  if (req.body && req.body.length > 0) {
    console.log("Restreaming body");
    proxyReq.write(req.body);
  }
});

proxy.on('onError', function (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain',
  });
  res.end('Something went wrong. And we are reporting a custom error message.' + err);
});

var server = require('http').createServer(async function(req, res) {
    log_request_from_oauth2proxy(req);
    let userDetailsObject = {};
    if (!await validateRequestAndGetUserDetails(req, userDetailsObject)) {
      console.log(`Request validation failed, stop the request: req: ${req.url}`);
      req.destroy();
    }
    // fetch body if any
    const body = await getBody(req);
    await ociAuth.signRequestWithOciIdentity(req, body, userDetailsObject);
    if (!await validateAuthHeaderIsPresent(req)) {
      console.log(`Auth Header is missing: req: ${req.url}`);
      console.log(JSON.stringify(req.headers));
      req.destroy();
    }
    log_request_to_downstream(req, userDetailsObject.routerHost);
    proxy.web(req, res, {
      target: userDetailsObject.routerHost
    },function(e){
      log_error(e,req);
    });
});

server.on('upgrade',async function(req,res){
    log_request_from_oauth2proxy(req);
    let userDetailsObject = {};
    if (!await validateRequestAndGetUserDetails(req, userDetailsObject)) {
      console.log(`Request validation failed, stop the request: req: ${req.url}`);
      req.destroy();
    }
    await ociAuth.signRequestWithOciIdentity(req, null, userDetailsObject);
    if (!validateAuthHeaderIsPresent(req)) {
      console.log(`Auth Header is missing: req: ${req.url}`);
      console.log(JSON.stringify(req.headers));
      req.destroy();
    }
    log_request_to_downstream(req, userDetailsObject.routerHost);
    proxy.ws(req, res, {
      target: userDetailsObject.routerHost
    },function(e){
      log_error(e,req);
    });
});

console.log("Server is running on 8891");
server.listen(8891);

function log_request_from_oauth2proxy(req) {
  console.log(`Request received from oauth2-proxy for url :${req.method}:${req.url}`);
}

function log_request_to_downstream(req, routerHost) {
  console.log(`Forwarding request to downstream at: ${routerHost}${req.url}`); // with request headers: ${JSON.stringify(req.headers)}
  console.log('-----');
}

function log_error(e, req){
    if (e){
        console.error(e.message);
        console.log('-----');
    }
}