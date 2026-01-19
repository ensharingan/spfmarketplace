
import { ListingStatus, Product } from './types';

export const CATEGORIES = [
  'Engine & Components',
  'Body Parts',
  'Headlights & Lighting',
  'Stripping for Parts',
  'Damaged Vehicles (Salvage)',
  'Electrical Systems',
  'Suspension & Steering',
  'Transmission',
  'Interior',
  'Wheels & Tyres'
];

export const MAKES = ['Toyota', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Ford', 'Honda', 'Nissan'];

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
    category: 'Engine & Components',
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
    id: 'p4',
    sellerId: 's2',
    name: 'Volkswagen Polo Vivo Tailgate - White',
    category: 'Body Parts',
    make: 'Volkswagen',
    model: 'Polo Vivo',
    yearStart: 2010,
    yearEnd: 2018,
    condition: 'Used',
    price: 3500.00,
    quantity: 1,
    sku: 'VW-VIVO-TG-W',
    description: 'Straight tailgate, original paint. Includes glass and wiper motor.',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'
    ],
    shippingOptions: ['Collection', 'Courier'],
    status: ListingStatus.ACTIVE,
    location: 'Port Elizabeth, EC'
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
  },
  {
    id: 'p6',
    sellerId: 's3',
    name: 'Ford Ranger T6 Wildtrak Front Bumper',
    category: 'Body Parts',
    make: 'Ford',
    model: 'Ranger',
    yearStart: 2012,
    yearEnd: 2015,
    condition: 'Used',
    price: 2850.00,
    quantity: 3,
    sku: 'FORD-T6-FBMP',
    description: 'Used front bumper. Grey color. Minor scuffs but structurally sound.',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1506469717960-433ce8b6698e?auto=format&fit=crop&q=80&w=800'
    ],
    shippingOptions: ['Collection', 'Courier'],
    status: ListingStatus.ACTIVE,
    location: 'Bloemfontein, FS'
  },
  {
    id: 'p7',
    sellerId: 's3',
    name: 'Honda Civic VTEC Gearbox (6-Speed)',
    category: 'Transmission',
    make: 'Honda',
    model: 'Civic',
    yearStart: 2006,
    yearEnd: 2011,
    condition: 'Used',
    price: 7500.00,
    quantity: 1,
    sku: 'HON-CIV-GRB',
    description: 'Tested manual gearbox. Smooth shifts in all gears. Includes master cylinder.',
    images: [
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1550159930-401441416d62?auto=format&fit=crop&q=80&w=800'
    ],
    shippingOptions: ['Collection', 'Courier'],
    status: ListingStatus.ACTIVE,
    location: 'Nelspruit, MP'
  },
  {
    id: 'p8',
    sellerId: 's4',
    name: 'Nissan NP200 1.6 Shock Absorbers Set',
    category: 'Suspension & Steering',
    make: 'Nissan',
    model: 'NP200',
    yearStart: 2008,
    yearEnd: 2023,
    condition: 'New',
    price: 1800.00,
    quantity: 10,
    sku: 'NIS-NP2-SHK',
    description: 'Brand new Gabriel Gas-Rider shocks. Front and rear set for high-load capacity.',
    images: [
      'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1549660299-29859185f049?auto=format&fit=crop&q=80&w=800'
    ],
    shippingOptions: ['Courier'],
    status: ListingStatus.ACTIVE,
    location: 'Polokwane, LP'
  }
];
