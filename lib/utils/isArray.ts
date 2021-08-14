export const isArray = <T, B>(input: T | readonly B[]): input is readonly B[] => Array.isArray(input)
