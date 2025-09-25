import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false }) //avoid default return
  password: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '' })
  bio: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const r = ret as User & { _id: Types.ObjectId; password?: string };
    return {
      id: r._id.toString(),
      name: r.name,
      email: r.email,
      password: r.password,
    };
  },
});
