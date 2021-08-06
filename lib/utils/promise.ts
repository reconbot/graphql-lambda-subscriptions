/* eslint-disable @typescript-eslint/ban-types */
export const promisify = async <T extends Function>(arg: T) => await arg()
