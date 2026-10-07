import { Badge } from '@/components/ui/badge';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';

export function HongKong({ quotation, color, showQr, quotationUrl, footerTitle, footerNotes, formatAmount, t, formatDate }: any) {
  const template = { primary: color, secondary: color };
  
  const isPreview = !quotation;
  const quotationData = isPreview ? {
    quotation_number: '<Quotation Number>',
    status: 'draft',
    quotation_date: '2025-12-01',
    valid_until: '2025-12-31',
    customer: { name: '<Customer Name>', email: '<Email>' },
    branch: { name: '<Branch Name>' },
    items: [1,2,3].map(i => ({ id: i, product_name: `Product ${i}`, quantity: 1, unit_price: 100, tax_rate: 10, line_total: 110, product: { taxes: [{ id: 1, name: 'VAT', rate: 10 }] } })),
    notes: '<Notes>',
    terms_conditions: '<Terms & Conditions>',
    subtotal: 300,
    total_amount: 330,
    tax_amount: 30,
    discount_amount: 0
  } : quotation;
  
  const displayAmount = (amount) => isPreview ? `$${amount.toFixed(2)}` : formatAmount(amount);
  const translate = (key) => isPreview ? key : t(key);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="pb-8 flex items-center justify-between" style={{ borderBottom: `3px solid ${template.primary}` }}>
            <div className="flex items-center gap-8">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: template.secondary }}>Quotation</h1>
                <div className="text-sm">{quotationData.quotation_number}</div>
              </div>
              
              <div className="flex gap-4">
                <div className="p-2 rounded" style={{ backgroundColor: `${template.primary}08` }}>
                  <div className="text-xs text-gray-500">{translate('Quotation Date')}</div>
                  <div className="font-semibold text-sm">{formatDate ? formatDate(quotationData.quotation_date) : new Date(quotationData.quotation_date).toLocaleDateString()}</div>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: `${template.primary}08` }}>
                  <div className="text-xs text-gray-500">{translate('Valid Until')}</div>
                  <div className="font-semibold text-sm">{formatDate ? formatDate(quotationData.valid_until) : new Date(quotationData.valid_until).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge className={quotationData.status === 'sent' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' : quotationData.status === 'approved' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : quotationData.status === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' : quotationData.status === 'converted' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20' : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'}>
                {quotationData.status === 'approved' ? translate('Approved') : quotationData.status === 'sent' ? translate('Sent') : quotationData.status === 'rejected' ? translate('Rejected') : quotationData.status === 'converted' ? translate('Converted') : translate('Draft')}
              </Badge>
              
              {showQr && (
                <div className="p-3 rounded-lg border-2 border-dashed flex flex-col items-center" style={{ borderColor: `${template.primary}40`, backgroundColor: `${template.primary}05` }}>
                  <div className="text-xs text-gray-500 tracking-wide mb-2">{translate('Scan to Share')}</div>
                  <QRCodeGenerator value={quotationUrl || 'https://example.com/quotation'} size={80} />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-3" style={{ color: template.primary }}>{translate('Customer')}:</h3>
              <div className="text-sm space-y-1">
                <p>{quotationData.customer?.name}</p>
                <p>{quotationData.customer?.email}</p>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-3" style={{ color: template.primary }}>{translate('Branch')}:</h3>
              <div className="p-4 rounded" style={{ backgroundColor: `${template.primary}10` }}>
                <div className="font-bold">{quotationData.branch?.name}</div>
              </div>
            </div>
          </div>
          <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm"><thead><tr style={{ background: template.primary }}><th className="text-left py-4 px-6 text-white font-bold text-sm">{translate('Description')}</th><th className="text-center py-4 px-6 text-white font-bold text-sm">{translate('Qty')}</th><th className="text-right py-4 px-6 text-white font-bold text-sm">{translate('Unit Price')}</th><th className="text-left py-4 px-6 text-white font-bold text-sm">{translate('Tax')}</th><th className="text-right py-4 px-6 text-white font-bold text-sm">{translate('Total')}</th></tr></thead><tbody className="bg-white">{quotationData.items?.map((item: any, index: number) => (<tr key={item.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}><td className="py-4 px-6">{item.product_name}</td><td className="text-center py-4 px-6">{item.quantity}</td><td className="text-right py-4 px-6 font-mono">{displayAmount(item.unit_price)}</td><td className="py-4 px-6">{item.product?.taxes?.length > 0 ? item.product.taxes.map((tax: any) => (<span key={tax.id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mr-1 whitespace-nowrap">{tax.name} {parseFloat(tax.rate)}%</span>)) : <span className="text-xs text-gray-400">—</span>}</td><td className="text-right py-4 px-6 font-semibold font-mono">{displayAmount(item.line_total)}</td></tr>))}</tbody></table>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h4 className="font-bold mb-1" style={{ color: template.primary }}>{translate('Notes')}:</h4>
                <p className="text-sm text-gray-600">{quotationData.notes}</p>
              </div>
              <div>
                <h4 className="font-bold mb-1" style={{ color: template.primary }}>{translate('Terms & Conditions')}:</h4>
                <p className="text-sm text-gray-600">{quotationData.terms_conditions}</p>
              </div>
            </div>
            <div>
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-sm">{translate('Subtotal')}:</span>
                    <span className="text-sm font-mono">{displayAmount(quotationData.subtotal)}</span>
                  </div>
                  {quotationData.discount_amount > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-sm">{translate('Discount')}:</span>
                      <span className="text-sm font-mono">-{displayAmount(quotationData.discount_amount)}</span>
                    </div>
                  )}
                  {quotationData.tax_amount > 0 && (() => {
                    const taxMap: Record<string, { name: string; rate: number; amount: number }> = {};
                    quotationData.items?.forEach((item: any) => {
                      const qty = parseFloat(item.quantity) || 0;
                      const price = parseFloat(item.unit_price) || 0;
                      const lineSubtotal = qty * price;
                      item.product?.taxes?.forEach((tax: any) => {
                        const rate = parseFloat(tax.rate) || 0;
                        const amt = (lineSubtotal * rate) / 100;
                        if (taxMap[tax.id]) { taxMap[tax.id].amount += amt; }
                        else { taxMap[tax.id] = { name: tax.name, rate, amount: amt }; }
                      });
                    });
                    const entries = Object.values(taxMap);
                    return entries.length > 0 ? entries.map((tx, i) => (
                      <div key={i} className="flex justify-between py-1">
                        <span className="text-sm">{tx.name} ({tx.rate}%):</span>
                        <span className="text-sm font-mono">{displayAmount(tx.amount)}</span>
                      </div>
                    )) : (
                      <div className="flex justify-between py-1">
                        <span className="text-sm">{translate('Tax')}:</span>
                        <span className="text-sm font-mono">{displayAmount(quotationData.tax_amount)}</span>
                      </div>
                    );
                  })()}
                  <div className="flex justify-between py-1 border-t border-b">
                    <span className="text-sm">{translate('Total')}:</span>
                    <span className="text-sm font-bold font-mono">{displayAmount(quotationData.total_amount)}</span>
                  </div>
                </div>
                <div className="px-4 py-2" style={{ backgroundColor: `${template.primary}15` }}>
                  <div className="flex justify-between">
                    <span className="font-bold text-sm" style={{ color: template.primary }}>{translate('Quotation Total')}:</span>
                    <span className="font-bold text-lg font-mono" style={{ color: template.primary }}>{displayAmount(quotationData.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-8" style={{ borderTop: `3px solid ${template.primary}` }}>
            <p className="text-lg font-semibold mb-2" style={{ color: template.primary }}>{footerTitle || 'Thank you for your business!'}</p>
            {footerNotes && <p className="text-sm text-gray-600 mb-4">{footerNotes}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
