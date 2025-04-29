import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // TODO: Add your email subscription logic here
    // For now, we'll just log the email
    console.log('New subscription:', email);

    return NextResponse.json(
      { message: 'Thanks for subscribing! We\'ll be in touch soon.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
} 