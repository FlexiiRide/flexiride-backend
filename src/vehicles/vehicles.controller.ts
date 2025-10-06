import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { cloudinaryStorage } from '../cloudinary/cloudinary.storage';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Toyota Prius 2019' },
        type: { type: 'string', enum: ['car', 'bike'], example: 'car' },
        pricePerHour: { type: 'number', example: 6.5 },
        pricePerDay: { type: 'number', example: 45 },
        location: {
          type: 'string',
          example: '{"address":"Colombo 7, Sri Lanka","lat":6.9149,"lng":79.8615}',
        },
        availableRanges: {
          type: 'string',
          example: '[{"from":"2025-09-22T09:00:00.000Z","to":"2025-09-26T17:00:00.000Z"}]',
        },
        description: {
          type: 'string',
          example: 'Clean hybrid, non-smoking, AC. Perfect for city driving.',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10, { storage: cloudinaryStorage }))
  async createVehicle(
    @Body() data: CreateVehicleDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    // Parse JSON strings from multipart form data
    if (typeof data.location === 'string') {
      data.location = JSON.parse(data.location);
    }
    if (typeof data.availableRanges === 'string') {
      data.availableRanges = JSON.parse(data.availableRanges);
    }

    const imagePaths = files?.map((f) => f.path) || [];
    const ownerId = req.user.userId;

    return this.vehiclesService.createVehicle(ownerId, data, imagePaths);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles with optional filters' })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['car', 'bike'] })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  async getAllVehicles(
    @Query('ownerId') ownerId?: string,
    @Query('type') type?: 'car' | 'bike',
    @Query('status') status?: 'active' | 'inactive',
  ) {
    return this.vehiclesService.getAllVehicles({ ownerId, type, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  async getVehicleById(@Param('id') id: string) {
    return this.vehiclesService.getVehicleById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update vehicle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['car', 'bike'] },
        pricePerHour: { type: 'number' },
        pricePerDay: { type: 'number' },
        location: { type: 'string' },
        availableRanges: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10, { storage: cloudinaryStorage }))
  async updateVehicle(
    @Param('id') id: string,
    @Body() data: UpdateVehicleDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    // Parse JSON strings from multipart form data if they exist
    if (data.location && typeof data.location === 'string') {
      data.location = JSON.parse(data.location);
    }
    if (data.availableRanges && typeof data.availableRanges === 'string') {
      data.availableRanges = JSON.parse(data.availableRanges);
    }

    const imagePaths = files?.map((f) => f.path) || [];
    const ownerId = req.user.userId;

    return this.vehiclesService.updateVehicle(id, ownerId, data, imagePaths);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete vehicle' })
  async deleteVehicle(@Param('id') id: string, @Req() req: any) {
    const ownerId = req.user.userId;
    await this.vehiclesService.deleteVehicle(id, ownerId);
    return { message: 'Vehicle deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/images')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove an image from vehicle' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', example: 'https://cloudinary.com/...' },
      },
    },
  })
  async removeImage(@Param('id') id: string, @Body('imageUrl') imageUrl: string, @Req() req: any) {
    const ownerId = req.user.userId;
    return this.vehiclesService.removeImageFromVehicle(id, ownerId, imageUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner/my-vehicles')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all vehicles owned by current user' })
  async getMyVehicles(@Req() req: any) {
    const ownerId = req.user.userId;
    return this.vehiclesService.getVehiclesByOwner(ownerId);
  }
}
