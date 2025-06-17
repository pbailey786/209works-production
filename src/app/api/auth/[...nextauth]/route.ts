import NextAuth from 'next-auth';
import authOptions from '../authOptions';

console.log('🚀 NextAuth route loaded');

// @ts-ignore - NextAuth v4 App Router compatibility
const handler = NextAuth(authOptions);

// Wrap handlers with logging and error catching
const loggedGET = async (req: Request, context: any) => {
  console.log('📥 NextAuth GET request:', req.url);
  console.log('📥 GET pathname:', new URL(req.url).pathname);
  try {
    const result = await handler(req, context);
    return result;
  } catch (error) {
    console.error('💥 NextAuth GET Error:', error);
    throw error;
  }
};

const loggedPOST = async (req: Request, context: any) => {
  console.log('📤 NextAuth POST request:', req.url);
  console.log('📤 POST pathname:', new URL(req.url).pathname);

  try {
    const clone = req.clone();
    const body = await clone.text();
    console.log('📤 POST body:', body);
  } catch (e) {
    console.log('📤 Could not read POST body');
  }

  try {
    const result = await handler(req, context);
    console.log('✅ NextAuth POST completed successfully');
    return result;
  } catch (error) {
    console.error('💥 NextAuth POST Error:', error);
    console.error(
      '💥 Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    throw error;
  }
};

export { loggedGET as GET, loggedPOST as POST };
