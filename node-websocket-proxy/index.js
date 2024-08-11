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

var targetHost = process.env.TARGET_HOST;
console.log(`Target host set to ${targetHost}`);

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

var server = require('http').createServer(async function(req, res) {
    let userDetailsObject = {};
    if (!await validateRequestAndGetUserDetails(req, userDetailsObject)) {
      console.log(`Request validation failed, stop the request: req: ${req.url}`);
      req.destroy();
    }
    await ociAuth.signRequestWithOciIdentity(req, targetHost, userDetailsObject);
    if (!await validateAuthHeaderIsPresent(req)) {
      console.log(`Auth Header is missing: req: ${req.url}`);
      req.destroy();
    }
    proxy.web(req, res, {
      target: targetHost
    },function(e){
      log_error(e,req);
    });
});

server.on('upgrade',async function(req,res){
    let userDetailsObject = {};
    if (!await validateRequestAndGetUserDetails(req, userDetailsObject)) {
      console.log(`Request validation failed, stop the request: req: ${req.url}`);
      req.destroy();
    }
    await ociAuth.signRequestWithOciIdentity(req, targetHost, userDetailsObject);
    if (!validateAuthHeaderIsPresent(req)) {
      console.log(`Auth Header is missing: req: ${req.url}`);
      console.log(JSON.stringify(req.headers));
      req.destroy();
    }
    proxy.ws(req, res, {
      target: targetHost
    },function(e){
      log_error(e,req);
    });
});

console.log("Server is running on 8891");
server.listen(8891);
  
function log_error(e, req){
    if (e){
        console.error(e.message);
        console.log(req.headers.host,'-->',targetHost);
        console.log('-----');
    }
}