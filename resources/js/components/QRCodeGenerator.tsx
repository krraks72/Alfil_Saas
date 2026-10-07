import React, { useEffect, useRef } from 'react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 128, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      import('qrcode').then((QRCode) => {
        QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).catch((err) => {

        });
      }).catch(() => {
        // Fallback if qrcode library is not available
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
          canvas.width = size;
          canvas.height = size;
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, size, size);
          ctx.fillStyle = '#666';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('QR Code', size/2, size/2);
        }
      });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} className={className} />;
};