// TODO: Replace with Clerk authentication
import { NextResponse } from 'next/server';

console.log('🚀 Mock NextAuth route loaded - TODO: Replace with Clerk');

// Mock NextAuth handlers for build compatibility
const mockGET = async (req: Request, context: any) => {
  console.log('📥 Mock NextAuth GET request:', req.url);
  return NextResponse.json({
    error: 'NextAuth disabled - TODO: Replace with Clerk',
    message: 'Authentication system is being migrated to Clerk'
  }, { status: 501 });
};

const mockPOST = async (req: Request, context: any) => {
  console.log('📤 Mock NextAuth POST request:', req.url);
  return NextResponse.json({
    error: 'NextAuth disabled - TODO: Replace with Clerk',
    message: 'Authentication system is being migrated to Clerk'
  }, { status: 501 });
};

export { mockGET as GET, mockPOST as POST };
