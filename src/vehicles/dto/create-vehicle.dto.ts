import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

class AvailableRangeDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;
}

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsEnum(['car', 'bike'])
  @IsNotEmpty()
  type: 'car' | 'bike';

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  pricePerHour: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  pricePerDay: number;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailableRangeDto)
  availableRanges: AvailableRangeDto[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
}
