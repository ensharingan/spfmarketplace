
import { ListingStatus, Product, UserRole, SellerProfile, SellerStatus } from './types';

export const CATEGORIES = [
  'Engine & Components',
  'Body Parts',
  'Headlights & Lighting',
  'Stripping',
  'Stripping for Parts',
  'Damaged Vehicles (Salvage)',
  'Electrical Systems',
  'Suspension & Steering',
  'Transmission',
  'Interior',
  'Wheels & Tyres'
];

export const SA_VEHICLE_DATA: Record<string, string[]> = {
  'Toyota': ['Hilux', 'Corolla', 'Fortuner', 'Quantum', 'Avanza', 'Etios', 'Yaris', 'Starlet', 'Rumion', 'Urban Cruiser', 'Land Cruiser', 'Hiace'],
  'Volkswagen': ['Polo', 'Polo Vivo', 'Golf', 'Tiguan', 'T-Cross', 'Amarok', 'Transporter', 'Caddy', 'T-Roc', 'Crafter'],
  'Ford': ['Ranger', 'Everest', 'Figo', 'EcoSport', 'Fiesta', 'Transit', 'Tourneo', 'Mustang', 'F-150'],
  'Nissan': ['NP200', 'NP300 Hardbody', 'Navara', 'Almera', 'Qashqai', 'X-Trail', 'Magnite', 'Patrol', 'NV350'],
  'Hyundai': ['i10', 'i20', 'i30', 'Creta', 'Tucson', 'Santa Fe', 'H100 Bakkie', 'H1', 'Venue', 'Kona'],
  'Kia': ['Picanto', 'Rio', 'Seltos', 'Sportage', 'Sorento', 'K2500', 'K2700', 'Sonet', 'Pegas'],
  'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', 'X1', 'X3', 'X5', 'X6', 'M3', 'M4', 'M5'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'Sprinter', 'Vito', 'Actros'],
  'Isuzu': ['D-MAX', 'KB Series', 'MU-X', 'N-Series Truck', 'F-Series Truck', 'FX-Series'],
  'Suzuki': ['Swift', 'Jimny', 'Ertiga', 'Vitara Brezza', 'S-Presso', 'Celerio', 'Baleno', 'Dzire'],
  'Mazda': ['Mazda2', 'Mazda3', 'CX-3', 'CX-5', 'CX-30', 'BT-50'],
  'Renault': ['Kwid', 'Triber', 'Kiger', 'Captur', 'Duster', 'Megane', 'Clio'],
  'Mitsubishi': ['Pajero', 'Triton', 'ASX', 'Outlander', 'Pajero Sport'],
  'Mahindra': ['Scorpio', 'Thar', 'XUV300', 'Bolero', 'Pik-Up'],
  'Haval': ['Jolion', 'H6', 'H6 GT'],
  'GWM': ['Steed', 'P-Series'],
  'Chery': ['Tiggo 4 Pro', 'Tiggo 7 Pro', 'Tiggo 8 Pro'],
  'Audi': ['A1', 'A3', 'A4', 'A5', 'Q2', 'Q3', 'Q5', 'Q7'],
  'Honda': ['Amaze', 'Ballade', 'Civic', 'CR-V', 'HR-V', 'Fit'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover Sport', 'Range Rover Evoque']
};

export const MAKES = Object.keys(SA_VEHICLE_DATA).sort();

