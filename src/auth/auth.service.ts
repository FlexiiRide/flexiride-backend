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
  role?: string;
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
    role?: string;
  } {
    return {
      id: user.id || user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
      role: user.role,
    };
  }

  private sign(user: UserDocument): string {
    return this.jwt.sign({
      sub: user.id || user._id.toString(),
      email: user.email,
      name: user.name,
    });
  }

  private signAccessToken(user: UserDocument): string {
    return this.jwt.sign(
      {
        sub: user.id || user._id.toString(),
        email: user.email,
        name: user.name,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_TTL || '900s', // 15 mins default
      },
    );
  }

  private signRefreshToken(user: UserDocument): string {
    return this.jwt.sign(
      {
        sub: user.id || user._id.toString(),
        email: user.email,
        name: user.name,
      },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_TTL || '7d', // 7 days default
      },
    );
  }

  async register(data: { name: string; email: string; password: string; role: string }) {
    const created = (await this.users.createUser(data)) as UserDocument;

    return {
      user: this.toPublicUser(created),
      accessToken: this.signAccessToken(created),
      refreshToken: this.signRefreshToken(created),
    };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password ?? '');
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return {
      user: this.toPublicUser(user),
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwt.verify<{ email?: unknown }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      if (!payload || typeof payload.email !== 'string') {
        throw new UnauthorizedException('Invalid refresh token payload');
      }

      const user = await this.users.findByEmail(payload.email);
      if (!user) throw new UnauthorizedException('User not found');

      const newAccessToken = this.signAccessToken(user);
      const newRefreshToken = this.signRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: this.toPublicUser(user),
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : typeof e === 'string' ? e : undefined;
      throw new UnauthorizedException(message || 'Invalid or expired refresh token');
    }
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

    this.resetTokens.delete(token);
  }
}
