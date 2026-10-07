import React, { useState } from 'react';
import { Package, ShoppingCart, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

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
    min_stock_level: number;
}

interface CartItem extends Product {
    quantity: number;
    line_total: number;
}

interface Props {
    searchTerm: string;
    onAddToCart: (product: Product, quantity?: number) => void;
    cashRegisterId: number;
    products: Product[];
    productsTotal: number;
    onSearch: (search: string) => void;
    onLoadMore: () => void;
    loadingMore: boolean;
    cart: CartItem[];
    listView?: boolean;
}

export default function ProductGrid({ searchTerm, onAddToCart, cashRegisterId, products, productsTotal, onSearch, onLoadMore, loadingMore, cart, listView = false }: Props) {
    const { t } = useTranslation();
    const [loading] = useState(false);
    const hasMore = products.length < productsTotal;

    const defaultImage = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;

    const getStockState = (product: Product) => {
        const qty = product.stock_quantity;
        if (qty === 0) return 'out';
        if (qty <= (product.min_stock_level || 0)) return 'low';
        return 'in';
    };

    const stockBadgeClass = {
        out: 'bg-red-50 text-red-600 ring-red-200',
        low: 'bg-amber-50 text-amber-600 ring-amber-200',
        in:  'bg-emerald-50 text-emerald-600 ring-emerald-200',
    };

    /* ── Skeleton loader ── */
    if (loading && products.length === 0) {
        return (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="rounded-xl border bg-white animate-pulse overflow-hidden">
                        <div className="bg-gray-100 h-36" />
                        <div className="p-3 space-y-2">
                            <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                            <div className="h-5 bg-gray-100 rounded w-1/3 mt-1" />
                            <div className="h-8 bg-gray-100 rounded mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* ── Empty state ── */
    if (products.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center select-none">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    {searchTerm
                        ? <Search className="h-8 w-8 text-gray-300" />
                        : <Package className="h-8 w-8 text-gray-300" />
                    }
                </div>
                <p className="text-sm font-semibold text-gray-500">
                    {searchTerm ? t('No products found') : t('No products available')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    {searchTerm
                        ? t('Try adjusting your search or filters')
                        : t('Products will appear here once added')
                    }
                </p>
            </div>
        );
    }

    const LoadMoreButton = () => hasMore ? (
        <div className="flex justify-center pt-3 pb-2 px-2">
            <Button variant="default" disabled={loadingMore} onClick={onLoadMore}>
                <span>{t('Load More')}</span>
                {loadingMore && (
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                )}
            </Button>
        </div>
    ) : null;

    /* ── Table view (Counter layout) ── */
    if (listView) {
        return (
            <div className="flex flex-col gap-3">
                <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left text-[11px] font-semibold text-gray-500 tracking-wide px-3 py-2.5 w-12">{t('Image')}</th>
                                <th className="text-left text-[11px] font-semibold text-gray-500 tracking-wide px-3 py-2.5">{t('SKU')}</th>
                                <th className="text-left text-[11px] font-semibold text-gray-500 tracking-wide px-3 py-2.5">{t('Item')}</th>
                                <th className="text-right text-[11px] font-semibold text-gray-500 tracking-wide px-3 py-2.5">{t('Price')}</th>
                                <th className="text-center text-[11px] font-semibold text-gray-500 tracking-wide px-3 py-2.5 w-14">{t('Add')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {products.map((product) => {
                                const stockState = getStockState(product);
                                const isOutOfStock = stockState === 'out';
                                const imageUrl = product.image ? window.appSettings?.getImageUrl?.(product.image) : defaultImage;
                                const cartQty = cart.find(i => i.id === product.id)?.quantity ?? 0;
                                return (
                                    <tr
                                        key={product.id}
                                        className={`transition-colors ${
                                            isOutOfStock ? 'opacity-60 bg-gray-50' : 'bg-white hover:bg-primary/5'
                                        }`}
                                    >
                                        {/* Image */}
                                        <td className="px-3 py-2">
                                            <div className="relative w-10 h-10 shrink-0">
                                                <img
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain rounded-lg bg-gray-50"
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultImage; }}
                                                />
                                                {stockState === 'low' && (
                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
                                                )}
                                            </div>
                                        </td>
                                        {/* SKU */}
                                        <td className="px-3 py-2">
                                            <span className="text-[11px] text-gray-600 font-mono">{product.sku}</span>
                                        </td>
                                        {/* Item */}
                                        <td className="px-3 py-2 max-w-[200px]">
                                            <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full ring-1 ring-inset ${stockBadgeClass[stockState]}`}>
                                                    {isOutOfStock ? t('Out of Stock') : `${product.stock_quantity} ${product.unit.name}`}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Price */}
                                        <td className="px-3 py-2 text-right">
                                            <span className="text-sm font-mono text-gray-900">
                                                {window.appSettings.formatCurrency(product.selling_price)}
                                            </span>
                                        </td>
                                        {/* Add to cart */}
                                        <td className="px-3 py-2 text-center">
                                            <div className="relative inline-flex">
                                                {cartQty > 0 && (
                                                    <span className="absolute -top-2 -right-2 z-10 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm">
                                                        {cartQty > 99 ? '99+' : cartQty}
                                                    </span>
                                                )}
                                                <button
                                                    disabled={isOutOfStock}
                                                    onClick={() => !isOutOfStock && onAddToCart(product)}
                                                    className={`flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-white shadow-sm transition-all duration-150
                                                        ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                                                >
                                                    <ShoppingCart className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <LoadMoreButton />
            </div>
        );
    }

    /* ── Grid view (Beam layout) ── */
    return (
        <div className="flex flex-col gap-3">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-5">
                {products.map((product) => {
                    const stockState = getStockState(product);
                    const isOutOfStock = stockState === 'out';
                    const imageUrl = product.image
                        ? window.appSettings?.getImageUrl?.(product.image)
                        : defaultImage;

                    return (
                        <div
                            key={product.id}
                            className={`relative rounded-xl border bg-white overflow-hidden flex flex-col transition-all duration-200
                                ${isOutOfStock
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'cursor-pointer hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5'
                                }`}
                        >
                            {/* Product Image */}
                            <div className="relative h-36 bg-gray-50 overflow-hidden shrink-0">
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-contain bg-white"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = defaultImage;
                                    }}
                                />
                                {isOutOfStock && (
                                    <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                                        <span className="text-white text-xs font-semibold bg-gray-900/70 px-2.5 py-1 rounded-full">
                                            {t('Out of Stock')}
                                        </span>
                                    </div>
                                )}
                                {stockState === 'low' && (
                                    <div className="absolute top-2 left-2">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                            <AlertTriangle className="h-2.5 w-2.5" />
                                            {t('Low')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex flex-col flex-1 p-2.5 gap-1.5">
                                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[2.5em]">
                                    {product.name}
                                </p>
                                <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[10px] text-gray-400">{product.sku}</span>
                                    <span className="text-[10px] text-gray-300">·</span>
                                    <span className="text-[10px] text-gray-500 font-medium truncate max-w-[80px]">{product.category.name}</span>
                                </div>
                                {(() => {
                                    const cartQty = cart.find(i => i.id === product.id)?.quantity ?? 0;
                                    return (
                                        <div className="flex items-end justify-between mt-auto pt-1">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-extrabold text-gray-900 font-mono">
                                                    {window.appSettings.formatCurrency(product.selling_price)}
                                                </span>
                                                <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ring-1 ring-inset w-fit ${stockBadgeClass[stockState]}`}>
                                                    {product.stock_quantity} {product.unit.name}
                                                </span>
                                            </div>
                                            <div className="relative">
                                                {cartQty > 0 && (
                                                    <span className="absolute -top-2 -right-2 z-10 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none tabular-nums shadow-sm">
                                                        {cartQty > 99 ? '99+' : cartQty}
                                                    </span>
                                                )}
                                                <button
                                                    disabled={isOutOfStock}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddToCart(product);
                                                    }}
                                                    className={`flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white shadow-sm transition-all duration-150
                                                        ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                                                >
                                                    <ShoppingCart className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>
            <LoadMoreButton />
        </div>
    );
}
