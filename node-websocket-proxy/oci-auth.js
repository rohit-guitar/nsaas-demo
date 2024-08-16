const common = require("oci-common");
const promise = require("es6-promise");
require("isomorphic-fetch");
promise.polyfill();

// const notebookRouterPathForByoc = "/notebook";

async function signRequestWithOciIdentity(req, body, userDetails) {
  try {
    if (!userDetails.profileName) {
        throw new Error("Sign OCI request failed, profileName is missing");
    }
    if (!userDetails.notebookSessionOCID) {
        throw new Error("Sign OCI request failed, notebookSessionOCID is missing");
    }
    if (!userDetails.routerHost) {
        throw new Error("Sign OCI request failed, routerHost is missing");
    }
    if (!userDetails.configurationFilePath) {
        throw new Error("Sign OCI request failed, configurationFilePath is missing");
    }
    if (!userDetails.authType) {
        throw new Error("Sign OCI request failed, authType is missing");
    }
    if (!userDetails.routerSignatureHost) {
        throw new Error("Sign OCI request failed, routerSignatureHost is missing");
    } 

    // const notebookUrlPath = `/${userDetails.notebookSessionOCID}${notebookRouterPathForByoc}${req.url}`;
    const notebookUrlPath = `/${userDetails.notebookSessionOCID}${req.url}`;

    // 0. Create Config Provider
    let provider;
    if (userDetails.authType === "SESSION_TOKEN") {
        provider = new common.SessionAuthDetailProvider(
            userDetails.configurationFilePath,
            userDetails.profileName,
        );

        if (!provider.getSecurityToken()) {
            await provider.refreshSessionToken();
        }
    } else if (userDetails.authType === "API_KEY") {
        provider = new common.ConfigFileAuthenticationDetailsProvider(
            userDetails.configurationFilePath,
            userDetails.profileName,
        );
    }

    // 1. Create Request Signing instance
    const signer = new common.DefaultRequestSigner(provider);

    // 2. Create HttpRequest to be signed
    const request_headers = new Headers();
    for (const key in req.headers) {
        request_headers.set(key, req.headers[key]);
    }
    const httpRequest = {
        uri: `${userDetails.routerSignatureHost}${notebookUrlPath}`,
        headers: request_headers,
        method: req.method,
        body,
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
    req.body = body;
    console.log(`request has been signed successfully`);
  } catch (error) {
    console.log(`Error during signing request: ${error}`)
  }
}

module.exports = {
    signRequestWithOciIdentity,
}