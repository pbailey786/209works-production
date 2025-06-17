declare module 'next-auth' {
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
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    id?: string;
    onboardingCompleted?: boolean;
    sessionVersion?: number;
  }
}
