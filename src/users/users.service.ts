import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
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

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string;
    role?: string;
  }) {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(data.password, 12);
    const created = await this.userModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hash,
      avatarUrl: data.avatarUrl ?? '',
      bio: '',
      role: data.role ?? 'client',
    });
    return created.toJSON(); // applies transform
  }

  async getPublicUserById(id: string) {
    // Validate MongoDB ObjectId format
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID format');
    }
    
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
    };
  }

  async updateUser(
    id: string,
    data: Partial<{ name: string; bio: string; avatarUrl: string; password: string }>,
  ): Promise<IUser> {
    // Validate MongoDB ObjectId format
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Ensure email cannot be updated (security measure)
    const sanitizedData = { ...data };
    delete (sanitizedData as any).email;
    delete (sanitizedData as any).role;

    // Validate that at least one field is being updated
    if (Object.keys(sanitizedData).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    const updated = await this.userModel.findByIdAndUpdate(
      id, 
      sanitizedData, 
      { new: true, runValidators: true }
    ).exec();
    
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
      role: user.role,
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
