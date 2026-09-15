import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import React from "react";
import { createRoot } from "react-dom/client";
import { Voucher, AgencyProfile, Company } from "../types";
import { VoucherPDFTemplate } from "../components/VoucherPDFTemplate";
import { imageUrlToBase64 } from "./assetInliner";

export interface GeneratePdfOptions {
  filename?: string;
  elementId?: string;
  voucher?: Voucher;
  agency?: AgencyProfile;
  company?: Company | null;
}

/**
 * Deterministic PDF Generator for Travel Vouchers.
 * Eliminates environmental discrepancies between AI Studio and Production (Render).
 * 
 * Key Architectural Guarantees:
 * 1. Fixed A4 canvas (794px width = exact 210mm at 96 DPI).
 * 2. Independent of viewport, window size, devicePixelRatio or theme.
 * 3. 100% self-contained standard CSS (no reliance on Tailwind v4 runtime or external stylesheets).
 * 4. Image assets converted to Base64 data URIs prior to canvas capture (no CORS/tainted canvas).
 * 5. Font loading verified before capture (document.fonts.ready).
 * 6. Explicit 2x pixel scale for high-definition, sharp vector-like print quality.
 */
export async function downloadVoucherPdf(options: GeneratePdfOptions = {}): Promise<boolean> {
  const {
    filename = "Voucher_Viagem.pdf",
    elementId = "voucher-print-area",
    voucher,
    agency,
    company
  } = options;

  try {
    // Strategy A: Dedicated Deterministic PDF Template (Primary & Recommended)
    if (voucher && agency) {
      return await generateFromDedicatedTemplate({
        voucher,
        agency,
        company,
        filename
      });
    }

    // Strategy B: Capture existing DOM element with fallback style injection
    const targetElement = document.getElementById(elementId);
    if (targetElement) {
      return await generateFromDomElement(targetElement, filename);
    }

    console.error(`Neither voucher data nor element with id "${elementId}" was found for PDF export.`);
    window.print();
    return false;
  } catch (err) {
    console.error("Erro fatal na geração do PDF, acionando fallback para impressão:", err);
    window.print();
    return false;
  }
}

/**
 * Inserts programmatic page breaks (spacers) so that no card or service block is split across A4 pages.
 * An A4 page at 794px width (standard 96 DPI A4) has height: 794 * (297 / 210) = 1122.94px.
 *
 * Professional Pagination Rules:
 * 1. Section Header + First Card Coupling: A section title (e.g. 🏨 HOSPEDAGEM) MUST NEVER be orphaned
 *    at the bottom of a page. If there is not enough space for the section header + first service card,
 *    the entire section moves to the next page.
 * 2. Service Card Protection: Individual service cards (hotel, car, flight, insurance, etc.) are atomic
 *    units and are never sliced across page boundaries.
 * 3. Document-order sequential evaluation: As each spacer is inserted, all subsequent elements naturally
 *    shift downward, ensuring 100% accurate measurement across all pages.
 */
