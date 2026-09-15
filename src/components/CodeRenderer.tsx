import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { QrCode as QrIcon, Barcode as BarcodeIcon } from "lucide-react";

interface CodeRendererProps {
  qrCodeData?: string;
  barcodeData?: string;
  barcodeType?: string;
  codeImageBase64?: string;
  title?: string;
  className?: string;
  compact?: boolean;
}

export const CodeRenderer: React.FC<CodeRendererProps> = ({
  qrCodeData,
  barcodeData,
  barcodeType = "CODE128",
  codeImageBase64,
  title,
  className = "",
  compact = false
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null);

  // Generate QR Code data URL
  useEffect(() => {
    if (qrCodeData) {
      QRCode.toDataURL(qrCodeData, {
        width: compact ? 96 : 140,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => {
          console.warn("Error generating QR Code:", err);
          setQrDataUrl(null);
        });
    } else {
      setQrDataUrl(null);
    }
  }, [qrCodeData, compact]);

  // Generate Barcode data URL via temporary offscreen canvas
  useEffect(() => {
    if (barcodeData) {
      try {
        const canvas = document.createElement("canvas");
        const format = barcodeType?.toUpperCase().includes("EAN")
          ? "EAN13"
          : barcodeType?.toUpperCase().includes("CODE39")
          ? "CODE39"
          : "CODE128";

        JsBarcode(canvas, barcodeData, {
          format,
          width: 1.5,
          height: compact ? 32 : 45,
          displayValue: true,
          fontSize: compact ? 9 : 11,
          font: "monospace",
          textMargin: 2,
          margin: 4,
          background: "#ffffff",
          lineColor: "#0f172a"
        });

        setBarcodeDataUrl(canvas.toDataURL("image/png"));
      } catch (err) {
        console.warn("Error generating Barcode with format:", barcodeType, err);
        // Fallback to basic Code128 or raw text
        try {
          const canvas = document.createElement("canvas");
          JsBarcode(canvas, barcodeData, {
            format: "CODE128",
            width: 1.5,
            height: compact ? 32 : 45,
            displayValue: true,
            fontSize: compact ? 9 : 11,
            margin: 4
          });
          setBarcodeDataUrl(canvas.toDataURL("image/png"));
        } catch (e) {
          setBarcodeDataUrl(null);
        }
      }
    } else {
      setBarcodeDataUrl(null);
    }
  }, [barcodeData, barcodeType, compact]);

  if (!codeImageBase64 && !qrDataUrl && !barcodeDataUrl && !qrCodeData && !barcodeData) {
    return null;
  }

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col items-center justify-center text-center shadow-2xs ${className}`}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: compact ? "6px 8px" : "8px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center"
      }}
    >
      {title && (
        <div
          className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "6px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          {qrCodeData || codeImageBase64 ? <QrIcon className="w-3 h-3 text-slate-700" style={{ width: "12px", height: "12px" }} /> : <BarcodeIcon className="w-3 h-3 text-slate-700" style={{ width: "12px", height: "12px" }} />}
          {title}
        </div>
      )}

      {/* Raw extracted code image if provided */}
      {codeImageBase64 && (
        <div
          className="p-1 bg-white rounded border border-slate-100"
          style={{ padding: "4px", backgroundColor: "#ffffff", borderRadius: "4px", border: "1px solid #f1f5f9" }}
        >
          <img
            src={codeImageBase64.startsWith("data:") ? codeImageBase64 : `data:image/png;base64,${codeImageBase64}`}
            alt="Código extraído do documento"
            className="max-h-24 max-w-full object-contain mx-auto"
            style={{ maxHeight: compact ? "60px" : "96px", maxWidth: "100%", objectFit: "contain", margin: "0 auto", display: "block" }}
          />
        </div>
      )}

      {/* Rendered Barcode */}
      {barcodeDataUrl && !codeImageBase64 && (
        <div
          className="p-1 bg-white rounded flex flex-col items-center"
          style={{ padding: "4px", backgroundColor: "#ffffff", borderRadius: "4px", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <img
            src={barcodeDataUrl}
            alt={`Código de barras: ${barcodeData}`}
            className="max-h-16 max-w-full object-contain mx-auto"
            style={{ maxHeight: compact ? "40px" : "60px", maxWidth: "100%", objectFit: "contain", margin: "0 auto", display: "block" }}
          />
        </div>
      )}

      {/* Rendered QR Code */}
      {qrDataUrl && !codeImageBase64 && (
        <div
          className="p-1 bg-white rounded flex flex-col items-center"
          style={{ padding: "4px", backgroundColor: "#ffffff", borderRadius: "4px", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <img
            src={qrDataUrl}
            alt="QR Code de validação do voucher"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto"
            style={{ width: compact ? "72px" : "96px", height: compact ? "72px" : "96px", objectFit: "contain", margin: "0 auto", display: "block" }}
          />
          {qrCodeData && !barcodeData && (
            <span
              className="text-[9px] font-mono text-slate-400 mt-1 max-w-[120px] truncate block"
              style={{ fontSize: "9px", fontFamily: "monospace", color: "#94a3b8", marginTop: "4px", display: "block" }}
            >
              {qrCodeData}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
