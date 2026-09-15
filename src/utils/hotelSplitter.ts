import { HotelBooking } from "../types";

/**
 * Utility to detect and split any concatenated hotels (e.g. "Hotel A de 14 a 17, Hotel B de 17 a 18")
 * into distinct HotelBooking objects with separate dates, addresses, and confirmation codes.
 */
export function normalizeHotelsList(
  hotels?: HotelBooking[],
  singleHotel?: HotelBooking | null
): HotelBooking[] {
  const result: HotelBooking[] = [];
  const rawList: HotelBooking[] = [];

  if (Array.isArray(hotels) && hotels.length > 0) {
    rawList.push(...hotels);
  } else if (singleHotel && (singleHotel.hotelName || singleHotel.checkInDate || singleHotel.confirmationCode)) {
    rawList.push(singleHotel);
  }

  if (rawList.length === 0) return [];

  for (const item of rawList) {
    const name = (item.hotelName || "").trim();

    // Check if hotelName contains multiple hotels concatenated
    // e.g. "Hotel A de 14 a 17, Hotel B de 17 a 18" or "Hotel A ... Hotel B"
    const hasMultipleHotels =
      (name.includes(", Hotel ") || name.includes("; Hotel ") || name.includes("\nHotel ")) ||
      /\bhotel\b.*?\bhotel\b/i.test(name) ||
      (name.includes(",") && (name.includes(" de ") || name.includes(" - ")) && /\d{1,2}/.test(name));

    if (hasMultipleHotels) {
      // Split by common delimiters
      const segments = name.split(/(?:,|\;|\n|\/)\s*(?=[A-ZÀ-Ú][a-zà-ú]*\s+Hotel|Hotel\s+|Pousada\s+|Resort\s+)/i);
      
      if (segments.length > 1) {
        // Also split addresses if concatenated
        const addressParts = (item.address || "").split(/(?:;|\n|\|)\s*/);
        const codeParts = (item.confirmationCode || "").split(/(?:,|\;|\/|\s*\|\s*)/);

        segments.forEach((seg, idx) => {
          const trimmedSeg = seg.trim();
          if (!trimmedSeg) return;

          // Extract date pattern like "de 14 a 17" or "14/03 a 17/03"
          let cleanName = trimmedSeg;
          let checkIn = item.checkInDate || "";
          let checkOut = item.checkOutDate || "";

          const dateMatch = trimmedSeg.match(/(?:de\s+)?(\d{1,2}(?:\/\d{1,2}(?:\/\d{2,4})?)?)\s*(?:a|até|-)\s*(\d{1,2}(?:\/\d{1,2}(?:\/\d{2,4})?)?)/i);
          if (dateMatch) {
            checkIn = dateMatch[1];
            checkOut = dateMatch[2];
            cleanName = trimmedSeg.replace(dateMatch[0], "").replace(/\(\s*\)/g, "").trim();
          }

          result.push({
            id: `htl-${Date.now()}-${idx}`,
            hotelName: cleanName.replace(/^[,\s-]+|[,\s-]+$/g, "") || `Hotel #${idx + 1}`,
            address: addressParts[idx] ? addressParts[idx].trim() : (idx === 0 ? item.address : ""),
            city: item.city || "",
            checkInDate: checkIn,
            checkInTime: item.checkInTime || "14:00",
            checkOutDate: checkOut,
            checkOutTime: item.checkOutTime || "12:00",
            nights: item.nights,
            roomType: item.roomType || "Standard",
            roomCategory: item.roomCategory,
            mealPlan: item.mealPlan,
            confirmationCode: codeParts[idx] ? codeParts[idx].trim() : (idx === 0 ? item.confirmationCode : ""),
            guestsNames: item.guestsNames,
            qrCodeData: idx === 0 ? item.qrCodeData : undefined,
            barcodeData: idx === 0 ? item.barcodeData : undefined,
            barcodeType: item.barcodeType,
            codeImageBase64: idx === 0 ? item.codeImageBase64 : undefined,
            notes: item.notes
          });
        });
        continue;
      }
    }

    result.push({
      ...item,
      id: item.id || `htl-${Date.now()}-${result.length}`
    });
  }

  return result;
}
