import { IsOptional, IsString, MaxLength, MinLength, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
    maxLength: 50,
    minLength: 2,
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'User bio/description',
    example: 'Passionate driver with 5 years of experience',
    maxLength: 250,
  })
  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  @MaxLength(250, { message: 'Bio cannot exceed 250 characters' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL (automatically set when uploading file)',
    example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatarUrl?: string;
}
