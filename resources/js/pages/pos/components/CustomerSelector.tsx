import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Search, X, ChevronDown, Phone, Mail, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
}

const WALK_IN_CUSTOMER: Customer = { id: 0, name: 'Walk-in Customer', email: '', phone: '' };

interface Props {
    selectedCustomer: Customer | null;
    onCustomerSelect: (customer: Customer | null) => void;
    customers: Customer[];
}

function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(name: string): string {
    const colors = [
        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

export default function CustomerSelector({ selectedCustomer, onCustomerSelect, customers }: Props) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredCustomers = useMemo(() => {
        const walkInMatch = !searchTerm.trim() ||
            'walk-in customer'.includes(searchTerm.toLowerCase()) ||
            'walk-in'.includes(searchTerm.toLowerCase());
        const matched = customers.filter(customer =>
            customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.includes(searchTerm)
        );
        return walkInMatch ? [WALK_IN_CUSTOMER, ...matched] : matched;
    }, [customers, searchTerm]);

    const handleCustomerSelect = (customer: Customer) => {
        onCustomerSelect(customer.id === 0 ? null : customer);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleOpen = () => {
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleClose = () => {
        setIsOpen(false);
        setSearchTerm('');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            {/* Section Label */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 capitalize tracking-wide">
                    <UserCheck className="h-4 w-4 dark:text-white" />
                    <span className="dark:text-white">{t('Customer')}</span>
                </div>
            </div>

            {/* Selected Customer Card */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 hover:border-primary/40 hover:shadow-sm transition-all group text-left cursor-pointer"
                >
                    {selectedCustomer ? (
                        <>
                            <Avatar className={`h-9 w-9 shrink-0`}>
                                <AvatarFallback className={`text-sm font-semibold`}>
                                    {getInitials(selectedCustomer.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                        {selectedCustomer.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {selectedCustomer.phone && (
                                        <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 truncate">
                                            <Phone className="h-2.5 w-2.5" />
                                            {selectedCustomer.phone}
                                        </span>
                                    )}
                                    {selectedCustomer.email && (
                                        <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 truncate">
                                            <Mail className="h-2.5 w-2.5" />
                                            {selectedCustomer.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 group-hover:text-primary transition-colors" />
                        </>
                    ) : (
                        <>
                            <div className="h-9 w-9 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Avatar className={`h-9 w-9 shrink-0`}>
                                    <AvatarFallback className={`text-sm font-semibold`}>
                                        WC
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('Walk-in Customer')}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                        </>
                    )}
                </button>
            )}

            {/* Search Dropdown */}
            {isOpen && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
                        <Search className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('Search by name, email or phone...')}
                            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100"
                        />
                        <button
                            onClick={handleClose}
                            className="shrink-0 rounded-md p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Customer List */}
                    <div className="max-h-40 sm:max-h-52 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => {
                                const isSelected = selectedCustomer?.id === customer.id ||
                                    (customer.id === 0 && selectedCustomer === null);
                                const isWalkInOption = customer.id === 0;
                                return (
                                    <button
                                        key={customer.id}
                                        onClick={() => handleCustomerSelect(customer)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer
                                            ${isSelected
                                                ? 'bg-primary/5 dark:bg-primary/10 border-l-2 border-primary'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/60 border-l-2 border-transparent'
                                            }`}
                                    >
                                        <Avatar className={`h-8 w-8 shrink-0`}>
                                            <AvatarFallback className={`text-xs font-semibold`}>
                                                {isWalkInOption ? 'WC' : getInitials(customer.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-gray-800 dark:text-gray-100'}`}>
                                                    {customer.name}
                                                </span>
                                                {isSelected && (
                                                    <UserCheck className="h-3 w-3 text-primary shrink-0 ml-auto" />
                                                )}
                                            </div>
                                            {!isWalkInOption && (
                                                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                                                    {customer.phone && (
                                                        <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                                                            <Phone className="h-2.5 w-2.5" />
                                                            {customer.phone}
                                                        </span>
                                                    )}
                                                    {customer.email && (
                                                        <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 truncate min-w-0">
                                                            <Mail className="h-2.5 w-2.5 shrink-0" />
                                                            <span className="truncate">{customer.email}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                </div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('No customers found')}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('Try a different name, email or phone')}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer count */}
                    {filteredCustomers.length > 0 && (
                        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                {filteredCustomers.length - 1} {filteredCustomers.length - 1 === 1 ? t('customer') : t('customers')}
                                {searchTerm && ` ${t('found')}`}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
