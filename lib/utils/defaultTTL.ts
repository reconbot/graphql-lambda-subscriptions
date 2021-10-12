/**
 * Three hours from now
 */
export const defaultTTL = (hours = 3): number => Math.floor(Date.now() / 1000) + (hours * 60 * 60)
