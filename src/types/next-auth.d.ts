declare module 'next-auth' {
  interface NextAuthConfig {
    adapter?: any
    session?: any
    providers?: any[]
    callbacks?: any
    pages?: any
    events?: any
    debug?: boolean
    trustHost?: boolean
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      onboardingCompleted?: boolean;
      twoFactorEnabled?: boolean;
      isEmailVerified?: boolean;
    };
  }

  interface User {
    id: string;
    role?: string;
    onboardingCompleted?: boolean;
    twoFactorEnabled?: boolean;
    isEmailVerified?: boolean;
  }

  function NextAuth(config: NextAuthConfig): {
    handlers: any
    auth: any
    signIn: any
    signOut: any
  }

  export default NextAuth
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    id?: string;
    onboardingCompleted?: boolean;
    sessionVersion?: number;
  }
}
