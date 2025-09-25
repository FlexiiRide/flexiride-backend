import {
  Controller,
  Put,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @Put(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        bio: { type: 'string' },
        avatar: { type: 'string', format: 'binary' }, // file upload
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatar', { storage: cloudinaryStorage }))
  async updateUser(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file?.path) {
      data['avatarUrl'] = file.path;
    }
    return this.usersService.updateUser(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user profile by ID' })
  async getUser(@Param('id') id: string) {
    return this.usersService.getPublicUserById(id);
  }
}
