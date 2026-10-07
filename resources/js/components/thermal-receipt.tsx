import React from 'react';

interface ReceiptItem {
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
}

interface ReceiptProps {
    sale: {
        id: number;
        sale_number: string;
        customer?: Customer | null;
        items: ReceiptItem[];
        subtotal: number;
        tax_amount: number;
        discount_amount?: number;
        total_amount: number;
        paid_amount: number;
        payment_method: string;
        notes?: string;
        sale_date: string;
        cash_register?: {
            name: string;
            branch?: {
                name: string;
                address?: string;
                phone?: string;
            };
        };
    };
    companyInfo?: {
        name: string;
        address?: string;
        phone?: string;
        email?: string;
    };
}

export const ThermalReceipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({
    sale,
    companyInfo
}, ref) => {
    const changeAmount = Math.max(0, Number(sale.paid_amount || 0) - Number(sale.total_amount || 0));

    return (
        <>
            <style>
                {`
                    @media print {
                        .thermal-receipt {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color: black !important;
                        }
                        .thermal-receipt * {
                            color: black !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                        }
                        .company-info {
                            color: black !important;
                            font-weight: normal !important;
                        }
                    }
                `}
            </style>
            <div
                ref={ref}
                className="thermal-receipt"
                style={{
                    width: '80mm',
                    maxWidth: '302px',
                    margin: '0 auto',
                    padding: '8px',
                    fontFamily: 'Courier New, monospace',
                    fontSize: '12px',
                    lineHeight: '1.2',
                    backgroundColor: 'white',
                    color: 'black'
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{companyInfo.name}</div>
                    {companyInfo.address && (
                        <div className="company-info" style={{
                            fontSize: '10px',
                            marginBottom: '2px',
                            color: 'black',
                            fontWeight: 'normal'
                        }}>{companyInfo.address}</div>
                    )}
                    {companyInfo.phone && (
                        <div className="company-info" style={{
                            fontSize: '10px',
                            marginBottom: '2px',
                            color: 'black',
                            fontWeight: 'normal'
                        }}>{companyInfo.phone}</div>
                    )}
                </div>

            <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }}></div>

            {/* Sale Info */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Receipt #:</span>
                    <span>{sale.sale_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Date:</span>
                    <span>{window.appSettings.formatDateTime(new Date(sale.sale_date),false)}</span>
                </div>
                {sale.cash_register && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Register:</span>
                        <span>{sale.cash_register.name}</span>
                    </div>
                )}
                {sale.cash_register?.branch && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Branch:</span>
                        <span>{sale.cash_register.branch.name}</span>
                    </div>
                )}
            </div>

            <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }}></div>

            {/* Customer Info */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Customer:</span>
                    <span>{sale.customer?.name || 'Walk-in Customer'}</span>
                </div>
                {sale.customer?.phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Phone:</span>
                        <span>{sale.customer.phone}</span>
                    </div>
                )}
                {sale.customer?.email && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>E-mail:</span>
                        <span>{sale.customer.email}</span>
                    </div>
                )}
            </div>

            <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }}></div>

            {/* Items and Totals */}
            <div style={{ marginBottom: '8px' }}>

                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '4px' }}>
                    <span>Description</span>
                    <span>Amt</span>
                </div>

                {/* Per Product Row */}
                {sale.items?.map((item, index) => {
                    const name = item.product_name || item.name || item.product?.name || 'Item';
                    const price = Number(item.unit_price || 0);
                    const qty = item.quantity;
                    const lineTotal = Number((price * qty));
                    const taxAmt = item.tax_rate > 0
                                        ? Number(((price * qty * item.tax_rate) / 100).toFixed(2))
                                        : Number(item.tax_amount || 0);
                    const taxLabel = item.tax_rate > 0 ? `Tax: ${item.tax_rate}%` : 'Tax (Fixed)';
                    const hasTax = taxAmt > 0;
                    return (
                        <div key={index} style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px dashed #aaa' }}>
                            {/* Full width product name */}
                            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {name}
                            </div>
                            {/* Qty x Price = Total */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span>{qty} x {window.appSettings.formatCurrency(price)}</span>
                                <span style={{ fontWeight: 'bold' }}>{window.appSettings.formatCurrency(lineTotal)}</span>
                            </div>
                            {/* Tax per product: percentage on left, amount on right */}
                            {hasTax && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '1px' }}>
                                    <span>{taxLabel}</span>
                                    <span>{window.appSettings.formatCurrency(taxAmt)}</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Totals Summary */}
                <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                        <span>Total Items:</span>
                        <span>{sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                        <span>SubTotal:</span>
                        <span>{window.appSettings.formatCurrency(sale.subtotal || 0)}</span>
                    </div>
                    {Number(sale.tax_amount) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                            <span>Tax:</span>
                            <span>{window.appSettings.formatCurrency(sale.tax_amount || 0)}</span>
                        </div>
                    )}
                    {sale.discount_amount && Number(sale.discount_amount) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                            <span>Discount:</span>
                            <span>-{window.appSettings.formatCurrency(sale.discount_amount)}</span>
                        </div>
                    )}
                    <div style={{ borderTop: '1px solid #000', marginTop: '4px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                        <span>Total</span>
                        <span>{window.appSettings.formatCurrency(sale.total_amount || 0)}</span>
                    </div>
                </div>
            </div>

            <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }}></div>

            {/* Payment Info */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Payment:</span>
                    <span style={{ textTransform: 'capitalize' }}>{sale.payment_method.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Paid:</span>
                    <span>{window.appSettings.formatCurrency(sale.paid_amount || 0)}</span>
                </div>
                {changeAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Change:</span>
                        <span>{window.appSettings.formatCurrency(changeAmount)}</span>
                    </div>
                )}
            </div>

            {sale.notes && (
                <>
                    <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }}></div>
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px' }}>Notes: {sale.notes}</div>
                    </div>
                </>
            )}

            <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }}></div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '10px' }}>
                <div>Thank you !</div>
            </div>

                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '10px' }}>
                    <div>* * * * * * * * * * * * * *</div>
                </div>
            </div>
        </>
    );
});

ThermalReceipt.displayName = 'ThermalReceipt';
