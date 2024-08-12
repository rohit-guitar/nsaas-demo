const common = require("oci-common");
const promise = require("es6-promise");
require("isomorphic-fetch");
promise.polyfill();

const configurationFilePath = "/config/.oci/config.bak"; // We will mount the oci config dir
const configProfile = "DEFAULT";
// const notebookRouterPathForByoc = "/notebook";

async function signRequestWithOciIdentity(req, targetHost, userDetails) {
  try {
    if (!userDetails.profileName) {
        throw new Error("Sign OCI request failed, profileName is missing");
    }
    if (!userDetails.notebookSessionOCID) {
        throw new Error("Sign OCI request failed, notebookSessionOCID is missing");
    }

    // const notebookUrlPath = `/${userDetails.notebookSessionOCID}${notebookRouterPathForByoc}${req.url}`;
    const notebookUrlPath = `/${userDetails.notebookSessionOCID}${req.url}`;

    // 0. Create Config Provider
    const provider = new common.ConfigFileAuthenticationDetailsProvider(
        configurationFilePath,
        userDetails.profileName || configProfile,
    );

    // 1. Create Request Signing instance
    const signer = new common.DefaultRequestSigner(provider);

    // 2. Create HttpRequest to be signed
    const request_headers = new Headers();
    for (const key in req.headers) {
        request_headers.set(key, req.headers[key]);
    }
    const httpRequest = {
        uri: `${targetHost}${notebookUrlPath}`,
        headers: request_headers,
        method: req.method
    };

    // 3. sign request
    await signer.signHttpRequest(httpRequest);

    //4. Serialize headers to dict
    const serialized_req_headers = {};
    httpRequest.headers.forEach((value, name) => {
        serialized_req_headers[name] = value;
    });

    // 5. Modify the current request object with new headers
    req.url = notebookUrlPath; //modifing req url
    req.headers = serialized_req_headers;
    console.log(`request has been signed successfully`);
  } catch (error) {
    console.log(`Error during signing request: ${error}`)
  }
}

module.exports = {
    signRequestWithOciIdentity,
}