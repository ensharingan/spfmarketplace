
import React, { useState, useEffect } from 'react';
import { User, UserRole, Product, SellerProfile, Enquiry, Order, ListingStatus, SellerStatus, BlogPost } from './types';
import { INITIAL_PRODUCTS } from './constants';
import { INITIAL_SELLERS, MOCK_SELLER } from './mockData';

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
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  
  // Initialize with all initial approved sellers
  const [sellers, setSellers] = useState<SellerProfile[]>(INITIAL_SELLERS);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  const handleAuth = (u: User, profile?: SellerProfile) => {
    setUser(u);
    if (u.role === UserRole.ADMIN) {
      setView('admin');
      return;
    }
    
    if (profile) {
      // Auto-approve for demo purposes so listings show immediately
      const newProfile = { ...profile, status: SellerStatus.APPROVED };
      setSellers(prev => {
        const exists = prev.find(s => s.userId === newProfile.userId);
        if (exists) return prev;
        return [...prev, newProfile];
      });
      setSellerProfile(newProfile);
      setView('sell');
    } else if (u.role === UserRole.SELLER) {
      // Check if this user already has a profile in our state
      let existing = sellers.find(s => s.userId === u.id);
      
      if (!existing) {
        // If no profile exists for this ID, create a default one to ensure products are visible
        existing = {
          userId: u.id,
          businessName: u.email.split('@')[0].toUpperCase() + " SPARES",
          contactPerson: "Store Manager",
          phone: "27000000000",
          email: u.email,
          status: SellerStatus.APPROVED,
          address: { street: '123 Main St', suburb: 'Industrial', city: 'Midrand', province: 'Gauteng', postcode: '1685' },
          whatsappEnabled: true
        };
        setSellers(prev => [...prev, existing!]);
      }
      
      setSellerProfile(existing);
      setView('sell');
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

  const updateSellerStatus = (sellerId: string, status: SellerStatus) => {
    setSellers(prev => prev.map(s => s.userId === sellerId ? { ...s, status } : s));
  };

  // Admin Product Actions
  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const addBlogPost = (post: BlogPost) => {
    setBlogPosts(prev => [post, ...prev]);
  };

  const renderView = () => {
    switch (view) {
      case 'home':
      case 'browse':
        return (
          <BrowseView 
            products={products.filter(p => {
              const seller = sellers.find(s => s.userId === p.sellerId);
              // Only show products from approved sellers
              return seller?.status === SellerStatus.APPROVED;
            })} 
            onSelectProduct={(id) => { setSelectedProductId(id); setView('product'); }}
            onNavigateToSell={() => setView('sell')}
          />
        );
      case 'product':
        const prod = products.find(p => p.id === selectedProductId);
        if (!prod) return <div className="p-10 text-center font-bold">Product not found</div>;
        const activeSeller = sellers.find(s => s.userId === prod.sellerId) || sellers[0];
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
        if (user.role === UserRole.ADMIN) { setView('admin'); return null; }
        
        // Show approval pending screen if not approved
        if (sellerProfile?.status === SellerStatus.PENDING_APPROVAL) {
          return (
            <div className="max-w-xl mx-auto my-20 p-10 bg-white rounded-[3rem] shadow-xl text-center">
              <span className="material-symbols-outlined text-6xl text-primary mb-4 animate-pulse">verified_user</span>
              <h2 className="text-3xl font-display font-black text-dark mb-2">Awaiting Approval</h2>
              <p className="text-slate-500 font-medium leading-relaxed">Your application for <span className="text-primary font-bold">{sellerProfile.businessName}</span> is being reviewed by our Admin team. We'll notify you via email shortly.</p>
            </div>
          );
        }
        if (sellerProfile?.status === SellerStatus.DISABLED) {
          return (
            <div className="max-w-xl mx-auto my-20 p-10 bg-white rounded-[3rem] shadow-xl text-center border-t-8 border-accent">
              <span className="material-symbols-outlined text-6xl text-accent mb-4">block</span>
              <h2 className="text-3xl font-display font-black text-dark mb-2">Account Suspended</h2>
              <p className="text-slate-500 font-medium">Your seller account has been disabled. Please contact support@spf.co.za for more information.</p>
            </div>
          );
        }

        return (
          <SellerDashboard 
            user={user} 
            profile={sellerProfile}
            products={products.filter(p => p.sellerId === user.id)}
            enquiries={enquiries.filter(e => e.sellerId === user.id)}
            orders={orders.filter(o => o.items.some(i => products.find(p => p.id === i.productId)?.sellerId === user.id))}
            onAddProduct={(p) => setProducts(prev => [...prev, { ...p, id: `p${Date.now()}` }])}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
            onUpdateProfile={(updated) => { setSellerProfile(updated); setSellers(prev => prev.map(s => s.userId === updated.userId ? updated : s)); }}
          />
        );
      case 'admin':
        if (!user || user.role !== UserRole.ADMIN) { setView('home'); return null; }
        return (
          <AdminDashboard 
            products={products} 
            sellers={sellers}
            enquiries={enquiries} 
            orders={orders} 
            blogPosts={blogPosts}
            onUpdateSellerStatus={updateSellerStatus}
            onDeleteProduct={deleteProduct}
            onUpdateProduct={updateProduct}
            onAddBlogPost={addBlogPost}
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
