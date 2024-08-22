import { type NavigationHandler } from "../handler.js";
import { handlerInfo } from "../introspection.js";

/**
 * @category Handler
 */
function createSelectHandler(onSelect: () => void) {
  const selectHandler: NavigationHandler = (_, action, next) => {
    if (import.meta.env.DEV) {
      handlerInfo(action, { name: "core:select" });
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
