export interface Vehicle {
  id?: string;
  _id?: string;
  ownerId: string;
  title: string;
  type: 'car' | 'bike';
  pricePerHour: number;
  pricePerDay: number;
  images: string[];
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  availableRanges: {
    from: string;
    to: string;
  }[];
  description: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVehicle {
  id: string;
  ownerId: string;
  title: string;
  type: 'car' | 'bike';
  pricePerHour: number;
  pricePerDay: number;
  images: string[];
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  availableRanges: {
    from: string;
    to: string;
  }[];
  description: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateVehicleDto {
  title: string;
  type: 'car' | 'bike';
  pricePerHour: number;
  pricePerDay: number;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  availableRanges: {
    from: string;
    to: string;
  }[];
  description: string;
}

export interface IUpdateVehicleDto {
  title?: string;
  type?: 'car' | 'bike';
  pricePerHour?: number;
  pricePerDay?: number;
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
  availableRanges?: {
    from: string;
    to: string;
  }[];
  description?: string;
  status?: 'active' | 'inactive';
}
