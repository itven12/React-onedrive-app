import { PublicClientApplication } from "@azure/msal-browser";

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "f7fa030b-4841-4f03-8106-66a1f9548f2b",
    authority:
      "https://login.microsoftonline.com/common/oauth2/v2.0/a2c95f58-acbd-477c-a7c2-b23fd3e55380",
    redirectUri: "https://itven12.github.io/React-onedrive-app/",
  },
});
