export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

export interface IUserProfile {
  id: string;
  bio?: string;
  title?: string;
  skills: string[];
  languages: string[];
  hourlyRate?: number;
  currency: string;
  rating?: number;
}

export interface IBooking {
  id: string;
  studentId: string;
  providerId: string;
  providerType: string;
  mode: string;
  start: Date;
  end: Date;
  status: string;
  price: number;
  currency: string;
}

export interface IAvailability {
  id: string;
  providerId: string;
  start: Date;
  end: Date;
  status: string;
  price?: number;
  currency: string;
  mode: string;
}

