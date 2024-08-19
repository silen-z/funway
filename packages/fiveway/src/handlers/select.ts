import type { NavigationHandler } from "../handler.js";

/**
 * @category Handler
 */
function createSelectHandler(onSelect: () => void) {
  const selectHandler: NavigationHandler = (_, action, next) => {
    if (action.kind === "select") {
      onSelect();
      return null;
    }

    return next();
  };

  return selectHandler;
}

export { createSelectHandler as selectHandler };
