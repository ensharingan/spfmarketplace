
import React, { useState, useEffect } from 'react';
import { User, UserRole, Product, SellerProfile, Enquiry, Order, ListingStatus, OrderStatus } from './types';
import { INITIAL_PRODUCTS } from './constants';
import { MOCK_SELLER } from './mockData';

// --- COMPONENTS ---
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SellerDashboard } from './components/SellerDashboard';
import { BrowseView } from './components/BrowseView';
import { ProductDetail } from './components/ProductDetail';
import { AuthView } from './components/AuthView';
import { CartView } from './components/CartView';
import { CheckoutView } from './components/CheckoutView';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'browse' | 'product' | 'sell' | 'cart' | 'checkout' | 'admin' | 'dashboard'>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  const handleAuth = (u: User, profile?: SellerProfile) => {
    setUser(u);
    if (profile) {
      setSellerProfile(profile);
    } else if (u.role === UserRole.SELLER) {
      // Mock existing profile for login
      setSellerProfile({
        userId: u.id,
        businessName: "Premium Parts Corp",
        contactPerson: "John Doe",
        phone: "27123456789", 
        email: u.email,
        address: { street: "123 Engine Ave", suburb: "Industrial", city: "Gear City", province: "Gauteng", postcode: "1234" },
        whatsappEnabled: true,
        logoUrl: "https://picsum.photos/seed/logo/200/200"
      });
    }
  };

  const handleEnquire = (enquiryData: any, showAlert: boolean = true) => {
    const refId = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newEnquiry = { 
      ...enquiryData, 
      id: refId, 
      createdAt: new Date().toISOString() 
    };
    setEnquiries(prev => [...prev, newEnquiry]);
    
    // We return the refId so components can show a nice confirmation message
    return refId;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setView('cart');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = (orderData: Order) => {
    setOrders([...orders, orderData]);
    setProducts(currentProducts => 
      currentProducts.map(p => {
        const orderItem = orderData.items.find(item => item.productId === p.id);
        if (orderItem) {
          const newQty = Math.max(0, p.quantity - orderItem.quantity);
          return { ...p, quantity: newQty, status: newQty === 0 ? ListingStatus.OUT_OF_STOCK : p.status };
        }
        return p;
      })
    );
    setCart([]);
    setView('home');
    alert(`Order #${orderData.id} placed successfully!`);
  };

  // Helper to find the seller profile for a specific product
  const getSellerForProduct = (sellerId: string): SellerProfile => {
    // 1. If it's the current logged-in user
    if (sellerProfile && sellerProfile.userId === sellerId) {
      return sellerProfile;
    }
    // 2. Fallback to mock data or generated profile
    if (MOCK_SELLER.userId === sellerId) {
      return MOCK_SELLER;
    }
    // 3. Last resort fallback
    return {
      ...MOCK_SELLER,
      userId: sellerId,
      businessName: `Verified Seller ${sellerId.substring(0, 4)}`,
      phone: "27123456789"
    };
  };

  const renderView = () => {
    switch (view) {
      case 'home':
      case 'browse':
        return (
          <BrowseView 
            products={products} 
            onSelectProduct={(id) => { setSelectedProductId(id); setView('product'); }}
            onNavigateToSell={() => setView('sell')}
          />
        );
      case 'product':
        const prod = products.find(p => p.id === selectedProductId);
        if (!prod) return <div className="p-10 text-center">Product not found</div>;
        
        const activeSeller = getSellerForProduct(prod.sellerId);
        
        return (
          <ProductDetail 
            product={prod} 
            seller={activeSeller}
            onAddToCart={addToCart} 
            onEnquire={handleEnquire}
          />
        );
      case 'sell':
        if (!user) return <AuthView onAuth={handleAuth} onBack={() => setView('home')} />;
        if (user.role === UserRole.ADMIN) return <AdminDashboard products={products} users={[]} enquiries={enquiries} orders={orders} />;
        return (
          <SellerDashboard 
            user={user} 
            profile={sellerProfile}
            products={products.filter(p => p.sellerId === user.id)}
            enquiries={enquiries.filter(e => e.sellerId === user.id)}
            orders={orders.filter(o => o.items.some(i => products.find(p => p.id === i.productId)?.sellerId === user.id))}
            onAddProduct={(p) => setProducts([...products, { ...p, id: `p${Date.now()}` }])}
            onUpdateProduct={(updated) => setProducts(products.map(p => p.id === updated.id ? updated : p))}
            onDeleteProduct={(id) => setProducts(products.filter(p => p.id !== id))}
            onUpdateProfile={(updated) => setSellerProfile(updated)}
          />
        );
      case 'cart':
        return <CartView items={cart} onRemove={removeFromCart} onCheckout={() => setView('checkout')} onBack={() => setView('browse')} />;
      case 'checkout':
        return <CheckoutView cart={cart} onComplete={handleCheckout} onBack={() => setView('cart')} />;
      default:
        return <BrowseView products={products} onSelectProduct={(id) => { setSelectedProductId(id); setView('product'); }} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        user={user} 
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
        onNavigate={setView}
        onLogout={() => { setUser(null); setView('home'); }}
      />
      <main className="flex-grow">
        {renderView()}
      </main>
      <Footer onNavigate={setView} />
    </div>
  );
}
