import {
  Controller,
  Put,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Get,
  ParseFilePipeBuilder,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiBody, 
  ApiConsumes, 
  ApiOperation, 
  ApiTags, 
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudinaryStorage } from '../cloudinary/cloudinary.storage';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: 'Load user details by ID',
    description: 'Retrieve detailed information about a user including name, email, bio, avatar, and role. Email is read-only.'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        bio: { type: 'string', example: 'Passionate driver with 5 years of experience' },
        avatarUrl: { type: 'string', example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatar.jpg' },
        role: { type: 'string', example: 'client' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async getUser(@Param('id') id: string) {
    return this.usersService.getPublicUserById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ 
    summary: 'Edit user details',
    description: 'Update user profile information. Can edit name, bio, and avatar image. Email cannot be edited and is read-only.'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User profile update data with optional avatar image',
    schema: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          description: 'User full name (2-50 characters)',
          example: 'John Doe',
          minLength: 2,
          maxLength: 50
        },
        bio: { 
          type: 'string', 
          description: 'User bio/description (max 250 characters)',
          example: 'Passionate driver with 5 years of experience',
          maxLength: 250
        },
        avatar: { 
          type: 'string', 
          format: 'binary',
          description: 'Profile image file (JPEG, PNG, WebP, max 5MB)'
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        bio: { type: 'string', example: 'Updated bio' },
        avatarUrl: { type: 'string', example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/new-avatar.jpg' },
        role: { type: 'string', example: 'client' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or file type'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @UseInterceptors(FileInterceptor('avatar', { storage: cloudinaryStorage }))
  async updateUser(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Validate that user exists before proceeding
    await this.usersService.getPublicUserById(id);
    
    // Manual file validation if file is provided
    if (file) {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      }
      
      if (file.size > maxSize) {
        throw new BadRequestException('File size too large. Maximum size is 5MB.');
      }
      
      // If file is uploaded, add the URL to the update data
      data.avatarUrl = file.path;
    }
    
    // Ensure email cannot be updated (security measure)
    const updateData = { ...data };
    delete (updateData as any).email;
    
    return this.usersService.updateUser(id, updateData);
  }
}
