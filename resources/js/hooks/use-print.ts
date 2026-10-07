import { useCallback } from 'react';

interface PrintOptions {
    paperSize?: 'thermal' | 'a4';
    margins?: string;
    orientation?: 'portrait' | 'landscape';
}

export const usePrint = () => {
    const printElement = useCallback((element: HTMLElement, options: PrintOptions = {}) => {
        const { paperSize = 'thermal', margins = '0', orientation = 'portrait' } = options;
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
            throw new Error('Unable to open print window. Please check popup blocker settings.');
        }

        // Get the element's HTML content
        const content = element.outerHTML;
        
        // Create print styles based on paper size
        const printStyles = paperSize === 'thermal' ? `
            <style>
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: ${margins};
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        line-height: 1.2;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .thermal-receipt {
                        width: 80mm !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 8px !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }
                body {
                    font-family: 'Courier New', monospace;
                    margin: 0;
                    padding: 20px;
                    background: white;
                }
            </style>
        ` : `
            <style>
                @media print {
                    @page {
                        size: A4 ${orientation};
                        margin: ${margins};
                    }
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        line-height: 1.4;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                }
            </style>
        `;

        // Write the HTML content to the print window
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Receipt</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                ${printStyles}
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };
    }, []);

    const printThermalReceipt = useCallback((element: HTMLElement) => {
        printElement(element, { 
            paperSize: 'thermal',
            margins: '0'
        });
    }, [printElement]);

    const printA4Receipt = useCallback((element: HTMLElement) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            throw new Error('Unable to open print window. Please check popup blocker settings.');
        }

        // Extract sale data from the thermal receipt element's data attributes or parse from DOM
        // We'll build a proper A4 layout from scratch using the thermal receipt content
        const thermalContent = element.innerHTML;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>A4 Receipt</title>
                <meta charset="utf-8">
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    @page {
                        size: A4 portrait;
                        margin: 15mm 15mm 15mm 15mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 13px;
                        line-height: 1.5;
                        color: #000;
                        background: white;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .a4-wrapper {
                        width: 100%;
                        max-width: 180mm;
                        margin: 0 auto;
                    }
                    /* Restyle the thermal receipt for A4 */
                    .thermal-receipt {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        font-family: Arial, sans-serif !important;
                        font-size: 13px !important;
                        line-height: 1.5 !important;
                        color: #000 !important;
                    }
                    .thermal-receipt div,
                    .thermal-receipt span {
                        font-family: Arial, sans-serif !important;
                        color: #000 !important;
                    }
                    /* Header section - center and larger */
                    .thermal-receipt > div:first-child {
                        text-align: center;
                        margin-bottom: 12px;
                        padding-bottom: 12px;
                        border-bottom: 2px solid #000;
                    }
                    .thermal-receipt > div:first-child > div:first-child {
                        font-size: 22px !important;
                        font-weight: bold !important;
                        margin-bottom: 4px;
                    }
                    /* Dashed separators */
                    .thermal-receipt [style*="dashed"] {
                        border-top: 1px dashed #999 !important;
                        margin: 10px 0 !important;
                    }
                    /* All flex rows */
                    .thermal-receipt [style*="display: flex"] {
                        display: flex !important;
                        justify-content: space-between !important;
                        margin-bottom: 4px !important;
                        font-size: 13px !important;
                    }
                    /* Total row */
                    .thermal-receipt [style*="font-weight: bold"][style*="font-size: 13px"],
                    .thermal-receipt [style*="fontWeight: bold"] {
                        font-size: 16px !important;
                        font-weight: bold !important;
                    }
                    /* Footer */
                    .thermal-receipt [style*="text-align: center"] {
                        text-align: center !important;
                        font-size: 12px !important;
                        margin-top: 8px !important;
                    }
                    @media print {
                        body { margin: 0; }
                        .a4-wrapper { max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="a4-wrapper">
                    ${thermalContent}
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 300);
        };
    }, []);

    return {
        printElement,
        printThermalReceipt,
        printA4Receipt
    };
};