function applySmartPageBreaks(container: HTMLElement, pageHeightPx = 1122.94) {
  // 1. Remove any previously inserted spacers
  const existingSpacers = container.querySelectorAll(".pdf-smart-spacer");
  existingSpacers.forEach((el) => el.remove());

  // 26px safety buffer before page boundary
  const SAFETY_BUFFER = 26;

  const getTop = (el: HTMLElement) => el.getBoundingClientRect().top - container.getBoundingClientRect().top;
  const getBottom = (el: HTMLElement) => el.getBoundingClientRect().bottom - container.getBoundingClientRect().top;

  const insertSpacer = (targetEl: HTMLElement, neededShift: number) => {
    if (neededShift <= 2) return;
    const parent = targetEl.parentElement;
    let rowGap = 0;
    if (parent) {
      const computed = window.getComputedStyle(parent);
      rowGap = parseFloat(computed.rowGap || computed.gap || "0") || 0;
    }
    const spacerHeight = Math.max(1, Math.ceil(neededShift - rowGap));
    const spacer = document.createElement("div");
    spacer.className = "pdf-smart-spacer";
    spacer.style.height = `${spacerHeight}px`;
    spacer.style.width = "100%";
    spacer.style.backgroundColor = "#ffffff";
    spacer.style.display = "block";
    spacer.style.margin = "0";
    spacer.style.padding = "0";
    spacer.style.border = "none";
    targetEl.parentNode?.insertBefore(spacer, targetEl);
  };

  // Find the primary content wrapper
  const contentWrapper =
    container.querySelector<HTMLElement>(".voucher-pdf-content") ||
    container.querySelector<HTMLElement>("#voucher-print-area") ||
    container;

  // Process all primary sections/blocks in strict top-to-bottom document order
  const primaryElements = Array.from(contentWrapper.children) as HTMLElement[];

  primaryElements.forEach((el) => {
    if (el.classList.contains("pdf-smart-spacer")) return;

    // Check if this element is a multi-card service section (Flights, Hotels, Cars, Insurances, etc.)
    const isSection =
      el.classList.contains("pdf-section") ||
      el.hasAttribute("data-pdf-section") ||
      Boolean(el.querySelector(".pdf-section-header, [data-pdf-section-header='true']"));

    if (isSection) {
      const header = el.querySelector<HTMLElement>(".pdf-section-header, [data-pdf-section-header='true']");
      const cards = Array.from(
        el.querySelectorAll<HTMLElement>(".pdf-card, [data-pdf-block='true']")
      );

      if (cards.length > 0) {
        // Rule 1: Section Header MUST stay together with Card 0 (Never leave orphan section titles!)
        const anchorEl = header || cards[0];
        const anchorTop = getTop(anchorEl);
        const card0Bottom = getBottom(cards[0]);

        const pageIndex = Math.floor(anchorTop / pageHeightPx);
        const pageBoundary = (pageIndex + 1) * pageHeightPx;

        // If header + card 0 cannot fit together on the current page, push the ENTIRE section to the next page!
        if (card0Bottom + SAFETY_BUFFER > pageBoundary) {
          const neededShift = pageBoundary - anchorTop;
          if (neededShift > 2) {
            insertSpacer(el, neededShift);
          }
        }

        // Rule 2: Subsequent Cards (Card 1, Card 2, ...) must each fit completely or move to next page
        for (let i = 1; i < cards.length; i++) {
          const card = cards[i];
          const cTop = getTop(card);
          const cBottom = getBottom(card);
          const cHeight = cBottom - cTop;

          const cPageIndex = Math.floor(cTop / pageHeightPx);
          const cPageBoundary = (cPageIndex + 1) * pageHeightPx;

          if (cBottom + SAFETY_BUFFER > cPageBoundary && cHeight < pageHeightPx - 60) {
            const neededShift = cPageBoundary - cTop;
            if (neededShift > 2) {
              insertSpacer(card, neededShift);
            }
          }
        }
        return;
      }
    }

    // Case B: Standalone atomic block (Header, Passengers, Financial Summary, Rules, Footer)
    const isAtomicBlock =
      el.hasAttribute("data-pdf-block") ||
      el.classList.contains("pdf-block-avoid") ||
      el.tagName === "HEADER" ||
      el.tagName === "FOOTER" ||
      el.tagName === "SECTION";

    if (isAtomicBlock) {
      const bTop = getTop(el);
      const bBottom = getBottom(el);
      const bHeight = bBottom - bTop;

      const pageIndex = Math.floor(bTop / pageHeightPx);
      const pageBoundary = (pageIndex + 1) * pageHeightPx;

      if (bBottom + SAFETY_BUFFER > pageBoundary && bHeight < pageHeightPx - 60) {
        const neededShift = pageBoundary - bTop;
        if (neededShift > 2) {
          insertSpacer(el, neededShift);
        }
      }
    }
  });
}

/**
 * Dedicated PDF Generation using the fixed-dimension VoucherPDFTemplate
 */
