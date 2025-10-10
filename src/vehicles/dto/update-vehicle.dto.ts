import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsArray,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Define proper types
type VehicleType = 'car' | 'bike';
type VehicleStatus = 'active' | 'inactive';

interface ParsedLocation {
  address: string;
  lat?: number;
  lng?: number;
}

interface ParsedAvailableRange {
  from: string;
  to: string;
}

class LocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @Transform(({ value }): number => {
    if (typeof value === 'string') return parseFloat(value);
    return value as number;
  })
  @IsNumber()
  lat: number;

  @ApiProperty()
  @Transform(({ value }): number => {
    if (typeof value === 'string') return parseFloat(value);
    return value as number;
  })
  @IsNumber()
  lng: number;
}

class AvailableRangeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  to: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ enum: ['car', 'bike'] })
  @IsEnum(['car', 'bike'])
  @IsOptional()
  type?: VehicleType;

  @ApiPropertyOptional()
  @Transform(({ value }): number | undefined | null => {
    if (value === undefined || value === null) return value;
    if (typeof value === 'string') return parseFloat(value);
    return value as number;
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerHour?: number;

  @ApiPropertyOptional()
  @Transform(({ value }): number | undefined | null => {
    if (value === undefined || value === null) return value;
    if (typeof value === 'string') return parseFloat(value);
    return value as number;
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerDay?: number;

  @ApiPropertyOptional()
  @Transform(({ value }): ParsedLocation | string | undefined | null => {
    if (value === undefined || value === null) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as ParsedLocation;
        if (parsed.lat && typeof parsed.lat === 'string') {
          parsed.lat = parseFloat(parsed.lat);
        }
        if (parsed.lng && typeof parsed.lng === 'string') {
          parsed.lng = parseFloat(parsed.lng);
        }
        return parsed;
      } catch {
        return value;
      }
    }
    return value as ParsedLocation;
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional()
  @Transform(({ value }): ParsedAvailableRange[] | string | undefined | null => {
    if (value === undefined || value === null) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as ParsedAvailableRange[];
      } catch {
        return value;
      }
    }
    return value as ParsedAvailableRange[];
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailableRangeDto)
  @IsOptional()
  availableRanges?: AvailableRangeDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: VehicleStatus;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' } })
  @IsOptional()
  images?: Express.Multer.File[];
}
