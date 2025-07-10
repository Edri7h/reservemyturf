// import { v4 as uuidv4 } from "uuid";

// export const generateTicketCode = (): string => {
//   const shortId = uuidv4().split("-")[0].toUpperCase(); // e.g., "F3A4D1"
//   return `TURF-${shortId}`;
// };
export const generateTicketCode = (): string => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TURF-${random}`;
};
