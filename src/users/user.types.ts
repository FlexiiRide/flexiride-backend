export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
}

export interface IUpdateUserDto {
  name?: string;
  avatarUrl?: string;
  bio?: string;
}
