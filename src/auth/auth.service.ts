/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { ResetToken } from './types';
import { sendEmail } from 'src/helpers/mail.helper';
import { randomBytes } from 'crypto';

interface UserDocument {
  _id: Types.ObjectId;
  id?: string;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

@Injectable()
export class AuthService {
  private resetTokens: Map<string, ResetToken> = new Map();

  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  private toPublicUser(user: UserDocument): {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    bio: string;
  } {
    return {
      id: user.id || user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
    };
  }

  private sign(user: UserDocument): string {
    return this.jwt.sign({
      sub: user.id || user._id.toString(),
      email: user.email,
      name: user.name,
    });
  }

  async register(data: { name: string; email: string; password: string }) {
    const created = (await this.users.createUser(data)) as UserDocument;
    return {
      user: this.toPublicUser(created),
      token: this.sign(created),
    };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password ?? '');
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return {
      user: this.toPublicUser(user),
      token: this.sign(user),
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return; // don't reveal if user exists

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min expiry
    this.resetTokens.set(token, { token, userId: user.id, expiresAt });

    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    const html = `
      <p>Hi ${user.name},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 30 minutes.</p>
    `;

    try {
      await sendEmail(user.email, 'Password Reset Request', html);
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const data = this.resetTokens.get(token);
    if (!data) throw new BadRequestException('Invalid or expired token');

    if (data.expiresAt < new Date()) {
      this.resetTokens.delete(token);
      throw new BadRequestException('Token expired');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.users.updateUser(data.userId, { password: hashed });

    this.resetTokens.delete(token); // invalidate token
  }
}
