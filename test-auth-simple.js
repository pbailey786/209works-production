// Simple test to check NextAuth v5 configuration
const { NextAuth } = require('next-auth');

try {
  const authConfig = {
    providers: [],
    callbacks: {
      async jwt({ token, user }) {
        return token;
      },
      async session({ session, token }) {
        return session;
      }
    }
  };

  console.log('Testing NextAuth v5 configuration...');
  const result = NextAuth(authConfig);
  console.log('NextAuth v5 config test:', {
    hasHandlers: !!result.handlers,
    hasAuth: !!result.auth,
    hasSignIn: !!result.signIn,
    hasSignOut: !!result.signOut
  });
} catch (error) {
  console.error('NextAuth v5 config error:', error.message);
}