export interface User {
  [prop: string]: any;

  id?: number | string | null;
  name?: string;
  email?: string;
  avatar?: string;
  roles?: any[];
  permissions?: any[];
}

export interface Token {
  [prop: string]: any;

  access_token: string;
  token_type?: string;
  expires_in?: number;
  exp?: number;
  //refresh_token?: string;//TODO build auth/refresh in BE
  csrf_token?: string;
}

/*
{
"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiODVjMTFkNjE0ZjM3NTg3N2ZmNDQ0NDQzMWY0MjU1OWRlMzBhYTJlMDY1MzQ1NDc2ODkxZTIyMDAxOTA1MjUxYzU0YWFlZTc1NTkxNDRhYzI2MjY5YTJlZmMzYTUwYzVkOTgyMWZkYTM1NTQxYTUwYWJkZTk2MmI0ZjlhYTYzN2ZjNDM0ZDllNTBhNDg3ODc1MzQwYjNhZmU4MmI4MDg0OCIsImlhdCI6MTc0NjgxMTQzMywiZXhwIjoxNzQ2ODE1MDMzfQ._k-afo3QPkESu8iCxPy0AzLAgkHw8SA7cwAZ2XaU9_w",
"token_type":"Bearer",
"csrfToken":"14b5f917e5685c198f751a95a798ef49c75ed0cdd3e18d23afb5443093245bec",
"DYMisi":"eyJyb2xlcyI6W3sicm9sZSI6ImFwcC1hZG1pbiJ9XX0=",
"d_rl":"W3sicm9sZSI6ImFwcC1hZG1pbiJ9XQ==",
"d_lp":"e30=",
"exp":1750411434
}

All JWTs can be access tokens, but not all access tokens are JWTs
*/
