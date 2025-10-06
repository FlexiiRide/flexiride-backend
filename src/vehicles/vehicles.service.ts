import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';
import { IVehicle } from './vehicle.types';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(@InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>) {}

  async createVehicle(
    ownerId: string,
    data: CreateVehicleDto,
    images: string[],
  ): Promise<IVehicle> {
    const created = await this.vehicleModel.create({
      ownerId: new Types.ObjectId(ownerId),
      title: data.title,
      type: data.type,
      pricePerHour: data.pricePerHour,
      pricePerDay: data.pricePerDay,
      location: data.location,
      availableRanges: data.availableRanges,
      description: data.description,
      images: images,
      status: 'active',
    });
    return created.toJSON();
  }

  async getAllVehicles(filters?: {
    ownerId?: string;
    type?: 'car' | 'bike';
    status?: 'active' | 'inactive';
  }): Promise<IVehicle[]> {
    const query: any = {};

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
    return vehicles.map((v) => v.toJSON());
  }

  async getVehicleById(id: string): Promise<IVehicle> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Vehicle not found');
    }

    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle.toJSON();
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

    const updateData: any = { ...data };

    // If new images are provided, append to existing
    if (newImages && newImages.length > 0) {
      updateData.images = [...vehicle.images, ...newImages];
    }

    const updated = await this.vehicleModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (!updated) {
      throw new NotFoundException('Vehicle not found');
    }

    return updated.toJSON();
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
    return vehicles.map((v) => v.toJSON());
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

    return updated.toJSON();
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
