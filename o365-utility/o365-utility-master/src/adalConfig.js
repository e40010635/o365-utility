import { AuthenticationContext, adalFetch, withAdalLogin } from "react-adal";
require("dotenv").config();

//Azure AD connection config
export const adalConfig = {
  tenant: "utccloud.onmicrosoft.com",
  clientId: "cea3883c-56a7-45cd-aa04-c5d41e726772",
  redirectUri: process.env.adalRedirect,
  endpoints: {
    api: "utctcloud.onmicrosoft.com/cea3883c-56a7-45cd-aa04-c5d41e726772"
  },
  cacheLocation: "localStorage"
};

export const authContext = new AuthenticationContext(adalConfig);

export const adalApiFetch = (fetch, url, options) =>
  adalFetch(authContext, adalConfig.endpoints.api, fetch, url, options);

export const withAdalLoginApi = withAdalLogin(
  authContext,
  adalConfig.endpoints.api
);
