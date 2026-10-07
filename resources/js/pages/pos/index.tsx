import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Head, router, usePage } from '@inertiajs/react';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ShoppingCart, Search, CreditCard, Building, LayoutGrid, Monitor, Hash, LogOut, Trash2, Package, ChevronLeft, ChevronRight, Store, Plus, X, Tag, FileText, Barcode, LayoutList, AlignJustify, Maximize2, Minimize2, Minimize, Expand, PanelLeftOpen, List, Calculator } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import ProductGrid from './components/ProductGrid';
import ShoppingCartComponent from './components/ShoppingCart';
import CustomerSelector from './components/CustomerSelector';
import PaymentModal from './components/PaymentModal';
import SessionModal from './components/SessionModal';
import ReceiptModal from '@/components/receipt-modal';
import CalculatorModal from './components/CalculatorModal';

interface Product {
    id: number;
    name: string;
    sku: string;
    selling_price: number;
    stock_quantity: number;
    image?: string;
    category: { name: string };
    brand: { name: string };
    unit: { name: string };
    taxes: Array<{ rate: number }>;
}

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
}

interface CartItem extends Product {
    quantity: number;
    line_total: number;
}

interface Branch {
    id: number;
    name: string;
}

interface CashRegister {
    id: number;
    name: string;
    current_balance: number;
    branch: Branch;
}

interface PosSession {
    id: number;
    session_number: string;
    opening_balance: number;
    total_sales: number;
    total_sales_amount: number;
    cash_register: CashRegister;
}

interface PosCartItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    line_total: number;
    product: Product;
}

interface PosCart {
    id: number;
    customer: Customer | null;
    discount_amount: number | null;
    notes: string | null;
    items: PosCartItem[];
}

interface Props {
    cashRegisters: CashRegister[];
    activeSession: PosSession | null;
    activeCart: PosCart | null;
    products: Product[];
    productsTotal: number;
    categories: Array<{ id: number; name: string; image?: string | null }>;
    brands: Array<{ id: number; name: string }>;
    customers: Customer[];
    filters: {
        search?: string;
        category_id?: string;
        brand_id?: string;
        limit?: string;
    };
    perPage: number;
    loadMoreStep: number;
    quickPickProducts: Product[];
}

function cartItemsFromDb(dbItems: PosCartItem[]): CartItem[] {
    return dbItems.map(i => ({
        ...i.product,
        quantity: Number(i.quantity),
        line_total: Number(i.line_total),
    }));
}

