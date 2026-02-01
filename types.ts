
export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN'
}

export enum SellerStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  DISABLED = 'DISABLED'
}

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  SOLD = 'SOLD',
  INACTIVE = 'INACTIVE'
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  COLLECTED = 'COLLECTED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface SellerProfile {
  userId: string;
  businessName: string;
  contactPerson: string; // Manager Name
  contactRole?: string;  // Manager Role
  contactImageUrl?: string; // Manager Profile Picture
  phone: string;
  email: string;
  logoUrl?: string;
  status: SellerStatus;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  address: {
    street: string;
    suburb: string;
    city: string;
    province: string;
    postcode: string;
  };
  whatsappEnabled: boolean;
  operatingHours?: string;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  category: string;
  partGroup: string; // New field
  make: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  condition: 'New' | 'Used' | 'Damaged/Salvage';
  price: number;
  quantity: number;
  sku: string;
  description: string;
  images: string[];
  shippingOptions: ('Collection' | 'Courier')[];
  status: ListingStatus;
  location: string;
  vin?: string;
  mileage?: number;
  transmission?: 'Manual' | 'Automatic';
  isVehicle?: boolean;
}

export interface Enquiry {
  id: string;
  productId: string;
  productName: string;
  sellerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  message: string;
  attachments?: string[];
  createdAt: string;
  status: 'New' | 'Replied';
}

export interface Order {
  id: string;
  buyerId?: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
  deliveryAddress?: string;
  isCollection: boolean;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  keywords: string[];
  createdAt: string;
}
