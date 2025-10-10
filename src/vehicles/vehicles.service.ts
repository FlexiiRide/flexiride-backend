import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';
import { IVehicle } from './vehicle.types';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

interface VehicleQuery {
  ownerId?: Types.ObjectId;
  type?: 'car' | 'bike';
  status?: 'active' | 'inactive';
}

interface ParsedLocation {
  address: string;
  lat?: number;
  lng?: number;
}

@Injectable()
export class VehiclesService {
  constructor(@InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>) {}

  async createVehicle(
    ownerId: string,
    data: CreateVehicleDto,
    images: string[],
  ): Promise<IVehicle> {
    // Safety check: ensure location is an object with proper types
    let location: ParsedLocation = data.location;
    if (typeof data.location === 'string') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.location);
      } catch {
        throw new Error('Invalid location format');
      }
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid location format');
      }
      const parsedObj = parsed as Record<string, unknown>;
      if (typeof parsedObj.address !== 'string') {
        throw new Error('Invalid location format: missing address');
      }
      const latVal = parsedObj.lat;
      const lngVal = parsedObj.lng;
      location = {
        address: parsedObj.address,
        lat: latVal !== undefined && latVal !== null ? Number(latVal as any) : undefined,
        lng: lngVal !== undefined && lngVal !== null ? Number(lngVal as any) : undefined,
      };
    }

    // Ensure lat/lng are numbers
    const finalLocation = {
      address: location.address,
      lat: Number(location.lat),
      lng: Number(location.lng),
    };

    const created = await this.vehicleModel.create({
      ownerId: new Types.ObjectId(ownerId),
      title: data.title,
      type: data.type,
      pricePerHour: data.pricePerHour,
      pricePerDay: data.pricePerDay,
      location: finalLocation,
      availableRanges: data.availableRanges,
      description: data.description,
      images: images,
      status: 'active',
    });
    return this.toIVehicle(created);
  }

  async getAllVehicles(filters?: {
    ownerId?: string;
    type?: 'car' | 'bike';
    status?: 'active' | 'inactive';
  }): Promise<IVehicle[]> {
    const query: VehicleQuery = {};

    if (filters?.ownerId) {
      query.ownerId = new Types.ObjectId(filters.ownerId);
    }
    if (filters?.type) {
      query.type = filters.type;
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    const vehicles = await this.vehicleModel.find(query).sort({ createdAt: -1 }).exec();
    return vehicles.map((v) => this.toIVehicle(v));
  }

  async getVehicleById(id: string): Promise<IVehicle> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Vehicle not found');
    }

    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return this.toIVehicle(vehicle);
  }

  async updateVehicle(
    id: string,
    ownerId: string,
    data: UpdateVehicleDto,
    newImages?: string[],
  ): Promise<IVehicle> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Vehicle not found');
    }

    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check ownership
    if (vehicle.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You do not own this vehicle');
    }

    // Build type-safe updateData by excluding images from DTO
    const { images: _, ...rest } = data; // eslint-disable-line @typescript-eslint/no-unused-vars
    const updateData: Partial<Vehicle> = { ...rest };

    // Merge newImages safely
    if (newImages && newImages.length > 0) {
      updateData.images = [...vehicle.images, ...newImages];
    }

    const updated = await this.vehicleModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (!updated) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.toIVehicle(updated);
  }

  async deleteVehicle(id: string, ownerId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Vehicle not found');
    }

    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check ownership
    if (vehicle.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You do not own this vehicle');
    }

    await this.vehicleModel.findByIdAndDelete(id).exec();
  }

  async getVehiclesByOwner(ownerId: string): Promise<IVehicle[]> {
    const vehicles = await this.vehicleModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .exec();
    return vehicles.map((v) => this.toIVehicle(v));
  }

  async removeImageFromVehicle(
    vehicleId: string,
    ownerId: string,
    imageUrl: string,
  ): Promise<IVehicle> {
    if (!Types.ObjectId.isValid(vehicleId)) {
      throw new NotFoundException('Vehicle not found');
    }

    const vehicle = await this.vehicleModel.findById(vehicleId).exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check ownership
    if (vehicle.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You do not own this vehicle');
    }

    const updatedImages = vehicle.images.filter((img) => img !== imageUrl);

    const updated = await this.vehicleModel
      .findByIdAndUpdate(vehicleId, { images: updatedImages }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.toIVehicle(updated);
  }

  private toIVehicle(vehicle: VehicleDocument): IVehicle {
    return {
      id: vehicle._id.toString(),
      ownerId: vehicle.ownerId.toString(),
      title: vehicle.title,
      type: vehicle.type as 'car' | 'bike',
      pricePerHour: vehicle.pricePerHour,
      pricePerDay: vehicle.pricePerDay,
      images: vehicle.images,
      location: vehicle.location,
      availableRanges: vehicle.availableRanges,
      description: vehicle.description,
      status: vehicle.status as 'active' | 'inactive',
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}