export default function PosIndex({ cashRegisters, activeSession, activeCart, products, productsTotal, categories, brands, customers, filters, perPage, loadMoreStep, quickPickProducts }: Props) {
    const { t } = useTranslation();
    const { auth } = (usePage().props as any);
    const [cartId, setCartId] = useState<number | null>(activeCart?.id ?? null);
    const [cart, setCart] = useState<CartItem[]>(() => activeCart ? cartItemsFromDb(activeCart.items) : []);
    const [cartItemIds, setCartItemIds] = useState<Record<number, number>>(() => {
        // maps product_id -> PosCartItem.id
        if (!activeCart) return {};
        return Object.fromEntries(activeCart.items.map(i => [i.product_id, i.id]));
    });
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(activeCart?.customer ?? null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || 'all');
    const [selectedBrand, setSelectedBrand] = useState(filters.brand_id || 'all');
    const [limit, setLimit] = useState(parseInt(filters.limit || String(perPage)));
    const categoryLimitsRef = useRef<Record<string, number>>({ [filters.category_id || 'all']: parseInt(filters.limit || String(perPage)) });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showDestroyModal, setShowDestroyModal] = useState(false);
    const [currentBalance, setCurrentBalance] = useState('');
    const [currentSession, setCurrentSession] = useState<PosSession | null>(activeSession);
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [discount, setDiscount] = useState(activeCart?.discount_amount ? String(activeCart.discount_amount) : '');
    const [notes, setNotes] = useState(activeCart?.notes ?? '');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [completedSale, setCompletedSale] = useState<any>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const cartItemIdsRef = useRef<Record<number, number>>(cartItemIds);
    useEffect(() => { cartItemIdsRef.current = cartItemIds; }, [cartItemIds]);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const discountDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [barcodeInput, setBarcodeInput] = useState('');
    const barcodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [layoutMode, setLayoutMode] = useState<'beam' | 'counter'>(() => {
        const saved = localStorage.getItem('pos_layout_mode');
        return saved === 'counter' ? 'counter' : 'beam';
    });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const categoryScrollAreaRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const quickPicksScrollRef = useRef<HTMLDivElement>(null);
    const [qpCanScrollLeft, setQpCanScrollLeft] = useState(false);
    const [qpCanScrollRight, setQpCanScrollRight] = useState(false);
    const cartIdRef = useRef<number | null>(cartId);
    useEffect(() => { cartIdRef.current = cartId; }, [cartId]);

    const updateScrollButtons = useCallback(() => {
        const el = categoryScrollAreaRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    const scrollCategories = (direction: 'left' | 'right') => {
        const el = categoryScrollAreaRef.current;
        if (!el) return;
        el.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    };

    const updateQpScrollButtons = useCallback(() => {
        const el = quickPicksScrollRef.current;
        if (!el) return;
        setQpCanScrollLeft(el.scrollLeft > 2);
        setQpCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    const scrollQuickPicks = (direction: 'left' | 'right') => {
        const el = quickPicksScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: direction === 'left' ? -280 : 280, behavior: 'smooth' });
    };

    useEffect(() => {
        const el = categoryScrollAreaRef.current;
        if (!el) return;

        el.addEventListener('scroll', updateScrollButtons);
        const ro = new ResizeObserver(() => updateScrollButtons());
        ro.observe(el);
        updateScrollButtons();
        return () => {
            el.removeEventListener('scroll', updateScrollButtons);
            ro.disconnect();
        };
    }, [categories, updateScrollButtons]);

    useEffect(() => {
        const el = quickPicksScrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateQpScrollButtons);
        const ro = new ResizeObserver(() => updateQpScrollButtons());
        ro.observe(el);
        updateQpScrollButtons();
        return () => {
            el.removeEventListener('scroll', updateQpScrollButtons);
            ro.disconnect();
        };
    }, [quickPickProducts, updateQpScrollButtons]);
    // ── Cart API helpers ──────────────────────────────────────────────
    const ensureCart = useCallback(async (sessionId: number): Promise<number | null> => {
        if (cartIdRef.current) return cartIdRef.current;
        try {
            const res = await axios.post(route('pos.cart.get-or-create'), { pos_session_id: sessionId });
            const id: number = res.data.cart.id;
            setCartId(id);
            return id;
        } catch {
            return null;
        }
    }, []);

    const cartPatch = useCallback(async (id: number, data: Record<string, unknown>) => {
        try {
            await axios.patch(route('pos.cart.update', id), data);
        } catch {
            // silent — local state already updated
        }
    }, []);

    const breadcrumbs= [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('POS') }
    ];

    const addToCart = async (product: Product, quantity: number = 1) => {
        let resolvedQty = quantity;
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                resolvedQty = Math.min(existingItem.quantity + quantity, product.stock_quantity);
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: resolvedQty, line_total: resolvedQty * product.selling_price }
                        : item
                );
            }
            resolvedQty = Math.min(quantity, product.stock_quantity);
            return [...prevCart, { ...product, quantity: resolvedQty, line_total: resolvedQty * product.selling_price }];
        });

        if (!currentSession) return;
        const id = await ensureCart(currentSession.id);
        if (!id) return;
        router.post(route('pos.cart.upsert-item', id), { product_id: product.id, quantity: resolvedQty }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const updatedCart = (page.props as any).activeCart as PosCart | null;
                if (updatedCart) {
                    setCartItemIds(Object.fromEntries(updatedCart.items.map(i => [i.product_id, i.id])));
                }
            },
        });
    };

    const updateCartItemQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) { removeFromCart(productId); return; }

        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId
                    ? { ...item, quantity: Math.min(quantity, item.stock_quantity), line_total: Math.min(quantity, item.stock_quantity) * item.selling_price }
                    : item
            )
        );

        if (!cartIdRef.current) return;
        const id = cartIdRef.current;
        // debounce the API call 500 ms
        const key = `qty-${productId}`;
        if ((updateCartItemQuantity as any)[key]) clearTimeout((updateCartItemQuantity as any)[key]);
        (updateCartItemQuantity as any)[key] = setTimeout(() => {
            router.post(route('pos.cart.upsert-item', id), { product_id: productId, quantity }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);
    };

    const removeFromCart = (productId: number) => {
        const dbItemId = cartItemIdsRef.current[productId];
        if (!cartIdRef.current || !dbItemId) {
            setCart(prevCart => prevCart.filter(i => i.id !== productId));
            return;
        }
        router.delete(route('pos.cart.remove-item', { cart: cartIdRef.current, item: dbItemId }), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as any).flash;
                setCart(prevCart => prevCart.filter(i => i.id !== productId));
                setCartItemIds(prev => { const n = { ...prev }; delete n[productId]; return n; });
                if (flash?.error) toast.error(t(flash.error));
            },
            onError: () => {
                toast.error(t('Failed to remove item from cart'));
            },
        });
    };

    const clearCart = () => {
        if (!cartIdRef.current) return;
        router.delete(route('pos.cart.clear', cartIdRef.current), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as any).flash;
                if (flash?.error) {
                    toast.error(t(flash.error));
                } else {
                    setCart([]);
                    setDiscount('');
                    setNotes('');
                    setCartItemIds({});
                    if (flash?.success) toast.success(t(flash.success));
                }
            },
            onError: () => {
                toast.error(t('Failed to clear cart'));
            },
        });
    };

    // Sync customer to DB
    const handleCustomerSelect = (customer: Customer | null) => {
        if (!cartIdRef.current) {
            setSelectedCustomer(customer);
            return;
        }
        router.post(route('pos.cart.set-customer', cartIdRef.current), { customer_id: customer?.id ?? null }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as any).flash;
                if (flash?.error) {
                    toast.error(t(flash.error));
                } else {
                    setSelectedCustomer(customer);
                }
            },
            onError: () => {
                toast.error(t('Failed to update customer'));
            },
        });
    };

    // Debounced discount sync
    const handleDiscountChange = (value: string) => {
        setDiscount(value);
        if (discountDebounceRef.current) clearTimeout(discountDebounceRef.current);
        discountDebounceRef.current = setTimeout(() => {
            if (cartIdRef.current) cartPatch(cartIdRef.current, { discount_amount: parseFloat(value) || 0 });
        }, 800);
    };

    // Debounced notes sync
    const handleNotesChange = (value: string) => {
        setNotes(value);
        if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
        notesDebounceRef.current = setTimeout(() => {
            if (cartIdRef.current) cartPatch(cartIdRef.current, { notes: value || null });
        }, 1000);
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + item.line_total, 0);
    };

    const calculateTax = () => {
        return cart.reduce((sum, item) => {
            const itemTax = item.taxes.reduce((tax, taxItem) => {
                if (taxItem.type === 'percentage') {
                    return tax + (item.line_total * taxItem.rate / 100);
                } else { // fixed
                    return tax + (taxItem.rate * item.quantity);
                }
            }, 0);
            return sum + itemTax;
        }, 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const calculateDiscount = () => {
        const d = parseFloat(discount || '0');
        return isNaN(d) || d < 0 ? 0 : Math.min(d, calculateTotal());
    };

    const calculateGrandTotal = () => {
        return calculateTotal() - calculateDiscount();
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;

        setIsCheckingOut(true);

        const saleData = {
            customer_id: selectedCustomer?.id ?? null,
            cash_register_id: currentSession!.cash_register.id,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.selling_price,
            })),
            discount_amount: calculateDiscount() || null,
            notes: notes || null,
        };

        router.post(route('pos.sales.store'), saleData, {
            onSuccess: async () => {
                setIsCheckingOut(false);
                toast.success(t('Sale completed successfully!'));
                setShowCartDrawer(false);
                try {
                    const res = await fetch(
                        route('sales.index') + `?cash_register_id=${currentSession!.cash_register.id}&per_page=1`,
                        { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
                    );
                    const data = await res.json();
                    if (data.data && data.data.length > 0) {
                        setCompletedSale(data.data[0]);
                        setShowReceiptModal(true);
                    }
                } catch {
                    // receipt fetch failed — sale still completed
                }
                setCart([]);
                setCartItemIds({});
                setSelectedCustomer(null);
                setDiscount('');
                setNotes('');
                setCartId(null);
            },
            onError: (errors) => {
                setIsCheckingOut(false);
                toast.error(`${t('Checkout failed')}: ${Object.values(errors).join(', ')}`);
            },
        });
    };

    const isInitialMount = useRef(true);
    const loadProducts = useCallback((overrides: Record<string, any> = {}) => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        router.get(route('pos.index'), {
            search: searchTerm || undefined,
            category_id: selectedCategory === 'all' ? undefined : selectedCategory,
            brand_id: selectedBrand === 'all' ? undefined : selectedBrand,
            limit,
            ...overrides,
        }, { preserveState: true, preserveScroll: true });
    }, [searchTerm, selectedCategory, selectedBrand]);

    const handleLoadMore = () => {
        const newLimit = limit + loadMoreStep;
        setLimit(newLimit);
        categoryLimitsRef.current[selectedCategory] = newLimit;
        setLoadingMore(true);
        router.get(route('pos.index'), {
            search: searchTerm || undefined,
            category_id: selectedCategory === 'all' ? undefined : selectedCategory,
            brand_id: selectedBrand === 'all' ? undefined : selectedBrand,
            limit: newLimit,
        }, { preserveState: true, preserveScroll: true, onFinish: () => setLoadingMore(false) });
    };

    // Debounced search — fires 300 ms after the user stops typing
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setLimit(perPage);
            loadProducts({ limit: perPage });
        }, 300);
        return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
    }, [searchTerm]);

    const handleSessionStart = async (session: PosSession) => {
        setCurrentSession(session);
        setShowSessionModal(false);
        try {
            const res = await axios.post(route('pos.cart.get-or-create'), { pos_session_id: session.id });
            setCartId(res.data.cart.id);
        } catch {
            // cart will be created lazily on first add
        }
    };

    const handlePaymentComplete = () => {
        clearCart();
        setShowPaymentModal(false);
    };

    const handleDestroySession = () => {
        setShowDestroyModal(true);
    };

    const confirmDestroySession = () => {
        if (!currentSession) return;
        
        const data = currentBalance ? { current_balance: parseFloat(currentBalance) } : {};
        
        router.delete(route('pos.sessions.destroy', currentSession.id), {
            data: data,
            onSuccess: () => {
                toast.success(t('Session destroyed successfully'));
                setCurrentSession(null);
                setShowDestroyModal(false);
                setCurrentBalance('');
            },
            onError: () => {
                toast.error(t('Failed to destroy session'));
                setShowDestroyModal(false);
            }
        });
    };

    const handleSearch = () => loadProducts();

    const processBarcodeSearch = async (scanned: string) => {
        if (!scanned) return;
        setBarcodeInput('');

        // Helper: match a single product object against the scanned value
        const matchProduct = (p: Product): boolean => {
            // 1. Exact SKU match
            if (p.sku.toLowerCase() === scanned.toLowerCase()) return true;
            // 2. PRD-prefixed ID match (e.g. PRD000050 → id 50)
            const idMatch = scanned.match(/^PRD(\d+)$/i);
            if (idMatch && p.id === parseInt(idMatch[1], 10)) return true;
            // 3. Cleaned product name match
            const cleaned = p.name.replace(/[^A-Za-z0-9\s]/g, '').substring(0, 25).trim();
            if (cleaned.toLowerCase() === scanned.toLowerCase()) return true;
            return false;
        };

        // First try matching within already-loaded products (instant, no network)
        let matched: Product | undefined = products.find(matchProduct);

        // If not found locally, fetch from server — covers products not in the
        // current paginated/filtered list (e.g. PRD000050 when only 20 are loaded)
        if (!matched) {
            try {
                const res = await axios.get(route('pos.products'), {
                    params: { search: scanned },
                });
                const serverProducts: Product[] = res.data || [];
                matched = serverProducts.find(matchProduct);
            } catch {
                // network error — fall through to not-found toast
            }
        }

        if (matched) {
            if (matched.stock_quantity === 0) {
                toast.error(t('Product is out of stock'));
            } else {
                addToCart(matched);
            }
        } else {
            toast.error(t('No product found with this barcode'));
        }
    };

    const handleBarcodeInput = (value: string) => {
        setBarcodeInput(value);
        if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current);
        barcodeDebounceRef.current = setTimeout(() => {
            processBarcodeSearch(value.trim());
        }, 300);
    };

    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current);
            processBarcodeSearch(barcodeInput.trim());
        }
    };

    // Keyboard shortcuts: '/' → focus search, F8 → focus barcode
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
            if (e.key === 'F8') {
                e.preventDefault();
                barcodeInputRef.current?.focus();
                barcodeInputRef.current?.select();
            }
            if (e.key === '/' && !isTyping) {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
            // alt + c to open calculator
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                setShowCalculator(true);
            }
            
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const handleFilterChange = (type: string, value: string) => {
        if (type === 'category') {
            setSelectedCategory(value);
            const savedLimit = categoryLimitsRef.current[value] ?? perPage;
            setLimit(savedLimit);
            loadProducts({ category_id: value === 'all' ? undefined : value, limit: savedLimit });
        } else if (type === 'brand') {
            setSelectedBrand(value);
            loadProducts({ brand_id: value === 'all' ? undefined : value });
        }
    };

    if (!currentSession) {
        return (
            <PageTemplate title={t('POS - Point of Sale')} description={t('Process sales transactions with comprehensive POS system.')} url="/pos" breadcrumbs={breadcrumbs}>
                <Head title={t('POS - Point of Sale')} />
                <div className="flex items-center justify-center min-h-[60vh] px-4">
                    <div className="flex flex-col items-center text-center max-w-md gap-5">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 text-primary shadow-sm">
                            <Store className="w-12 h-12" />
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">
                                {t('No Active POS Session')}
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {t("You don't have an active POS session yet. Start a new session to begin creating orders and managing sales.")}
                            </p>
                        </div>

                        {/* Action */}
                        <Button size="lg" className="gap-2 px-8" onClick={() => setShowSessionModal(true)}>
                            <Plus className="w-4 h-4" />
                            {t('Open Session')}
                        </Button>
                    </div>
                </div>

                <SessionModal
                    isOpen={showSessionModal}
                    onClose={() => setShowSessionModal(false)}
                    cashRegisters={cashRegisters}
                    onSessionStart={handleSessionStart}
                />
            </PageTemplate>
        );
    }

    return (
        <PageTemplate
            title={t('POS - Point of Sale')}
            url="/pos"
            breadcrumbs={breadcrumbs}
            description={t('Manage your business sales transactions with comprehensive POS system.')}
            noPadding
            actions={[
                {
                    icon: isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />,
                    onClick: toggleFullscreen,
                    tooltip: isFullscreen ? t('Exit Full Screen') : t('Full Screen'),
                    variant: 'outline',
                },
                {
                    icon: <Calculator className="h-4 w-4" />,
                    onClick: () => setShowCalculator(true),
                    tooltip: t('Calculator'),
                    variant: 'outline',
                },
                {
                    icon: (
                        <span className="relative flex items-center gap-1.5">
                            <ShoppingCart className="h-4 w-4" />
                            {cart.length > 0 && (
                                <span className="absolute -top-3 -right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                                    {cart.length > 99 ? '99+' : cart.length}
                                </span>
                            )}
                        </span>
                    ),
                    onClick: () => setShowCartDrawer(true),
                    className: 'lg:hidden relative',
                }
            ]}
        >
            <style>{`
                main {
                    max-width: 100vw;
                    overflow-x: hidden !important;
                }
                body {
                    overflow-x: hidden !important;
                }
            `}</style>
            <Head title={t('POS - Point of Sale')} />
            
            <div className="flex flex-col lg:flex-row gap-3 bg-gray-50 lg:overflow-hidden ">
                {/* Left Panel - Products */}
                <div className="flex-1 flex flex-col gap-3 min-h-0 lg:flex lg:overflow-hidden lg:h-[max(calc(100vh-220px),950px)]">
                    {/* Header — always visible in both layouts */}
                    <Card className="p-2 sm:p-3 lg:p-4 shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-2">
                            {/* Left: Title */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                                    <ShoppingCart className="h-4 w-4 text-primary" />
                                </div>
                                <h1 className="text-sm lg:text-xl font-bold tracking-tight">{t('Point of Sale')}</h1>
                            </div>

                            {/* Right: Session Info + Action */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Session Number */}
                                <div className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                                    <Hash className="h-3 w-3 md:h-2.5 md:w-2.5" />
                                    <span className="font-semibold">{t('Session')}</span>
                                    <span className="text-blue-500">·</span>
                                    <span>{currentSession.session_number}</span>
                                </div>

                                {/* Cash Register */}
                                <div className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200">
                                    <Monitor className="h-3 w-3 md:h-2.5 md:w-2.5" />
                                    <span>{currentSession.cash_register.name}</span>
                                </div>

                                {/* Branch */}
                                {currentSession.cash_register.branch && (
                                    <div className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                        <Building className="h-3 w-3 md:h-2.5 md:w-2.5" />
                                        <span>{currentSession.cash_register.branch.name}</span>
                                    </div>
                                )}

                                {/* Destroy Session Button */}
                                {auth.permissions.includes('manage-pos-sessions') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDestroySession}
                                    className="inline-flex items-center gap-1.5 text-xs md:text-[10px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{t('Destroy Session')}</span>
                                </Button>
                                )}
                            </div>
                        </div>
                        
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    ref={searchInputRef}
                                    placeholder={t('Search products by name or SKU...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-12 text-sm md:text-xs h-10"
                                />
                                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">/</kbd>
                            </div>

                            {/* Barcode Scanner */}
                            <div className="relative">
                                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    ref={barcodeInputRef}
                                    placeholder={t('Scan barcode...')}
                                    value={barcodeInput}
                                    onChange={(e) => handleBarcodeInput(e.target.value)}
                                    onKeyDown={handleBarcodeKeyDown}
                                    className="pl-10 pr-14 text-sm md:text-xs h-10"
                                />
                                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">F8</kbd>
                            </div>

                            {/* Layout Toggle */}
                            <div className="inline-flex items-center gap-1 rounded-sm border border-gray-200 p-1 h-10">
                                <button
                                    onClick={() => { setLayoutMode('beam'); localStorage.setItem('pos_layout_mode', 'beam'); }}
                                    title={t('Beam Layout')}
                                    className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-semibold transition-all duration-150 ${
                                        layoutMode === 'beam'
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <PanelLeftOpen className="h-3.5 w-3.5 shrink-0" />
                                    <span>{t('Beam')}</span>
                                </button>
                                <button
                                    onClick={() => { setLayoutMode('counter'); localStorage.setItem('pos_layout_mode', 'counter'); }}
                                    title={t('Counter Layout')}
                                    className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                        layoutMode === 'counter'
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <List className="h-3.5 w-3.5 shrink-0" />
                                    <span>{t('Counter')}</span>
                                </button>
                            </div>

                            <div className="flex gap-2 items-center">
                                <Select value={selectedBrand} onValueChange={(value) => handleFilterChange('brand', value)}>
                                    <SelectTrigger className="w-full sm:w-32 text-xs h-10">
                                        <SelectValue placeholder={t('Brand')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        <SelectItem value="all">{t('All Brands')}</SelectItem>
                                        {brands.map((brand) => (
                                            <SelectItem key={brand.id} value={brand.id.toString()}>
                                                {brand.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                            </div>
                        </div>

                        {/* Category Tab Bar — Beam layout only */}
                        {layoutMode === 'beam' && (
                        <div className="mt-2 relative">
                            <button
                                onClick={() => scrollCategories('left')}
                                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-primary hover:border-primary/40 hover:shadow-lg transition-all duration-150 ${canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <div
                                ref={categoryScrollAreaRef}
                                className="flex gap-2 overflow-x-auto px-1 py-1"
                                style={{ scrollbarWidth: 'none' }}
                            >
                                <button
                                    onClick={() => handleFilterChange('category', 'all')}
                                    className={`cursor-pointer flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all shrink-0 min-w-[80px] ${selectedCategory === 'all'
                                        ? 'bg-primary/10 text-primary border-primary shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-20 h-20 flex items-center justify-center text-xs font-bold`}>
                                        <LayoutGrid className='h-12 w-12'  />
                                    </div>
                                    <span className="text-[11px] font-medium leading-none">{t('All')}</span>
                                </button>

                                {categories.map((category) => {
                                    const isActive = selectedCategory === category.id.toString();
                                    const defaultImage = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;
                                    const imageUrl = category.image
                                        ? window.appSettings.getImageUrl(category.image)
                                        : defaultImage;

                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => handleFilterChange('category', category.id.toString())}
                                            className={`cursor-pointer flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all shrink-0 min-w-[80px] ${isActive
                                                ? 'bg-primary/10 text-primary border-primary shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="w-20 h-20 rounded overflow-hidden shrink-0">
                                                <img
                                                    src={imageUrl}
                                                    alt={category.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultImage; }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-medium leading-none max-w-[72px] truncate">{category.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => scrollCategories('right')}
                                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-primary hover:border-primary/40 hover:shadow-lg transition-all duration-150 ${canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        )}
                    </Card>

                    {/* ── Quick Picks — shown in both layouts ── */}
                    {quickPickProducts.length > 0 && (
                        <Card className="px-2 py-4 sm:px-3 shrink-0">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                                    <ShoppingCart className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm font-bold text-gray-800">{t('Quick Picks')}</span>
                                <span className="text-[10px] text-gray-400">· {t('Most sold')}</span>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => scrollQuickPicks('left')}
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-primary hover:border-primary/40 hover:shadow-lg transition-all duration-150 ${qpCanScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                <div
                                    ref={quickPicksScrollRef}
                                    className="flex gap-1.5 overflow-x-auto"
                                    style={{ scrollbarWidth: 'none' }}
                                >
                                    <div className="flex gap-1.5">
                                            {quickPickProducts.map((product) => {
                                                const isOut = product.stock_quantity === 0;
                                                const cartQty = cart.find(i => i.id === product.id)?.quantity ?? 0;
                                                const defaultImg = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;
                                                const imageUrl = product.image ? window.appSettings?.getImageUrl?.(product.image) : defaultImg;
                                                return (
                                                    <div
                                                        key={product.id}
                                                        className={`relative flex items-center gap-2 shrink-0 w-[160px] rounded-lg border bg-white px-2 py-1.5 transition-all
                                                            ${isOut ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm hover:border-primary/40'}`}
                                                        onClick={() => !isOut && addToCart(product)}
                                                    >
                                                        {/* Image */}
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={imageUrl}
                                                                alt={product.name}
                                                                className="w-9 h-9 object-contain rounded-md bg-gray-50"
                                                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultImg; }}
                                                            />
                                                            {cartQty > 0 && (
                                                                <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold leading-none">
                                                                    {cartQty > 99 ? '99+' : cartQty}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Info */}
                                                        <div className="flex flex-col min-w-0">
                                                            <p className="text-[10px] font-semibold text-gray-800 truncate max-w-[80px]">{product.name}</p>
                                                            <span className="text-[10px] font-bold text-gray-900 font-mono">{window.appSettings.formatCurrency(product.selling_price)}</span>
                                                            {isOut
                                                                ? <span className="text-[9px] text-red-500 font-medium">{t('Out of Stock')}</span>
                                                                : <span className="text-[9px] text-emerald-600 font-medium">{product.stock_quantity} {t('left')}</span>
                                                            }
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                <button
                                    onClick={() => scrollQuickPicks('right')}
                                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-primary hover:border-primary/40 hover:shadow-lg transition-all duration-150 ${qpCanScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Products Grid — Beam layout only */}
                    {layoutMode === 'beam' && (
                    <Card className="flex-1 overflow-auto p-2 sm:p-4 min-h-[400px] lg:min-h-0">
                        <ProductGrid
                            searchTerm={searchTerm}
                            onAddToCart={addToCart}
                            cashRegisterId={currentSession.cash_register.id}
                            products={products}
                            productsTotal={productsTotal}
                            onSearch={handleSearch}
                            onLoadMore={handleLoadMore}
                            loadingMore={loadingMore}
                            cart={cart}
                        />
                    </Card>
                    )}

                    {/* ── Counter layout: vertical category sidebar + list view ── */}
                    {layoutMode === 'counter' && (
                        <div className="flex flex-1 gap-3 min-h-0 overflow-hidden">
                            {/* Category sidebar */}
                            <Card className="w-36 shrink-0 overflow-y-auto flex flex-col gap-1 p-2">
                                <button
                                    onClick={() => handleFilterChange('category', 'all')}
                                    className={`cursor-pointer flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-all ${
                                        selectedCategory === 'all'
                                            ? 'bg-primary/10 text-primary border-primary shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                    }`}
                                >
                                    <LayoutGrid className="h-10 w-10" />
                                    <span className="text-[10px] font-medium leading-none text-center">{t('All')}</span>
                                </button>
                                {categories.map((category) => {
                                    const isActive = selectedCategory === category.id.toString();
                                    const defaultImage = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;
                                    const imageUrl = category.image ? window.appSettings.getImageUrl(category.image) : defaultImage;
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => handleFilterChange('category', category.id.toString())}
                                            className={`cursor-pointer flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-all ${
                                                isActive
                                                    ? 'bg-primary/10 text-primary border-primary shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                                                <img
                                                    src={imageUrl}
                                                    alt={category.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultImage; }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-medium leading-none text-center max-w-[100px] truncate">{category.name}</span>
                                        </button>
                                    );
                                })}
                            </Card>

                            {/* Product list */}
                            <Card className="flex-1 overflow-auto p-2 sm:p-3 min-h-[400px] lg:min-h-0">
                                <ProductGrid
                                    searchTerm={searchTerm}
                                    onAddToCart={addToCart}
                                    cashRegisterId={currentSession.cash_register.id}
                                    products={products}
                                    productsTotal={productsTotal}
                                    onSearch={handleSearch}
                                    onLoadMore={handleLoadMore}
                                    loadingMore={loadingMore}
                                    cart={cart}
                                    listView={true}
                                />
                            </Card>
                        </div>
                    )}

                </div>
                {/* Right Panel - Cart and Customer — desktop only */}
                <Card className="hidden lg:flex w-96 flex-col min-h-0 overflow-hidden lg:h-[max(calc(100vh-220px),950px)]">
                    {/* Customer Section */}
                    <div className="px-3 py-3 border-b">
                        <CustomerSelector
                            selectedCustomer={selectedCustomer}
                            onCustomerSelect={handleCustomerSelect}
                            customers={customers}
                        />
                    </div>

                    {/* Cart Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Cart Header */}
                        <div className="px-3 py-2.5 border-b bg-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                                    <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="text-xs lg:text-sm font-semibold text-gray-800 dark:text-white">{t('Cart')}</span>
                                {cart.length > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                                        {cart.length}
                                    </span>
                                )}
                            </div>
                            {cart.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearCart}
                                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{t('Clear all')}</span>
                                </Button>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-auto min-h-0">
                            <ShoppingCartComponent
                                items={cart}
                                onUpdateQuantity={updateCartItemQuantity}
                                onRemoveItem={removeFromCart}
                            />
                        </div>

                        {/* Totals and Checkout */}
                        <div className="border-t bg-white dark:bg-card">
                            {/* Discount + Notes */}
                            <div className="px-3 pt-3 pb-2 space-y-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                <div>
                                    <Label htmlFor="desktop-discount" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                        <Tag className="inline h-3 w-3 mr-1" />{t('Discount')}
                                    </Label>
                                    <Input
                                        id="desktop-discount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={discount}
                                        onChange={(e) => handleDiscountChange(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="desktop-notes" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                        <FileText className="inline h-3 w-3 mr-1" />{t('Notes')} ({t('Optional')})
                                    </Label>
                                    <Textarea
                                        id="desktop-notes"
                                        value={notes}
                                        onChange={(e) => handleNotesChange(e.target.value)}
                                        placeholder={t('Add any notes for this sale...')}
                                        rows={2}
                                        className="text-xs resize-none"
                                    />
                                </div>
                            </div>

                            {/* Summary rows */}
                            <div className="px-4 pt-3 pb-2 space-y-1.5">
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span>{t('Subtotal')}</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-200 font-mono">{window.appSettings.formatCurrency(calculateSubtotal())}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span>{t('Tax')}</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-200 font-mono">{window.appSettings.formatCurrency(calculateTax())}</span>
                                </div>
                                {calculateDiscount() > 0 && (
                                    <div className="flex justify-between items-center text-xs text-green-600 dark:text-green-400">
                                        <span>{t('Discount')}</span>
                                        <span className="font-medium font-mono">- {window.appSettings.formatCurrency(calculateDiscount())}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 mt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
                                    <span className="text-xs lg:text-sm font-bold text-gray-800 dark:text-gray-100">{t('Grand Total')}</span>
                                    <span className="text-sm lg:text-base font-extrabold text-primary font-mono">{window.appSettings.formatCurrency(calculateGrandTotal())}</span>
                                </div>
                            </div>

                            {/* Checkout button */}
                            <div className="px-3 pb-3 pt-1">
                                <Button
                                    className="w-full h-9 lg:h-11 text-xs lg:text-sm font-semibold rounded-xl shadow-sm transition-all"
                                    disabled={cart.length === 0 || isCheckingOut}
                                    onClick={handleCheckout}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    {isCheckingOut ? t('Processing...') : t('Checkout')}
                                    {cart.length > 0 && !isCheckingOut && (
                                        <span className="ml-2 opacity-75 text-xs font-mono">
                                            &bull; {window.appSettings.formatCurrency(calculateGrandTotal())}
                                        </span>
                                    )}
                                </Button>
                                {!selectedCustomer && cart.length > 0 && (
                                    <p className="text-center text-[11px] text-amber-500 mt-1.5 flex items-center justify-center gap-1">
                                        {t('Walk-in Customer selected')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Cart drawer — tablet/mobile only */}
            <Sheet open={showCartDrawer} onOpenChange={setShowCartDrawer}>
                <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col max-h-screen">
                    <SheetHeader className="px-4 py-3 border-b shrink-0">
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            {t('Cart')}
                            {cart.length > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                                    {cart.length}
                                </span>
                            )}
                        </SheetTitle>
                    </SheetHeader>

                    {/* Scrollable Body Container */}
                    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
                        {/* Customer */}
                        <div className="px-3 py-3 border-b bg-gray-50/60 shrink-0">
                            <CustomerSelector
                                selectedCustomer={selectedCustomer}
                                onCustomerSelect={handleCustomerSelect}
                                customers={customers}
                            />
                        </div>

                        {/* Cart header */}
                        <div className="px-3 py-2.5 border-b bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                                    <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="text-xs lg:text-sm font-semibold text-gray-800">{t('Items')}</span>
                            </div>
                            {cart.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearCart}
                                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t('Clear all')}
                                </Button>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className="flex-1 overflow-y-auto min-h-[180px]">
                            <ShoppingCartComponent
                                items={cart}
                                onUpdateQuantity={updateCartItemQuantity}
                                onRemoveItem={removeFromCart}
                            />
                        </div>

                        {/* Totals + checkout */}
                        <div className="border-t bg-white dark:bg-card shrink-0 mt-auto">
                            {/* Discount + Notes */}
                            <div className="px-3 pt-3 pb-2 space-y-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                <div>
                                    <Label htmlFor="mobile-discount" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                        <Tag className="inline h-3 w-3 mr-1" />{t('Discount')}
                                    </Label>
                                    <Input
                                        id="mobile-discount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={discount}
                                        onChange={(e) => handleDiscountChange(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="mobile-notes" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                        <FileText className="inline h-3 w-3 mr-1" />{t('Notes')} ({t('Optional')})
                                    </Label>
                                    <Textarea
                                        id="mobile-notes"
                                        value={notes}
                                        onChange={(e) => handleNotesChange(e.target.value)}
                                        placeholder={t('Add any notes for this sale...')}
                                        rows={2}
                                        className="text-xs resize-none"
                                    />
                                </div>
                            </div>

                            <div className="px-4 pt-3 pb-2 space-y-1.5">
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span>{t('Subtotal')}</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{window.appSettings.formatCurrency(calculateSubtotal())}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span>{t('Tax')}</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{window.appSettings.formatCurrency(calculateTax())}</span>
                                </div>
                                {calculateDiscount() > 0 && (
                                    <div className="flex justify-between items-center text-xs text-green-600 dark:text-green-400">
                                        <span>{t('Discount')}</span>
                                        <span className="font-medium">- {window.appSettings.formatCurrency(calculateDiscount())}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 mt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
                                    <span className="text-xs lg:text-sm font-bold text-gray-800 dark:text-gray-100">{t('Grand Total')}</span>
                                    <span className="text-sm lg:text-base font-extrabold text-primary">{window.appSettings.formatCurrency(calculateGrandTotal())}</span>
                                </div>
                            </div>
                            <div className="px-3 pb-4 pt-1">
                                <Button
                                    className="w-full h-9 lg:h-11 text-xs lg:text-sm font-semibold rounded-xl shadow-sm transition-all"
                                    disabled={cart.length === 0 || isCheckingOut}
                                    onClick={handleCheckout}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    {isCheckingOut ? t('Processing...') : t('Checkout')}
                                    {cart.length > 0 && !isCheckingOut && (
                                        <span className="ml-2 opacity-75 text-xs">
                                            &bull; {window.appSettings.formatCurrency(calculateGrandTotal())}
                                        </span>
                                    )}
                                </Button>
                                {!selectedCustomer && cart.length > 0 && (
                                    <p className="text-center text-[11px] text-amber-500 mt-1.5 flex items-center justify-center gap-1">
                                        {t('Walk-in Customer selected')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Payment Modal — kept for future use, not opened by checkout */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                cart={cart}
                customer={selectedCustomer}
                cashRegister={currentSession.cash_register}
                subtotal={calculateSubtotal()}
                tax={calculateTax()}
                total={calculateTotal()}
                onPaymentComplete={handlePaymentComplete}
            />

            {/* Receipt Modal — shown after direct checkout */}
            {completedSale && (
                <ReceiptModal
                    isOpen={showReceiptModal}
                    onClose={() => { setShowReceiptModal(false); setCompletedSale(null); }}
                    sale={completedSale}
                    companyInfo={{
                        name: (() => {
                            if (completedSale?.creator?.type === 'company') return completedSale.creator.name;
                            if (completedSale?.creator?.creator?.type === 'company') return completedSale.creator.creator.name;
                            return auth?.user?.name || 'Company Name';
                        })(),
                        address: window.appSettings?.get?.('companyAddress') || '',
                        phone: window.appSettings?.get?.('companyPhone') || '',
                        email: completedSale?.creator?.email || auth?.user?.email || '',
                    }}
                />
            )}

            {/* Calculator Modal */}
            <CalculatorModal isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

            {/* Destroy Session Modal */}
            <Dialog open={showDestroyModal} onOpenChange={setShowDestroyModal}>
                <DialogContent className="max-w-md pl-0 pr-0">
                    <DialogHeader className='px-6'>
                        <DialogTitle>{t('Destroy Session')}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 px-6">
                        <p className="text-sm text-gray-600">
                            {t('Are you sure you want to destroy this session? This action cannot be undone.')}
                        </p>
                        
                        <div>
                            <Label required htmlFor="currentBalance">{t('Current Balance')}</Label>
                            <Input
                                id="currentBalance"
                                type="number"
                                value={currentBalance}
                                onChange={(e) => setCurrentBalance(e.target.value)}
                                placeholder={t('Enter current cash register balance')}
                                step="0.01"
                                min="0"
                                className="mt-1"
                                required
                            />
                        </div>
                        
                    </div>
                        <DialogFooter className='px-6'>
                        <div className="flex space-x-3">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowDestroyModal(false);
                                    setCurrentBalance('');
                                }}
                                className="flex-1"
                            >
                                {t('Cancel')}
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={confirmDestroySession}
                                disabled={!currentBalance || parseFloat(currentBalance) < 0}
                                className="flex-1  whitespace-nowrap"
                            >
                                {t('Destroy Session')}
                            </Button>
                        </div>
                        </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}