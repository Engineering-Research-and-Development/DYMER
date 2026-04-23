interface AuthorizationBaseRules {
  _id?: string;
  authtype: 'jwtparent' | 'oidc';
  host: string;
  active: boolean;
}

interface JWTAuthorizationConfig extends AuthorizationBaseRules {
  prop: JWTParentOptions;
}

interface OIDCAuthorizationConfig extends AuthorizationBaseRules {
  prop: OIDCOptions;
}

interface JWTParentOptions {
  secretkey?: string;
}

interface OIDCOptions {
  secretkey?: string;
  oidcname?: string;
  client?: clientOIDC;
  dymer?: dymerOIDC;

}

interface clientOIDC {
  discover?: string;
  scope?: string;
  client_id?: string;
  response_type?: string;
}

interface dymerOIDC {
  issuer?: string;
  clientSecret?: string;
  client_id?: string;
  authorizationURL?: string;
  userInfoURL?: string;
  tokenURL?: string;
  callbackURL?: string;
  passReqToCallback?: string;
  scope?: string;
}

export interface JSONResponse {
  success: string;
  message: string;
  data: AuthorizationRules[];
  extraData: Record<string, any>
}

export type AuthorizationRules = JWTAuthorizationConfig | OIDCAuthorizationConfig
