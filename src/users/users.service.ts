import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { IUser } from './user.types';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async createUser(data: { name: string; email: string; password: string; avatarUrl?: string }) {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(data.password, 12);
    const created = await this.userModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hash,
      avatarUrl: data.avatarUrl ?? '',
      bio: '',
    });
    return created.toJSON(); // applies transform
  }

  async getPublicUserById(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    };
  }

  async updateUser(
    id: string,
    data: Partial<{ name: string; bio: string; avatarUrl: string; password: string }>,
  ): Promise<IUser> {
    const updated = await this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!updated) throw new NotFoundException('User not found');
    return this.toIUser(updated);
  }

  private toIUser(user: UserDocument): IUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    };
  }

  async findByIds(ids: string[]): Promise<{ id: string; name: string }[]> {
    if (!ids || ids.length === 0) return [];

    // only select name (and _id implicitly)
    const docs = await this.userModel
      .find({ _id: { $in: ids } })
      .select('name')
      .exec();

    // docs is typed as UserDocument[], map to plain objects with explicit types
    return docs.map((d) => ({
      id: d._id.toString(),
      name: d.name,
    }));
  }
}
