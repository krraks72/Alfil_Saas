interface SaleData {
    id: number;
    sale_number: string;
    customer: {
        id: number;
        name: string;
        email?: string;
        phone?: string;
    };
    items: Array<{
        id: number;
        name: string;
        product_name?: string;
        quantity: number;
        unit_price: number;
        tax_rate?: string;
        line_total: number;
    }>;
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
}

interface CompanyInfo {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
}

export const generateReceiptPDF = async (sale: SaleData, companyInfo: CompanyInfo): Promise<void> => {
    const changeAmount = Math.max(0, Number(sale.paid_amount || 0) - Number(sale.total_amount || 0));

    // Create HTML content for PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Receipt ${sale.sale_number}</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    margin: 0;
                    padding: 8px;
                    width: 80mm;
                    max-width: 302px;
                    margin: 0 auto;
                    background-color: white;
                    color: black;
                }
                .header {
                    text-align: center;
                    margin-bottom: 8px;
                }
                .company-name {
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 4px;
                }
                .company-info {
                    font-size: 10px;
                    margin-bottom: 2px;
                    color: black;
                    font-weight: normal;
                }
                .separator {
                    border-top: 1px dashed #999;
                    margin: 8px 0;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2px;
                }
                .column-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    font-weight: bold;
                    border-bottom: 1px solid #000;
                    padding-bottom: 3px;
                    margin-bottom: 4px;
                }
                .item {
                    margin-bottom: 5px;
                    padding-bottom: 5px;
                    border-bottom: 1px dashed #aaa;
                }
                .item-name {
                    font-size: 11px;
                    font-weight: bold;
                    margin-bottom: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .item-price {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                }
                .item-tax {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    margin-top: 1px;
                }
                .totals-section {
                    margin-top: 6px;
                }
                .total-row {
                    border-top: 1px solid #000;
                    margin-top: 4px;
                    padding-top: 4px;
                    font-weight: bold;
                    font-size: 13px;
                }
                .footer {
                    text-align: center;
                    font-size: 10px;
                }
                .notes {
                    margin-bottom: 8px;
                    font-size: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${companyInfo.name}</div>
                ${companyInfo.address ? `<div class="company-info">${companyInfo.address}</div>` : ''}
                ${companyInfo.phone ? `<div class="company-info">${companyInfo.phone}</div>` : ''}
            </div>

            <div class="separator"></div>

            <div class="row">
                <span>Receipt #:</span>
                <span>${sale.sale_number}</span>
            </div>
            <div class="row">
                <span>Date:</span>
                <span>${window.appSettings.formatDateTime(new Date(sale.sale_date),false)}</span>
            </div>
            ${sale.cash_register ? `
            <div class="row">
                <span>Register:</span>
                <span>${sale.cash_register.name}</span>
            </div>
            ` : ''}
            ${sale.cash_register?.branch ? `
            <div class="row">
                <span>Branch:</span>
                <span>${sale.cash_register.branch.name}</span>
            </div>
            ` : ''}

            <div class="separator"></div>

            <div class="row">
                <span>Customer:</span>
                <span>${sale.customer?.name || 'Walk-in Customer'}</span>
            </div>
            ${sale.customer?.phone ? `
            <div class="row">
                <span>Phone:</span>
                <span>${sale.customer.phone}</span>
            </div>
            ` : ''}
            ${sale.customer?.email ? `
            <div class="row">
                <span>E-mail:</span>
                <span>${sale.customer.email}</span>
            </div>
            ` : ''}

            <div class="separator"></div>

            <!-- Items and Totals -->
            <div style="margin-bottom: 8px;">
                <!-- Column Header -->
                <div class="column-header">
                    <span>Description</span>
                    <span>Amt</span>
                </div>

                <!-- Per Product Row -->
                ${sale.items?.map((item, index) => {
                    const name = item.product_name || item.name || item.product?.name || 'Item';
                    const price = Number(item.unit_price || 0);
                    const qty = item.quantity;
                    const lineTotal = Number((price * qty));
                    const taxAmt = item.tax_rate > 0
                                        ? Number(((price * qty * item.tax_rate) / 100).toFixed(2))
                                        : Number(item.tax_amount || 0);
                    const taxLabel = item.tax_rate > 0 ? `Tax: ${item.tax_rate}%` : 'Tax (Fixed)';
                    const hasTax = taxAmt > 0;
                    return `
                        <div class="item">
                            <!-- Full width product name -->
                            <div class="item-name">${name}</div>
                            <!-- Qty x Price = Total -->
                            <div class="item-price">
                                <span>${qty} x ${window.appSettings.formatCurrency(price)}</span>
                                <span style="font-weight: bold;">${window.appSettings.formatCurrency(lineTotal)}</span>
                            </div>
                            ${hasTax ? `
                            <!-- Tax per product: percentage on left, amount on right -->
                            <div class="item-tax">
                                <span>${taxLabel}</span>
                                <span>${window.appSettings.formatCurrency(taxAmt)}</span>
                            </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}

                <!-- Totals Summary -->
                <div class="totals-section">
                    <div class="row" style="font-size: 11px;">
                        <span>Total Items:</span>
                        <span>${sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</span>
                    </div>
                    <div class="row" style="font-size: 11px;">
                        <span>SubTotal:</span>
                        <span>${window.appSettings.formatCurrency(sale.subtotal || 0)}</span>
                    </div>
                    ${Number(sale.tax_amount) > 0 ? `
                    <div class="row" style="font-size: 11px;">
                        <span>Tax:</span>
                        <span>${window.appSettings.formatCurrency(sale.tax_amount || 0)}</span>
                    </div>
                    ` : ''}
                    ${sale.discount_amount && Number(sale.discount_amount) > 0 ? `
                    <div class="row" style="font-size: 11px;">
                        <span>Discount:</span>
                        <span>-${window.appSettings.formatCurrency(sale.discount_amount)}</span>
                    </div>
                    ` : ''}
                    <div class="row total-row">
                        <span>Total</span>
                        <span>${window.appSettings.formatCurrency(sale.total_amount || 0)}</span>
                    </div>
                </div>
            </div>

            <div class="separator"></div>

            <div class="row">
                <span>Payment:</span>
                <span style="text-transform: capitalize;">${sale.payment_method.replace('_', ' ')}</span>
            </div>
            <div class="row">
                <span>Paid:</span>
                <span>${window.appSettings.formatCurrency(sale.paid_amount || 0)}</span>
            </div>
            ${changeAmount > 0 ? `
            <div class="row" style="font-weight: bold;">
                <span>Change:</span>
                <span>${window.appSettings.formatCurrency(changeAmount)}</span>
            </div>
            ` : ''}

            ${sale.notes ? `
            <div class="separator"></div>
            <div class="notes">
                Notes: ${sale.notes}
            </div>
            ` : ''}

            <div class="separator"></div>

            <div class="footer">
                <div>Thank you !</div>
            </div>

            <div style="margin-top: 16px; text-align: center; font-size: 10px;">
                <div>* * * * * * * * * * * * * *</div>
            </div>
        </body>
        </html>
    `;

    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${sale.sale_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    URL.revokeObjectURL(url);
};

// Generate PDF using window.print
export const generateReceiptPDFViaPrint = (sale: SaleData, companyInfo: CompanyInfo): void => {
    const changeAmount = Math.max(0, Number(sale.paid_amount || 0) - Number(sale.total_amount || 0));

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
        throw new Error('Unable to open print window. Please check popup blocker settings.');
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Receipt ${sale.sale_number}</title>
            <style>
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 20mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                        color: black !important;
                    }
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
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    margin: 0;
                    padding: 8px;
                    width: 80mm;
                    max-width: 302px;
                    margin: 0 auto;
                    background-color: white;
                    color: black;
                }
                .header {
                    text-align: center;
                    margin-bottom: 8px;
                }
                .company-name {
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 4px;
                }
                .company-info {
                    font-size: 10px;
                    margin-bottom: 2px;
                    color: black;
                    font-weight: normal;
                }
                .separator {
                    border-top: 1px dashed #999;
                    margin: 8px 0;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2px;
                }
                .column-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    font-weight: bold;
                    border-bottom: 1px solid #000;
                    padding-bottom: 3px;
                    margin-bottom: 4px;
                }
                .item {
                    margin-bottom: 5px;
                    padding-bottom: 5px;
                    border-bottom: 1px dashed #aaa;
                }
                .item-name {
                    font-size: 11px;
                    font-weight: bold;
                    margin-bottom: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .item-price {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                }
                .item-tax {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    margin-top: 1px;
                }
                .totals-section {
                    margin-top: 6px;
                }
                .total-row {
                    border-top: 1px solid #000;
                    margin-top: 4px;
                    padding-top: 4px;
                    font-weight: bold;
                    font-size: 13px;
                }
                .footer {
                    text-align: center;
                    font-size: 10px;
                }
                .notes {
                    margin-bottom: 8px;
                    font-size: 10px;
                }
            </style>
        </head>
        <body>
            <div class="thermal-receipt">
                <div class="header">
                    <div class="company-name">${companyInfo.name}</div>
                    ${companyInfo.address ? `<div class="company-info">${companyInfo.address}</div>` : ''}
                    ${companyInfo.phone ? `<div class="company-info">${companyInfo.phone}</div>` : ''}
                </div>

                <div class="separator"></div>

                <div class="row">
                    <span>Receipt #:</span>
                    <span>${sale.sale_number}</span>
                </div>
                <div class="row">
                    <span>Date:</span>
                    <span>${window.appSettings.formatDateTime(new Date(sale.sale_date),false)}</span>
                </div>
                ${sale.cash_register ? `
                <div class="row">
                    <span>Register:</span>
                    <span>${sale.cash_register.name}</span>
                </div>
                ` : ''}
                ${sale.cash_register?.branch ? `
                <div class="row">
                    <span>Branch:</span>
                    <span>${sale.cash_register.branch.name}</span>
                </div>
                ` : ''}

                <div class="separator"></div>

                <div class="row">
                    <span>Customer:</span>
                    <span>${sale.customer?.name || 'Walk-in Customer'}</span>
                </div>
                ${sale.customer?.phone ? `
                <div class="row">
                    <span>Phone:</span>
                    <span>${sale.customer.phone}</span>
                </div>
                ` : ''}
                ${sale.customer?.email ? `
                <div class="row">
                    <span>E-mail:</span>
                    <span>${sale.customer.email}</span>
                </div>
                ` : ''}

                <div class="separator"></div>

                <!-- Items and Totals -->
                <div style="margin-bottom: 8px;">
                    <!-- Column Header -->
                    <div class="column-header">
                        <span>Description</span>
                        <span>Amt</span>
                    </div>

                    <!-- Per Product Row -->
                    ${sale.items?.map((item, index) => {
                        const name = item.product_name || item.name || item.product?.name || 'Item';
                        const price = Number(item.unit_price || 0);
                        const qty = item.quantity;
                        const lineTotal = Number((price * qty));
                        const taxAmt = item.tax_rate > 0
                                            ? Number(((price * qty * item.tax_rate) / 100).toFixed(2))
                                            : Number(item.tax_amount || 0);
                        const taxLabel = item.tax_rate > 0 ? `Tax: ${item.tax_rate}%` : 'Tax (Fixed)';
                        const hasTax = taxAmt > 0;
                        return `
                            <div class="item">
                                <!-- Full width product name -->
                                <div class="item-name">${name}</div>
                                <!-- Qty x Price = Total -->
                                <div class="item-price">
                                    <span>${qty} x ${window.appSettings.formatCurrency(price)}</span>
                                    <span style="font-weight: bold;">${window.appSettings.formatCurrency(lineTotal)}</span>
                                </div>
                                ${hasTax ? `
                                <!-- Tax per product: percentage on left, amount on right -->
                                <div class="item-tax">
                                    <span>${taxLabel}</span>
                                    <span>${window.appSettings.formatCurrency(taxAmt)}</span>
                                </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}

                    <!-- Totals Summary -->
                    <div class="totals-section">
                        <div class="row" style="font-size: 11px;">
                            <span>Total Items:</span>
                            <span>${sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</span>
                        </div>
                        <div class="row" style="font-size: 11px;">
                            <span>SubTotal:</span>
                            <span>${window.appSettings.formatCurrency(sale.subtotal || 0)}</span>
                        </div>
                        ${Number(sale.tax_amount) > 0 ? `
                        <div class="row" style="font-size: 11px;">
                            <span>Tax:</span>
                            <span>${window.appSettings.formatCurrency(sale.tax_amount || 0)}</span>
                        </div>
                        ` : ''}
                        ${sale.discount_amount && Number(sale.discount_amount) > 0 ? `
                        <div class="row" style="font-size: 11px;">
                            <span>Discount:</span>
                            <span>-${window.appSettings.formatCurrency(sale.discount_amount)}</span>
                        </div>
                        ` : ''}
                        <div class="row total-row">
                            <span>Total</span>
                            <span>${window.appSettings.formatCurrency(sale.total_amount || 0)}</span>
                        </div>
                    </div>
                </div>

                <div class="separator"></div>

                <div class="row">
                    <span>Payment:</span>
                    <span style="text-transform: capitalize;">${sale.payment_method.replace('_', ' ')}</span>
                </div>
                <div class="row">
                    <span>Paid:</span>
                    <span>${window.appSettings.formatCurrency(sale.paid_amount || 0)}</span>
                </div>
                ${changeAmount > 0 ? `
                <div class="row" style="font-weight: bold;">
                    <span>Change:</span>
                    <span>${window.appSettings.formatCurrency(changeAmount)}</span>
                </div>
                ` : ''}

                ${sale.notes ? `
                <div class="separator"></div>
                <div class="notes">
                    Notes: ${sale.notes}
                </div>
                ` : ''}

                <div class="separator"></div>

                <div class="footer">
                    <div>Thank you !</div>
                </div>

                <div style="margin-top: 16px; text-align: center; font-size: 10px;">
                    <div>* * * * * * * * * * * * * *</div>
                </div>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
};