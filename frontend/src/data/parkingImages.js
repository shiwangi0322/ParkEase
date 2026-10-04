/**
 * Maps known parking lot names to local public images for Explore cards.
 *
 * The first eleven known locations use each supplied image once. Additional
 * locations reuse the same local image set rather than showing a placeholder.
 */
export const parkingImages = {
  "TOPIWALA CENTER": "/parking/park1.png",
  "LODHA GOREGAON": "/parking/park2.png",
  "SAI ANAND": "/parking/park3.png",
  "CLUB AQUQRIA": "/parking/park4.png",
  "OBEROI SPEANDER": "/parking/park5.png",
  "ECONEST BUILDING": "/parking/park6.png",
  "JEEVAN SAPNA BUILDING": "/parking/park7.png",
  "CLUB AQUARIA": "/parking/park8.png",
  "DATTATRAY ANNEX": "/parking/park9.png",
  "RUNWAL DEVELOPERS": "/parking/park10.png",
  "ROMELL": "/parking/park11.png",
  "HUMA TALKIES PARKING LOT": "/parking/park1.png",
  "HI LIFE MALL": "/parking/park2.png",
  "FULERUM BUILDING": "/parking/park3.png",
  "MCGM PARKING LOT KALINA": "/parking/park4.png",
};

/**
 * Returns the image to show for a lot: a local photo from
 * `parkingImages` if one matches its name, otherwise a
 * reusable local image. Never requests a remote image.
 */
export function getParkingImage(lot) {
  if (!lot) return "/parking/park1.png";
  const lotName = String(lot.name || "").trim().toUpperCase();
  return parkingImages[lotName] ?? "/parking/park1.png";
}
