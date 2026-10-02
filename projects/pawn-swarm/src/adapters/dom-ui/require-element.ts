import { StartupError } from "../../startup-error";

/** Finds an element index.html must have, or fails startup naming the missing id. */
export function requireElement<T extends HTMLElement>(
  root: Document,
  id: string,
  type: new () => T,
): T {
  const element = root.getElementById(id);
  if (!(element instanceof type)) {
    throw new StartupError(`index.html is missing #${id}.`);
  }
  return element;
}