async function generateFromDedicatedTemplate({
  voucher,
  agency,
  company,
  filename
}: {
  voucher: Voucher;
  agency: AgencyProfile;
  company?: Company | null;
  filename: string;
}): Promise<boolean> {
  // 1. Convert remote image URLs to Base64 Data URIs to eliminate cross-origin issues
  const [agencyLogoBase64, companyLogoBase64] = await Promise.all([
    agency.logoUrl ? imageUrlToBase64(agency.logoUrl) : Promise.resolve(null),
    company?.logoUrl ? imageUrlToBase64(company.logoUrl) : Promise.resolve(null)
  ]);

  // 2. Ensure fonts are fully loaded
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-blocking font wait
    }
  }

  // 3. Create off-screen rendering stage with fixed A4 dimensions
  const stage = document.createElement("div");
  stage.id = "pdf-render-stage-" + Date.now();
  stage.style.position = "fixed";
  stage.style.left = "-9999px";
  stage.style.top = "0px";
  stage.style.width = "794px"; // Standard A4 width in pixels at 96 DPI
  stage.style.minHeight = "1123px"; // Standard A4 height in pixels
  stage.style.zIndex = "-9999";
  stage.style.backgroundColor = "#ffffff";
  stage.style.opacity = "1";
  stage.style.pointerEvents = "none";
  stage.style.overflow = "visible";
  document.body.appendChild(stage);

  const root = createRoot(stage);

  try {
    // 4. Render the dedicated PDF template
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(VoucherPDFTemplate, {
          voucher,
          agency,
          company,
          agencyLogoBase64: agencyLogoBase64 || agency.logoUrl,
          companyLogoBase64: companyLogoBase64 || company?.logoUrl
        })
      );
      // Wait for React commit and DOM paint
      setTimeout(resolve, 300);
    });

    // 5. Ensure all images inside the stage are completely loaded
    const imgElements = Array.from(stage.querySelectorAll("img"));
    if (imgElements.length > 0) {
      await Promise.all(
        imgElements.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((res) => {
            img.onload = () => res(null);
            img.onerror = () => res(null);
            setTimeout(() => res(null), 2500); // 2.5s safety timeout
          });
        })
      );
    }

    // Additional frame wait for layout stabilization
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 100));

    const renderTarget = (stage.firstElementChild as HTMLElement) || stage;

    // Apply smart page break calculation so blocks are never sliced across A4 pages
    applySmartPageBreaks(renderTarget);

    // 6. Capture stage using html2canvas with explicit fixed dimensions
    const canvas = await html2canvas(renderTarget, {
      scale: 2, // 2x high resolution: 1588px width for sharp typography
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
      logging: false
    });

    // 7. Assemble PDF using jsPDF (A4 Portrait)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pdfPageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    // Proportional height in mm
    const imgWidth = pdfPageWidth;
    const imgHeight = (canvas.height * pdfPageWidth) / canvas.width;

    const imgData = canvas.toDataURL("image/jpeg", 0.96);

    let heightLeft = imgHeight;
    let position = 0;

    // Page 1
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfPageHeight;

    // Subsequent pages if content overflows A4 height
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfPageHeight;
    }

    // 8. Download the PDF file directly to user's device
    pdf.save(filename);
    return true;
  } finally {
    // 9. Clean up offscreen stage
    try {
      root.unmount();
    } catch {
      // Ignore unmount errors
    }
    if (stage.parentNode) {
      stage.parentNode.removeChild(stage);
    }
  }
}

/**
 * Fallback DOM Element Capture with style assurance
 */
async function generateFromDomElement(element: HTMLElement, filename: string): Promise<boolean> {
  // Ensure fonts
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-blocking
    }
  }

  // Small delay for DOM paint
  await new Promise((resolve) => setTimeout(resolve, 400));

  // Apply smart page break calculation so blocks are never sliced across A4 pages
  applySmartPageBreaks(element);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0,
    logging: false
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  const imgData = canvas.toDataURL("image/jpeg", 0.96);

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pdfHeight;

  while (heightLeft > 5) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;
  }

  pdf.save(filename);
  return true;
}
