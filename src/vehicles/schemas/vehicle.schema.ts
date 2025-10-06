import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ timestamps: true })
export class Vehicle {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: ['car', 'bike'] })
  type: string;

  @Prop({ required: true, min: 0 })
  pricePerHour: number;

  @Prop({ required: true, min: 0 })
  pricePerDay: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    type: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    required: true,
  })
  location: {
    address: string;
    lat: number;
    lng: number;
  };

  @Prop({
    type: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
      },
    ],
    default: [],
  })
  availableRanges: {
    from: string;
    to: string;
  }[];

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

// Create indexes for common queries
VehicleSchema.index({ ownerId: 1, status: 1 });
VehicleSchema.index({ type: 1, status: 1 });
VehicleSchema.index({ 'location.lat': 1, 'location.lng': 1 });

VehicleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    return {
      id: ret._id.toString(),
      ownerId: ret.ownerId.toString(),
      title: ret.title,
      type: ret.type,
      pricePerHour: ret.pricePerHour,
      pricePerDay: ret.pricePerDay,
      images: ret.images,
      location: ret.location,
      availableRanges: ret.availableRanges,
      description: ret.description,
      status: ret.status,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
    };
  },
});
