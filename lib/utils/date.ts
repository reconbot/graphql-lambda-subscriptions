export const addHours = (date: Date, hours: number): Date => new Date(date.valueOf() + hours * 1000 * 60 * 60)
