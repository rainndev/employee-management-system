// Radix Select rejects an empty-string item value, so optional selects submit
// this sentinel and the server actions normalise it back to "".
export const NONE_VALUE = "__none__";

export function optionalString(value: unknown): string {
  return value === NONE_VALUE ? "" : typeof value === "string" ? value : "";
}
