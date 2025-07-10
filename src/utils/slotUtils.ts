export const generateSlots = (open: string, close: string): string[] => {
  const slots: string[] = [];
  const startHour = parseInt(open.split(":")[0], 10);
  const endHour = parseInt(close.split(":")[0], 10);

  for (let hour = startHour; hour + 2 <= endHour; hour += 2) {
    const from = `${String(hour).padStart(2, "0")}:00`;
    const to = `${String(hour + 2).padStart(2, "0")}:00`;
    slots.push(`${from}–${to}`);
  }

  return slots;
};
