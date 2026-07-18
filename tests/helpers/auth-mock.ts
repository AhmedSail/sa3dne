/**
 * Stand-in for the better-auth server instance.
 *
 * Every protected route resolves the caller identically via
 * `auth.api.getSession({ headers })`, so controlling this single function is
 * enough to impersonate any role in a route test.
 */

export type TestSession = {
  user: { id: string; role: string; email?: string; name?: string };
} | null;

class AuthMock {
  private session: TestSession = null;

  readonly auth = {
    api: {
      getSession: async () => this.session,
    },
  };

  /** Act as this user for subsequent requests. */
  setSession(session: TestSession) {
    this.session = session;
  }

  /** Convenience: act as a signed-in user with the given role. */
  signInAs(role: string, id = `user-${role}`) {
    this.setSession({ user: { id, role } });
  }

  /** Act as an anonymous (signed-out) visitor. */
  signOut() {
    this.setSession(null);
  }

  reset() {
    this.session = null;
  }
}

export const authMock = new AuthMock();
