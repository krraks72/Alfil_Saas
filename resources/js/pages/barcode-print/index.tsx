import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Printer, Settings, QrCode, Search, X, CopyPlus, RotateCcw, Eye, FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';

// Load JsBarcode once globally
function useJsBarcode() {
    const [ready, setReady] = useState(!!(window as any).JsBarcode);
    useEffect(() => {
        if ((window as any).JsBarcode) { setReady(true); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
        script.onload = () => setReady(true);
        document.head.appendChild(script);
    }, []);
    return ready;
}

function BarcodePreviewItem({ value, name, price, showName, showPrice, barcodeType, barcodeWidth, barcodeHeight }: {
    value: string; name: string; price: string; showName: boolean; showPrice: boolean;
    barcodeType: string; barcodeWidth: number; barcodeHeight: number;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const jsBarcodeReady = useJsBarcode();

    useEffect(() => {
        if (!jsBarcodeReady || !svgRef.current || !value?.trim()) return;
        try {
            (window as any).JsBarcode(svgRef.current, value, {
                format: barcodeType,
                width: barcodeWidth,
                height: barcodeHeight,
                displayValue: false,
                margin: 4,
            });
        } catch {
            if (svgRef.current) svgRef.current.innerHTML = '';
        }
    }, [value, jsBarcodeReady, barcodeType, barcodeWidth, barcodeHeight]);

    return (
        <div className="border rounded p-2 text-center bg-white text-black text-xs flex flex-col items-center">
            {showName && <div className="font-semibold truncate w-full mb-1" style={{ fontSize: 10 }}>{name}</div>}
            <svg ref={svgRef} className="max-w-full" />
            {showPrice && <div className="mt-1 text-gray-600 font-mono" style={{ fontSize: 10 }}>{price}</div>}
            <div className="text-gray-400 mt-0.5" style={{ fontSize: 9 }}>{value}</div>
        </div>
    );
}

export default function BarcodePrint() {
    const { t } = useTranslation();
    const { products } = usePage().props as any;

    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [barcodeField, setBarcodeField] = useState('sku');
    const [productCopies, setProductCopies] = useState<{ [key: number]: number }>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [columnsPerRow, setColumnsPerRow] = useState('3');
    const [showPrice, setShowPrice] = useState(true);
    const [showProductName, setShowProductName] = useState(true);
    const [paperSize, setPaperSize] = useState('A4');
    const [bulkCopies, setBulkCopies] = useState('');
    const [barcodeType, setBarcodeType] = useState('CODE128');
    const [barcodeWidth, setBarcodeWidth] = useState(2);
    const [barcodeHeight, setBarcodeHeight] = useState(50);
    const [barcodeWidthInput, setBarcodeWidthInput] = useState('2');
    const [barcodeHeightInput, setBarcodeHeightInput] = useState('50');
    const barcodeWidthDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const barcodeHeightDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const totalBarcodes = Object.values(productCopies).reduce((sum, copies) => sum + (copies || 0), 0);

    const categories = Array.from(
        new Map(
            (products?.data || [])
                .filter((p: any) => p.category)
                .map((p: any) => [p.category.id, p.category])
        ).values()
    ) as any[];

    const filteredProducts = products?.data?.filter((product: any) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.selling_price.toString().includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || product.category?.id?.toString() === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Build preview barcodes from selected products
    const previewBarcodes = (products?.data || [])
        .filter((p: any) => selectedProducts.includes(p.id))
        .flatMap((product: any) => {
            let barcodeValue = product[barcodeField] || product.sku;
            if (barcodeField === 'name') {
                barcodeValue = barcodeValue.replace(/[^A-Za-z0-9\s]/g, '').substring(0, 25);
                if (barcodeValue.trim().length < 3) barcodeValue = `PRD${product.id}`;
            } else if (barcodeField === 'id') {
                barcodeValue = `PRD${String(product.id).padStart(6, '0')}`;
            }
            const copies = productCopies[product.id] || 1;
            return Array(copies).fill(null).map(() => ({
                value: barcodeValue,
                name: product.name,
                price: window.appSettings.formatCurrency(product.selling_price || 0),
            }));
        });

    const handleProductSelect = (productId: number, checked: boolean) => {
        if (checked) {
            setSelectedProducts([...selectedProducts, productId]);
            setProductCopies({ ...productCopies, [productId]: 1 });
        } else {
            setSelectedProducts(selectedProducts.filter(id => id !== productId));
            const newCopies = { ...productCopies };
            delete newCopies[productId];
            setProductCopies(newCopies);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const productIds = filteredProducts?.map((p: any) => p.id) || [];
            setSelectedProducts(productIds);
            const newCopies: { [key: number]: number } = {};
            productIds.forEach((id: number) => newCopies[id] = 1);
            setProductCopies(newCopies);
        } else {
            setSelectedProducts([]);
            setProductCopies({});
        }
    };

    const handleClearSelection = () => {
        setSelectedProducts([]);
        setProductCopies({});
    };

    const handleSetAllCopies = () => {
        const val = parseInt(bulkCopies);
        if (!val || val <= 0) {
            toast.error(t('Please enter a valid number'));
            return;
        }
        const newCopies: { [key: number]: number } = {};
        selectedProducts.forEach(id => newCopies[id] = val);
        setProductCopies(newCopies);
        toast.success(t('Copies updated for all selected products'));
    };

    // Shared helper — builds the exact same HTML used for both real print and test print
    const buildPrintHtml = (
        barcodes: { value: string; name: string; formattedPrice: string }[],
        opts: { isTest: boolean }
    ) => {
        const barcodeW = barcodeWidth;
        const barcodeH = barcodeHeight;
        const barcodeF = barcodeType;
        const cols = parseInt(columnsPerRow);
        const pageSizeMap: { [key: string]: { width: string; height: string } } = {
            'A4':      { width: '210mm', height: '297mm' },
            'A5':      { width: '148mm', height: '210mm' },
            'A6':      { width: '105mm', height: '148mm' },
            'Letter':  { width: '216mm', height: '279mm' },
            'Legal':   { width: '216mm', height: '356mm' },
            'Thermal': { width: '80mm',  height: 'auto'  },
        };
        const { width: pageWidth, height: pageHeight } = pageSizeMap[paperSize] || pageSizeMap['A4'];
        const pageRule = pageHeight === 'auto'
            ? `@page { size: ${pageWidth}; margin: 5mm; }`
            : `@page { size: ${pageWidth} ${pageHeight}; margin: 10mm; }`;
        const bodyWidth = pageWidth === 'auto' ? '80mm' : pageWidth;

        return `<!DOCTYPE html>
<html>
<head>
  <title>${opts.isTest ? `Test Print — ${paperSize} | ${cols} col${cols > 1 ? 's' : ''}` : 'Product Barcodes'}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  <style>
    ${pageRule}
    body { font-family: Arial, sans-serif; margin: 0; width: ${bodyWidth}; }
    .test-banner { background: #fef9c3; border: 1px dashed #ca8a04; color: #854d0e; font-size: 11px; text-align: center; padding: 6px; margin-bottom: 10px; border-radius: 4px; }
    .settings-info { font-size: 10px; color: #555; text-align: center; margin-bottom: 8px; }
    .barcode-grid { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 8px; }
    .barcode-item { border: 1px solid #ccc; padding: 8px; text-align: center; page-break-inside: avoid; break-inside: avoid; }
    .barcode-item svg { margin: 4px 0; max-width: 100%; }
    .product-name { font-size: 11px; font-weight: bold; margin-bottom: 4px; word-break: break-word; }
    .product-price { font-size: 10px; color: #666; }
    .barcode-value { font-size: 9px; margin-top: 4px; color: #999; }
    @media print { .test-banner { display: none; } .settings-info { display: none; } body { margin: 0; } .barcode-grid { gap: 5px; } }
  </style>
</head>
<body>
  ${opts.isTest ? `<div class="test-banner">&#9888; TEST PRINT &mdash; This banner is hidden when printing</div>
  <div class="settings-info">Paper: ${paperSize} &nbsp;|&nbsp; Columns: ${cols} &nbsp;|&nbsp; Type: ${barcodeType} &nbsp;|&nbsp; Field: ${barcodeField.toUpperCase()} &nbsp;|&nbsp; Size: ${barcodeWidth}×${barcodeHeight} &nbsp;|&nbsp; Name: ${showProductName ? 'Yes' : 'No'} &nbsp;|&nbsp; Price: ${showPrice ? 'Yes' : 'No'}</div>` : ''}
  <div class="barcode-grid">
    ${barcodes.map((b, i) => `<div class="barcode-item">
      ${showProductName ? `<div class="product-name">${b.name}</div>` : ''}
      <svg id="bc-${i}"></svg>
      ${showPrice ? `<div class="product-price">${b.formattedPrice}</div>` : ''}
      <div class="barcode-value">${b.value}</div>
    </div>`).join('\n    ')}
  </div>
  <script>
    window.onload = function() {
      ${barcodes.map((b, i) => `try { if ("${b.value}".trim()) { JsBarcode("#bc-${i}", "${b.value}", { format: "${barcodeF}", width: ${barcodeW}, height: ${barcodeH}, displayValue: false }); } } catch(e) { document.getElementById("bc-${i}").innerHTML = "<div style='padding:8px;font-size:10px;color:#999'>Invalid value for ${barcodeF}</div>"; }`).join('\n      ')}
      setTimeout(() => {
        window.print();
        window.addEventListener('afterprint', function() { window.close(); });
      }, 1500);
    };
  </script>
</body>
</html>`;
    };

    const handleTestPrint = () => {
        const cols = parseInt(columnsPerRow);
        // Generate cols × 2 samples so at least 2 full rows are visible
        const samples = Array.from({ length: cols * 2 }, (_, i) => {
            // Mirror the same barcodeField logic used for real products
            let value: string;
            let name: string;
            if (barcodeField === 'id') {
                value = `PRD${String(i + 1).padStart(6, '0')}`;
                name  = `Sample Product ${i + 1}`;
            } else if (barcodeField === 'name') {
                value = `SampleProduct${i + 1}`;
                name  = `Sample Product ${i + 1}`;
            } else {
                // sku (default)
                value = `SKU-SAMPLE-${String(i + 1).padStart(3, '0')}`;
                name  = `Sample Product ${i + 1}`;
            }
            return { value, name, formattedPrice: window.appSettings.formatCurrency((i + 1) * 9.99) };
        });

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) { toast.error(t('Unable to open print window')); return; }
        printWindow.document.write(buildPrintHtml(samples, { isTest: true }));
        printWindow.document.close();

        // Close the popup after print dialog is dismissed
        printWindow.onafterprint = () => printWindow.close();
        const pollClose = setInterval(() => {
            if (!printWindow || printWindow.closed) { clearInterval(pollClose); return; }
            try {
                if (printWindow.document.readyState === 'complete') {
                    printWindow.onafterprint = () => { clearInterval(pollClose); printWindow.close(); };
                }
            } catch { clearInterval(pollClose); }
        }, 500);

        toast.success(t('Test print opened — check how it looks before printing real barcodes'));
    };

    const handleResetSettings = () => {
        setBarcodeField('sku');
        setBarcodeType('CODE128');
        setBarcodeWidth(1);
        setBarcodeHeight(50);
        setBarcodeWidthInput('1');
        setBarcodeHeightInput('50');
        setColumnsPerRow('2');
        setShowPrice(true);
        setShowProductName(true);
        setPaperSize('A4');
        setBulkCopies('');
        toast.success(t('Settings reset to default'));
    };

    const handlePrintBarcodes = () => {
        if (selectedProducts.length === 0) {
            toast.error(t('Please select at least one product'));
            return;
        }
        const invalidProducts = selectedProducts.filter(id => !productCopies[id] || productCopies[id] <= 0);
        if (invalidProducts.length > 0) {
            toast.error(t('Please enter valid copy quantities for all selected products'));
            return;
        }
        const selectedProductsData = products?.data?.filter((p: any) => selectedProducts.includes(p.id));
        generateBarcodeSheet(selectedProductsData, barcodeField, productCopies);
        setSelectedProducts([]);
        setProductCopies({});
    };

    const generateBarcodeSheet = (productsData: any[], field: string, copiesMap: { [key: number]: number }) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) { toast.error(t('Unable to open print window')); return; }

        const barcodes = productsData.flatMap(product =>
            Array(copiesMap[product.id] || 1).fill(null).map(() => {
                let barcodeValue = product[field] || product.sku;
                if (field === 'name') {
                    barcodeValue = barcodeValue.replace(/[^A-Za-z0-9\s]/g, '').substring(0, 25);
                    if (barcodeValue.trim().length < 3) barcodeValue = `PRD${product.id}`;
                } else if (field === 'id') {
                    barcodeValue = `PRD${String(product.id).padStart(6, '0')}`;
                }
                return {
                    value: barcodeValue,
                    name: product.name,
                    formattedPrice: window.appSettings.formatCurrency(product.selling_price || 0),
                };
            })
        );

        printWindow.document.write(buildPrintHtml(barcodes, { isTest: false }));
        printWindow.document.close();

        // Close the popup after print dialog is dismissed
        printWindow.onafterprint = () => printWindow.close();
        // Fallback: poll from opener — close when popup regains focus after print dialog
        const pollClose = setInterval(() => {
            if (!printWindow || printWindow.closed) { clearInterval(pollClose); return; }
            try {
                if (printWindow.document.readyState === 'complete') {
                    printWindow.onafterprint = () => { clearInterval(pollClose); printWindow.close(); };
                }
            } catch { clearInterval(pollClose); }
        }, 500);

        toast.success(t('Barcode sheet generated'));
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Product Management'), href: route('products.index') },
        { title: t('Barcode Print') }
    ];

    const previewCols = parseInt(columnsPerRow);

    return (
        <PageTemplate title={t("Barcode Print")} url="/barcode-print" breadcrumbs={breadcrumbs} description={t('Generate and print barcodes for products.')}>
            <style>{`
                main {
                    max-width: 100vw;
                    overflow-x: hidden !important;
                }
                body {
                    overflow-x: hidden !important;
                }
            `}</style>
            <div className="space-y-6">

                {/* Settings Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center">
                                <Settings className="h-5 w-5 mr-2" />
                                <span className="text-sm sm:text-base">{t('Barcode Settings')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleTestPrint}>
                                    <FlaskConical className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">{t('Test Print')}</span>
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleResetSettings}>
                                    <RotateCcw className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">{t('Reset')}</span>
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label>{t('Barcode Field')}</Label>
                                <Select value={barcodeField} onValueChange={setBarcodeField}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sku">{t('SKU')}</SelectItem>
                                        <SelectItem value="name">{t('Product Name')}</SelectItem>
                                        <SelectItem value="id">{t('Product ID')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('Columns Per Row')}</Label>
                                <Select value={columnsPerRow} onValueChange={setColumnsPerRow}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                        <SelectItem value="3">3</SelectItem>
                                        <SelectItem value="4">4</SelectItem>
                                        <SelectItem value="5">5</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('Paper Size')}</Label>
                                <Select value={paperSize} onValueChange={setPaperSize}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A4">A4 (210 × 297mm)</SelectItem>
                                        <SelectItem value="A5">A5 (148 × 210mm)</SelectItem>
                                        <SelectItem value="A6">A6 (105 × 148mm)</SelectItem>
                                        <SelectItem value="Letter">Letter (216 × 279mm)</SelectItem>
                                        <SelectItem value="Legal">Legal (216 × 356mm)</SelectItem>
                                        <SelectItem value="Thermal">Thermal (80mm)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('Barcode Width')} <span className="text-muted-foreground text-xs">({t('bar thickness')} 1–4)</span></Label>
                                <Input
                                    type="number" min={1} max={4} step={0.5}
                                    value={barcodeWidthInput}
                                    onChange={(e) => {
                                        setBarcodeWidthInput(e.target.value);
                                        if (barcodeWidthDebounceRef.current) clearTimeout(barcodeWidthDebounceRef.current);
                                        barcodeWidthDebounceRef.current = setTimeout(() => {
                                            const v = Number(e.target.value);
                                            if (v >= 1 && v <= 4) setBarcodeWidth(v);
                                        }, 600);
                                    }}
                                    onBlur={(e) => {
                                        if (barcodeWidthDebounceRef.current) clearTimeout(barcodeWidthDebounceRef.current);
                                        const clamped = Math.min(4, Math.max(1, Number(e.target.value) || 2));
                                        setBarcodeWidth(clamped);
                                        setBarcodeWidthInput(String(clamped));
                                    }}
                                />
                            </div>
                            <div>
                                <Label>{t('Barcode Height')} <span className="text-muted-foreground text-xs">(px, 20–120)</span></Label>
                                <Input
                                    type="number" min={20} max={120} step={5}
                                    value={barcodeHeightInput}
                                    onChange={(e) => {
                                        setBarcodeHeightInput(e.target.value);
                                        if (barcodeHeightDebounceRef.current) clearTimeout(barcodeHeightDebounceRef.current);
                                        barcodeHeightDebounceRef.current = setTimeout(() => {
                                            const v = Number(e.target.value);
                                            if (v >= 20 && v <= 120) {
                                                setBarcodeHeight(v);
                                            } else if (v < 20) {
                                                setBarcodeHeight(20);
                                                setBarcodeHeightInput('20');
                                            } else if (v > 120) {
                                                setBarcodeHeight(120);
                                                setBarcodeHeightInput('120');
                                            }
                                        }, 600);
                                    }}
                                    onBlur={(e) => {
                                        if (barcodeHeightDebounceRef.current) clearTimeout(barcodeHeightDebounceRef.current);
                                        const clamped = Math.min(120, Math.max(20, Number(e.target.value) || 50));
                                        setBarcodeHeight(clamped);
                                        setBarcodeHeightInput(String(clamped));
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <Switch id="show-price" checked={showPrice} onCheckedChange={setShowPrice} />
                                <Label htmlFor="show-price" className="text-sm">{t('Show Price')}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="show-name" checked={showProductName} onCheckedChange={setShowProductName} />
                                <Label htmlFor="show-name" className="text-sm">{t('Show Product Name')}</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Bar */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="flex items-center gap-1.5">
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300">{selectedProducts.length}</span>
                            <span className="text-xs text-muted-foreground">{t('products selected')}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-300">{totalBarcodes}</span>
                            <span className="text-xs text-muted-foreground">{t('total barcodes')}</span>
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <Input
                                type="number" min="1" max="50"
                                placeholder={t('Copies')}
                                value={bulkCopies}
                                onChange={(e) => setBulkCopies(e.target.value)}
                                className="w-20 h-8 text-sm"
                            />
                            <Button variant="outline" size="sm" onClick={handleSetAllCopies}>
                                <CopyPlus className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('Set All')}</span>
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleClearSelection}>
                            <X className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">{t('Clear')}</span>
                        </Button>
                        <Button onClick={handlePrintBarcodes} size="sm" className="flex-1 sm:flex-none">
                            <Printer className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden xs:inline sm:inline">{t('Print Barcodes')}</span>
                            <span className="sm:hidden">{t('Print')}</span>
                            <span className="ml-1">({totalBarcodes})</span>
                        </Button>
                    </div>
                </div>

                {/* Products + Preview side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    {/* Left — Products Selection */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-2">
                                <div className="flex items-center">
                                    <QrCode className="h-5 w-5 mr-2 shrink-0" />
                                    <span className="text-sm sm:text-base">{t('Select Products')}</span>
                                    {selectedProducts.length > 0 && (
                                        <span className="ml-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300">{selectedProducts.length}</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:flex-none">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t('Search...')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 w-full sm:w-44"
                                        />
                                    </div>
                                    {categories.length > 0 && (
                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                            <SelectTrigger className="w-full sm:w-36">
                                                <SelectValue placeholder={t('All Categories')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Categories')}</SelectItem>
                                                {categories.map((cat: any) => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </CardTitle>
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t mt-2">
                                <p className="text-sm text-muted-foreground">
                                    {t('Showing')} <span className="font-medium text-foreground">{filteredProducts?.length || 0}</span> {t('of')} <span className="font-medium text-foreground">{products?.data?.length || 0}</span> {t('products')}
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <Checkbox
                                            id="select-all"
                                            checked={filteredProducts?.length > 0 && filteredProducts.every((p: any) => selectedProducts.includes(p.id))}
                                            onCheckedChange={handleSelectAll}
                                        />
                                        <Label htmlFor="select-all" className="text-sm cursor-pointer">{t('Select All')}</Label>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredProducts?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Search className="h-10 w-10 mb-3 opacity-30" />
                                    <p className="text-sm">{t('No products found')}</p>
                                    {(searchTerm || selectedCategory !== 'all') && (
                                        <Button variant="link" size="sm" className="mt-1" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
                                            {t('Clear filters')}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 max-h-[520px] overflow-y-auto pr-1">
                                    {filteredProducts?.map((product: any) => {
                                        const isSelected = selectedProducts.includes(product.id);
                                        return (
                                            <div
                                                key={product.id}
                                                className={`flex flex-col gap-2 p-3 border rounded-lg transition-all cursor-pointer ${
                                                    isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/40 hover:border-muted-foreground/30'
                                                }`}
                                                onClick={() => handleProductSelect(product.id, !isSelected)}
                                            >
                                                {/* Top row: checkbox + image + info + copies (lg+) */}
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        id={`product-${product.id}`}
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="w-10 h-10 rounded-md border overflow-hidden bg-muted shrink-0">
                                                        {product.image ? (
                                                            <img
                                                                src={window.appSettings.getImageUrl(product.image)}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <QrCode className="h-4 w-4 text-muted-foreground opacity-40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <Label htmlFor={`product-${product.id}`} className="font-medium cursor-pointer leading-tight line-clamp-1 block">
                                                            {product.name}
                                                        </Label>
                                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                            <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                                                            {product.category && (
                                                                <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300">{product.category.name}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-green-600 font-semibold mt-1 block font-mono">
                                                            {window.appSettings.formatCurrency(product.selling_price || 0)}
                                                        </span>
                                                    </div>
                                                    {/* Copies — right side on lg+ screens only */}
                                                    {isSelected && (
                                                        <div className="hidden lg:flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                            <Label className="text-xs text-muted-foreground whitespace-nowrap">{t('Copies')}:</Label>
                                                            <Input
                                                                type="number" min="1" max="50"
                                                                value={productCopies[product.id] || ''}
                                                                onChange={(e) => setProductCopies({ ...productCopies, [product.id]: Number(e.target.value) || 1 })}
                                                                className="h-7 text-sm w-16"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Copies — full-width bottom row below lg */}
                                                {isSelected && (
                                                    <div className="flex lg:hidden items-center gap-2 pl-9" onClick={(e) => e.stopPropagation()}>
                                                        <Label className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{t('Copies')}:</Label>
                                                        <Input
                                                            type="number" min="1" max="50"
                                                            value={productCopies[product.id] || ''}
                                                            onChange={(e) => setProductCopies({ ...productCopies, [product.id]: Number(e.target.value) || 1 })}
                                                            className="h-8 text-sm flex-1"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right — Live Preview */}
                    <Card className="sticky top-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Eye className="h-5 w-5 mr-2" />
                                    {t('Live Preview')}
                                </div>
                                {previewBarcodes.length > 0 && (
                                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300">{previewBarcodes.length} {t('labels')}</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {previewBarcodes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <QrCode className="h-12 w-12 mb-3 opacity-20" />
                                    <p className="text-sm font-medium">{t('No products selected')}</p>
                                    <p className="text-xs mt-1 opacity-70">{t('Select products to see live barcode preview')}</p>
                                </div>
                            ) : (
                                <div className="max-h-[580px] overflow-y-auto pr-1">
                                    {/* Paper preview wrapper */}
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <div className="bg-white rounded shadow-sm p-3 overflow-x-auto">
                                            <div
                                                className="grid gap-2"
                                                style={{ gridTemplateColumns: `repeat(${previewCols}, minmax(80px, 1fr))` }}
                                            >
                                                {previewBarcodes.map((barcode, index) => (
                                                    <BarcodePreviewItem
                                                        key={index}
                                                        value={barcode.value}
                                                        name={barcode.name}
                                                        price={barcode.price}
                                                        showName={showProductName}
                                                        showPrice={showPrice}
                                                        barcodeType={barcodeType}
                                                        barcodeWidth={barcodeWidth}
                                                        barcodeHeight={barcodeHeight}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        {t('Preview reflects current settings')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
}
