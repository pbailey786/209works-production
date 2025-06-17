import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { magicLinkToken: token },
  });
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token.' },
      { status: 400 }
    );
  }

  if (!user.magicLinkExpires || user.magicLinkExpires < new Date()) {
    return NextResponse.json({ error: 'Token has expired.' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      magicLinkToken: null,
      magicLinkExpires: null,
    },
  });

  return NextResponse.json({ message: 'Email verified successfully.' });
}
