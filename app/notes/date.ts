const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatNoteDate(isoDate: string): string {
  return longDate.format(new Date(`${isoDate}T00:00:00Z`));
}