export const COMMON_PART_NAMES = [
  "Alternator", 
  "Brake Pads", 
  "Brake Discs", 
  "Radiator", 
  "A/C Condenser", 
  "Headlight (Left)", 
  "Headlight (Right)", 
  "Tail Light", 
  "Front Bumper", 
  "Rear Bumper",
  "Bonnet", 
  "Fender", 
  "Grille", 
  "Engine Block", 
  "Complete Engine",
  "Gearbox / Transmission", 
  "Turbocharger",
  "Shock Absorber", 
  "Control Arm", 
  "Wheel Hub", 
  "Air Filter", 
  "Oil Filter",
  "Fuel Pump", 
  "Starter Motor", 
  "Car Battery", 
  "Wiper Motor", 
  "Side Mirror",
  "Door Handle",
  "Window Regulator"
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    sellerId: 's1',
    name: '2018 BMW M3 Alternator',
    category: 'Electrical Systems',
    make: 'BMW',
    model: 'M3',
    yearStart: 2014,
    yearEnd: 2020,
    condition: 'Used',
    price: 4500.00,
    quantity: 1,
    sku: 'BMW-ALT-101',
    description: 'Genuine BMW M3 Alternator in excellent working condition. Pulled from a low mileage donor.',
    images: [
      'https://images.unsplash.com/photo-1620023846007-885721759495?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=800'
    ],
    shippingOptions: ['Collection', 'Courier'],
    status: ListingStatus.ACTIVE,
    location: 'Johannesburg, GP'
  },
  {
    id: 'p2',
    sellerId: 's1',
    name: 'Mercedes-Benz C-Class (W205) LED Headlight Left',
    category: 'Headlights & Lighting',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    yearStart: 2015,
    yearEnd: 2021,
    condition: 'Used',
    price: 8200.00,
    quantity: 2,
    sku: 'MB-W205-HL-L',
    description: 'Original Mercedes LED High Performance headlight. No broken tabs, clean lens.',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c956?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800'
    ],
    shippingOptions: ['Collection', 'Courier'],
    status: ListingStatus.ACTIVE,
    location: 'Pretoria, GP'
  },
  {
    id: 'p3',
    sellerId: 's2',
    name: 'Audi A4 (B8) 2.0 TFSI Engine (Stripping)',
    category: 'Stripping for Parts',
    make: 'Audi',
    model: 'A4',
    yearStart: 2008,
    yearEnd: 2016,
    condition: 'Used',
    price: 22000.00,
    quantity: 1,
    sku: 'AUD-B8-ENG',
    description: 'Complete engine available or stripping for parts. Low oil consumption reported before removal.',
    images: [
      'https://images.unsplash.com/photo-1493238792040-d710475a6d38?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1502161828065-d4aed90ca397?auto=format&fit=crop&q=80&w=800'
    ],
    shippingOptions: ['Collection'],
    status: ListingStatus.ACTIVE,
    location: 'Durban, KZN'
  },
  {
    id: 'p5',
    sellerId: 's4',
    name: 'Salvage 2020 Toyota Hilux GD-6 (Non-Runner)',
    category: 'Damaged Vehicles (Salvage)',
    make: 'Toyota',
    model: 'Hilux',
    yearStart: 2020,
    yearEnd: 2020,
    condition: 'Damaged/Salvage',
    price: 185000.00,
    quantity: 1,
    sku: 'SALV-TOY-001',
    description: 'Front-end accident damage. Engine starts but vehicle is non-runner due to suspension damage. Papers in order.',
    images: [
      'https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1598501479153-0667823f054a?auto=format&fit=crop&q=80&w=800'
    ],
    shippingOptions: ['Collection'],
    status: ListingStatus.ACTIVE,
    location: 'Cape Town, WC',
    isVehicle: true,
    mileage: 45000,
    transmission: 'Manual'
  }
];

// Added missing status property to MOCK_SELLER
export const MOCK_SELLER: SellerProfile = {
  userId: 's1',
  businessName: "Premium Parts Corp",
  contactPerson: "John Doe",
  contactRole: "Sales Director",
  contactImageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
  phone: "27123456789",
  email: "sales@premiumparts.co.za",
  status: SellerStatus.APPROVED,
  address: { 
    street: "123 Engine Ave", 
    suburb: "Industrial", 
    city: "Gear City", 
    province: "Gauteng", 
    postcode: "1234" 
  },
  whatsappEnabled: true,
  logoUrl: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&q=80&w=200",
  socialLinks: {
    facebook: "https://facebook.com/premiumpartsza",
    instagram: "https://instagram.com/premiumpartsza",
    website: "https://premiumparts.co.za"
  }
};
