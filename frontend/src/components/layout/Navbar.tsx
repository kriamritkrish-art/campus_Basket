'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingBag,
  Search,
  Zap,
  MapPin,
  ChevronDown,
  ChevronRight,
  Utensils,
  Apple,
  Shirt,
  BookOpen,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  ShoppingBasket,
  CheckCircle2
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  // Hide User Navbar completely on Admin, Provider, and Delivery Portals
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/provider') ||
    pathname?.startsWith('/delivery')
  ) {
    return null;
  }

  const router = useRouter();
  const { user, role, isAuthenticated, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string>('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [hallPickerOpen, setHallPickerOpen] = useState(false);
  const [selectedHall, setSelectedHall] = useState('Hall 11');

  const halls = [
    'Hall 1', 'Hall 2', 'Hall 3', 'Hall 4', 'Hall 5',
    'Hall 7', 'Hall 8', 'Hall 9', 'Hall 10', 'Hall 11',
    'Hall 12', 'Hall 13', 'Hall 14', 'Mother Teresa Hall',
    'Sister Nivedita Hall', 'Gargi Hall'
  ];

  const categories = [
    {
      id: 'food',
      name: 'Food & Meals',
      href: '/food',
      icon: Utensils,
      desc: 'Biryani, Thali, Snacks & Beverages',
      subOptions: [
        { name: 'Hot Meals & Biryani', desc: 'Kolkata chicken biryani & egg curry with steamed rice', href: '/food' },
        { name: 'Hostel Night Snacks', desc: 'Chicken kathi rolls, samosas & ginger masala chai', href: '/food', badge: 'Till 2 AM' },
        { name: 'Student Thali & Curries', desc: 'Paneer butter masala, butter rotis & fresh salad', href: '/food' },
        { name: 'South Indian Specials', desc: 'Crispy ghee roast masala dosa with fresh coconut chutney', href: '/food' }
      ]
    },
    {
      id: 'fruits',
      name: 'Fresh Fruits',
      href: '/fruits',
      icon: Apple,
      desc: 'Apples, Bananas, Seasonal Orchards',
      subOptions: [
        { name: 'Fresh Farm Fruits', desc: 'Daily handpicked orchard-fresh fruits for hostel rooms', href: '/fruits' },
        { name: 'Crisp Apples & Bananas', desc: 'Sweet Kashmiri red apples & Robusta ripe bananas', href: '/fruits' },
        { name: 'Nagpur Sweet Oranges', desc: 'Juicy, vitamin-C rich hand-sorted Nagpur mandarins', href: '/fruits' },
        { name: 'Ruby Pomegranate & Grapes', desc: 'Nutrient-rich antioxidant fruits for daily health', href: '/fruits' }
      ]
    },
    {
      id: 'laundry',
      name: 'Express Laundry',
      href: '/laundry',
      icon: Shirt,
      desc: 'Room pickup & Dual-OTP steam iron',
      subOptions: [
        { name: 'Dual-OTP Laundry', desc: 'Automated wash, steam press & room pickup across Halls 1–14', href: '/laundry', badge: 'Verified' },
        { name: 'Book Doorstep Wash', desc: 'Schedule contactless room pickup with dual security OTPs', href: '/laundry/book', badge: 'Fast Slot' },
        { name: '12-Hour Urgent Express Wash', desc: 'Priority queue wash & press for exams & presentations', href: '/laundry' },
        { name: 'Heavy Blanket & Winterwear', desc: 'Deep drum wash & sanitization for duvets and comforters', href: '/laundry' }
      ]
    },
    {
      id: 'essentials',
      name: 'Stationery & Essentials',
      href: '/essentials',
      icon: BookOpen,
      desc: 'Casio Calculators, Notes & Lab Paper',
      subOptions: [
        { name: 'Casio & Scientific Calculators', desc: 'Casio fx-991EX Classwiz 552 functions for engineering', href: '/essentials', badge: 'Exam Ready' },
        { name: 'Notebooks & Lab Printing Paper', desc: 'Classmate exercise notebooks & JK Cedar A4 copier sheets', href: '/essentials' },
        { name: 'Engineering Drafters & Instruments', desc: 'Heavy-duty steel mini-drafter & compass drawing set', href: '/essentials' },
        { name: 'Pens & Exam Essentials', desc: 'Gel pens, graph paper sheets and laboratory stationary', href: '/essentials' }
      ]
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/food?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Tier 1: Main Header (BigBasket Style) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 md:gap-6">
          {/* Logo & Sub-brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#689f38] to-[#84c225] flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                bb
              </div>
            </div>
            <div>
              <div className="font-extrabold text-[#212121] text-lg sm:text-xl tracking-tight leading-none flex items-center gap-1">
                <span>campus</span>
                <span className="text-[#689f38]">basket</span>
              </div>
              <div className="text-[9.5px] font-semibold tracking-wider text-gray-500 uppercase mt-0.5">
                A NIT Durgapur Initiative
              </div>
            </div>
          </Link>

          {/* Center Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for Meals, Fresh Fruits, Laundry, Casio Calculators, Snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-24 rounded-lg bg-gray-50 border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:bg-white focus:ring-1 focus:ring-[#84c225] transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4" />
              <button
                type="submit"
                className="absolute right-1.5 h-8 px-4 bg-[#689f38] hover:bg-[#5b8c30] text-white text-xs font-semibold rounded-md transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right Section: Delivery Badge, Auth & Cart */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Delivery Location Pill */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setHallPickerOpen(!hallPickerOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f1f8e9] border border-[#dcedc8] text-left hover:bg-[#e8f5e9] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#689f38] flex items-center justify-center text-white shrink-0">
                  <Zap className="w-3.5 h-3.5 fill-white" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#2e7d32] uppercase tracking-wide leading-none">
                    Delivery in 10-15 mins
                  </div>
                  <div className="text-xs font-semibold text-gray-800 flex items-center gap-0.5 leading-tight">
                    <span>{selectedHall}</span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </div>
                </div>
              </button>

              {/* Hall Selector Dropdown */}
              {hallPickerOpen && (
                <div className="absolute top-full mt-2 right-0 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50">
                  <div className="text-[11px] font-bold text-gray-500 uppercase px-2.5 py-1">
                    Select Residence Hall
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {halls.map((hall) => (
                      <button
                        key={hall}
                        onClick={() => {
                          setSelectedHall(hall);
                          setHallPickerOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          selectedHall === hall
                            ? 'bg-[#f1f8e9] text-[#2e7d32] font-bold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {hall}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {role === 'ADMIN' && (
                  <Link
                    href="/admin/dashboard"
                    className="hidden sm:flex items-center gap-1.5 bg-purple-100 text-purple-800 border border-purple-200 px-3 py-2 rounded-md text-xs font-bold hover:bg-purple-200 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" /> Admin
                  </Link>
                )}
                {role === 'SERVICE_PROVIDER' && (
                  <Link
                    href="/provider/dashboard"
                    className="hidden sm:flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-md text-xs font-bold hover:bg-emerald-200 transition-colors"
                  >
                    Vendor
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 border border-gray-300 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#689f38]" />
                  <span className="hidden sm:inline">
                    {user?.student?.fullName?.split(' ')[0] || user?.email.split('@')[0]}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-md bg-[#212121] hover:bg-black text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
              >
                Login / Sign Up
              </Link>
            )}

            {/* BigBasket Red Shopping Basket Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-lg bg-[#e53935] hover:bg-[#d32f2f] text-white shadow-sm flex items-center justify-center transition-all active:scale-95"
              aria-label="Shopping Basket"
            >
              <ShoppingBasket className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-[#e53935] text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow border border-[#e53935]">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <form onSubmit={handleSearch} className="pb-3 md:hidden">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search meals, fruits, laundry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-20 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3" />
            <button
              type="submit"
              className="absolute right-1 h-8 px-3 bg-[#689f38] text-white text-xs font-bold rounded-md"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Tier 2: Category Bar (BigBasket Signature Green "Shop by Category") */}
      <div className="border-t border-gray-200 bg-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 text-xs">
            <div className="flex items-center gap-6">
              {/* Green "Shop by Category" Button with Vertical 2-Column Mega Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCategoryDropdownOpen(true)}
                onMouseLeave={() => setCategoryDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="bg-[#689f38] hover:bg-[#5b8c30] text-white font-bold px-4 py-2 rounded flex items-center gap-2 tracking-wide shadow-sm"
                >
                  <span>Shop by Category</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      categoryDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Vertical Category Dropdown: Left column = 4 Main Categories, Right column = Vertical Sub-options */}
                {categoryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-[660px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Left Column: Exactly 4 Main Categories Vertically (Matching Screenshot) */}
                    <div className="w-72 bg-white border-r border-gray-100 py-2 divide-y divide-gray-50 shrink-0">
                      <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        4 Main Categories
                      </div>
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isHovered = hoveredCategory === cat.id;

                        return (
                          <Link
                            key={cat.id}
                            href={cat.href}
                            onMouseEnter={() => setHoveredCategory(cat.id)}
                            onClick={() => setCategoryDropdownOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left group relative ${
                              isHovered
                                ? 'bg-[#f1f8e9] border-l-4 border-l-[#689f38]'
                                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                isHovered
                                  ? 'bg-[#e8f5e9] text-[#2e7d32] ring-1 ring-[#c8e6c9]'
                                  : 'bg-[#f4f9ed] text-[#689f38] group-hover:bg-[#e8f5e9]'
                              }`}
                            >
                              <Icon className="w-5 h-5 stroke-[1.8]" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-xs font-bold leading-snug truncate ${
                                  isHovered ? 'text-[#1b5e20]' : 'text-gray-900 group-hover:text-[#689f38]'
                                }`}
                              >
                                {cat.name}
                              </div>
                              <div className="text-[10px] text-gray-500 font-normal leading-tight mt-0.5 line-clamp-1">
                                {cat.desc}
                              </div>
                            </div>

                            <ChevronRight
                              className={`w-4 h-4 shrink-0 transition-transform ${
                                isHovered
                                  ? 'text-[#689f38] translate-x-1 stroke-[2.5]'
                                  : 'text-gray-300 group-hover:text-gray-500'
                              }`}
                            />
                          </Link>
                        );
                      })}
                    </div>

                    {/* Right Column: Sub-Options Displayed Vertically Under Selected Main Category */}
                    {(() => {
                      const activeCat =
                        categories.find((c) => c.id === hoveredCategory) || categories[0];
                      return (
                        <div className="flex-1 bg-[#fafafa] p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 mb-3">
                              <div>
                                <div className="text-xs font-black text-gray-900">
                                  {activeCat.name}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  Vertical Options &amp; Services
                                </div>
                              </div>
                              <Link
                                href={activeCat.href}
                                onClick={() => setCategoryDropdownOpen(false)}
                                className="text-[11px] font-bold text-[#689f38] hover:underline flex items-center gap-0.5"
                              >
                                <span>View All</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>

                            {/* The Sub-Options Shown Vertically */}
                            <div className="space-y-2">
                              {activeCat.subOptions.map((sub) => (
                                <Link
                                  key={sub.name}
                                  href={sub.href}
                                  onClick={() => setCategoryDropdownOpen(false)}
                                  className="block p-2.5 rounded-xl bg-white border border-gray-200/80 hover:border-[#689f38] hover:shadow-sm transition-all group"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-gray-800 group-hover:text-[#689f38] transition-colors flex items-center gap-1.5">
                                      <span>{sub.name}</span>
                                      {sub.badge && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#f1f8e9] text-[#2e7d32] border border-[#dcedc8]">
                                          {sub.badge}
                                        </span>
                                      )}
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#689f38] group-hover:translate-x-0.5 transition-all" />
                                  </div>
                                  <div className="text-[10.5px] text-gray-500 leading-snug mt-0.5">
                                    {sub.desc}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-200 mt-4 flex items-center justify-between text-[11px] text-gray-500">
                            <span className="flex items-center gap-1 text-[#2e7d32] font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#689f38]" /> 10-Min Hostel Delivery
                            </span>
                            <span className="font-medium text-gray-400">Halls 1–14 Covered</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Verified Campus Service Badges (replacing the cluttered horizontal text links) */}
              <div className="hidden lg:flex items-center gap-5 text-xs text-gray-600 font-medium">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>10–15 Min Room Delivery</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#689f38]" />
                  <span>Subsidized Campus Tariffs</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Shirt className="w-3.5 h-3.5 text-sky-600" />
                  <span>Dual-OTP Doorstep Laundry</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Halls 1 to 14</span>
                </span>
              </div>
            </div>

            {/* Smart Basket Badge */}
            <Link
              href="/food"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:border-[#689f38] hover:text-[#689f38] transition-colors font-bold text-[11px] bg-gray-50"
            >
              <div className="w-4 h-4 rounded-full bg-[#84c225] flex items-center justify-center text-white">
                <Sparkles className="w-2.5 h-2.5" />
              </div>
              <span>Smart Basket</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-3 pb-6 space-y-4">
          <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
            4 Main Categories
          </div>

          <div className="space-y-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <Link
                    href={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 bg-gray-50/70 hover:bg-[#f1f8e9] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#f4f9ed] text-[#689f38] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-xs">{cat.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{cat.desc}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </Link>

                  {/* Vertical sub-options on mobile */}
                  <div className="p-2.5 bg-white space-y-1.5 border-t border-gray-100">
                    {cat.subOptions.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 text-[11px] text-gray-700 font-medium"
                      >
                        <span>{sub.name}</span>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/laundry/book"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-[#689f38] font-bold text-white text-xs shadow-sm"
            >
              Book Doorstep Laundry
            </Link>

            {!isAuthenticated ? (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 text-center rounded-lg bg-[#212121] text-white text-xs font-bold"
              >
                Login / Sign Up
              </Link>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-center rounded-lg bg-gray-100 text-gray-700 text-xs font-bold"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
