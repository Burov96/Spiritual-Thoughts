import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '../../../../lib/prisma';
import {randomColor} from 'randomcolor'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);
    const userColor = randomColor();
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        color: userColor,
      },
    });

    return NextResponse.json({ message: 'User registered successfully', user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
