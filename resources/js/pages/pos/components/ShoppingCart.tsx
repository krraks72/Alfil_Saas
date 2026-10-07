import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Minus, Plus, Trash2, ShoppingBag, AlertTriangle, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CartItem {
    id: number;
    name: string;
    sku: string;
    selling_price: number;
    stock_quantity: number;
    quantity: number;
    line_total: number;
    image?: string;
    category: { name: string };
    brand: { name: string };
    unit: { name: string };
    taxes: Array<{ name: string; rate: number; type?: string }>;
}

interface Props {
    items: CartItem[];
    onUpdateQuantity: (productId: number, quantity: number) => void;
    onRemoveItem: (productId: number) => void;
}

function calcItemTax(item: CartItem): number {
    return item.taxes.reduce((sum, tax) => {
        if (tax.type === 'fixed') return sum + tax.rate * item.quantity;
        return sum + (item.line_total * tax.rate) / 100;
    }, 0);
}

export default function ShoppingCart({ items, onUpdateQuantity, onRemoveItem }: Props) {
    const { t } = useTranslation();

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-8 select-none">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <ShoppingBag className="h-9 w-9 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('Your cart is empty')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">{t('Add products from the left panel to get started')}</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {items.map((item, index) => {
                const isAtMax = item.quantity >= item.stock_quantity;
                const imageUrl = item.image
                    ? window.appSettings?.getImageUrl?.(item.image)
                    : null;
                const defaultImage = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;

                return (
                    <div
                        key={item.id}
                        className="group px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                    >
                        {/* Top row: image + info + remove */}
                        <div className="flex items-start gap-3">
                            {/* Product image / fallback */}
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 overflow-hidden shrink-0 flex items-center justify-center">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = defaultImage;
                                        }}
                                    />
                                ) : (
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                                        {item.name.charAt(0)}
                                    </span>
                                )}
                            </div>

                            {/* Name + SKU + category */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                                    {item.name}
                                </p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                    {item.sku} &bull; {item.category.name}
                                </p>
                            </div>

                            {/* Remove button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemoveItem(item.id)}
                                        className="h-7 w-7 p-0 text-gray-500 shrink-0"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    {t('Remove')}
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Bottom row: qty controls + line total */}
                        <div className="flex items-center justify-between mt-2.5 gap-2 flex-wrap pl-[52px]">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                    className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-center cursor-pointer text-gray-500 dark:text-gray-400 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>

                                <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 1;
                                        onUpdateQuantity(item.id, value);
                                    }}
                                    min="1"
                                    max={item.stock_quantity}
                                    className="w-12 h-6 text-center text-xs px-1 border-gray-200 dark:border-gray-600 rounded-md shrink-0"
                                />

                                <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                    disabled={isAtMax}
                                    className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-center cursor-pointer text-gray-500 dark:text-gray-400 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>

                                <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-1 truncate font-mono">
                                    × {window.appSettings.formatCurrency(item.selling_price)}
                                </span>
                            </div>

                            {/* Line total + tax */}
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100 font-mono">
                                    {window.appSettings.formatCurrency(item.line_total)}
                                </span>
                                {item.taxes.length > 0 && (
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                                        {t('Tax')}: {window.appSettings.formatCurrency(calcItemTax(item))}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stock warning */}
                        {isAtMax && (
                            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-md px-2 py-1 pl-[52px]">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>{t('Max stock reached')} ({item.stock_quantity} {item.unit.name})</span>
                            </div>
                        )}

                        {/* Tax badges */}
                        {item.taxes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 pl-[52px]">
                                {item.taxes.map((tax, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded px-1.5 py-0.5"
                                    >
                                        <Tag className="h-2.5 w-2.5" />
                                        {tax.name}: {tax.rate}{tax.type === 'fixed' ? '' : '%'}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
