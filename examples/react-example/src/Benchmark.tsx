import { verticalHandler } from "@fiveway/core";
import { NavigationItem, useNavigationContainer } from "@fiveway/react";

const items = [...new Array(10)].map((_, i) => {
  return { id: `item-${i + 1}`, order: i, label: `Item ${i + 1}` };
});

export function Items(props: { id: string; order: number; depth: number }) {
  const nav = useNavigationContainer({
    id: props.id,
    order: props.order,
    handler: verticalHandler,
  });

  if (props.depth === 0) {
    return (
      <div>
        <nav.Context>
          {items.map((item) => (
            <NavigationItem key={item.id} id={item.id} order={item.order}>
              {(node) => (
                <div>
                  {item.label} {node.isFocused() ? "(focused)" : ""}
                </div>
              )}
            </NavigationItem>
          ))}
        </nav.Context>
      </div>
    );
  }

  return (
    <div>
      <nav.Context>
        {items.map((item) => (
          <Items id={item.id} order={item.order} depth={props.depth - 1} />
        ))}
      </nav.Context>
    </div>
  );
}
