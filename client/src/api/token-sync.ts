/**
 * Tiny bridge so the axios refresh interceptor can push a freshly-minted access
 * token back into the Pinia auth stores without the api layer importing the
 * stores (which would create a circular dependency).
 *
 * Each auth store registers a setter for its token key on creation; the
 * `createApiClient` factory calls `syncToken()` after a successful refresh.
 */
type TokenSetter = (token: string) => void;

const setters = new Map<string, TokenSetter>();

export function registerTokenSetter(key: string, setter: TokenSetter): void {
  setters.set(key, setter);
}

export function syncToken(key: string, token: string): void {
  setters.get(key)?.(token);
}
