chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    const headers = details.requestHeaders;
    const authHeader = headers.find(h => h.name.toLowerCase() === "authorization");

    if (authHeader && authHeader.value.startsWith("Bearer ")) {
      const token = authHeader.value;
      // console.log("Token:", token);

      chrome.storage.local.set({
        bearerToken: token
      });
    }

    return {
      requestHeaders: headers
    };
  }, {
    urls: [
      "*://kick.com/api/*",
      "*://*.kick.com/api/*"
    ]
  },
  ["requestHeaders"]
);