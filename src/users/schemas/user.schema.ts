import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ 
    required: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  })
  name: string;

  @Prop({ 
    required: true, 
    unique: true, 
    index: true, 
    lowercase: true, 
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  })
  email: string;

  @Prop({ required: true, select: false }) //avoid default return
  password: string;

  @Prop({ 
    default: '',
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Avatar URL must be a valid URL'
    }
  })
  avatarUrl: string;

  @Prop({ 
    default: '',
    maxlength: [250, 'Bio cannot exceed 250 characters']
  })
  bio: string;

  @Prop({ 
    default: 'client',
    enum: ['client', 'driver', 'admin']
  })
  role: string;
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
      avatarUrl: r.avatarUrl,
      bio: r.bio,
      role: r.role,
    };
  },
});
