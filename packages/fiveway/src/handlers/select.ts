import { type NavigationHandler } from "../handler.js";
import { describeHandler } from "../introspection.js";

/**
 * @category Handler
 */
function createSelectHandler(onSelect: () => void) {
  const selectHandler: NavigationHandler = (_, action, next) => {
    if (import.meta.env.DEV) {
      describeHandler(action, { name: "core:select" });
    }

    if (action.kind === "select") {
      onSelect();
      return null;
    }

    return next();
  };

  return selectHandler;
}

export { createSelectHandler as selectHandler };
