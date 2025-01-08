export const fixResizeObserverLoop = () => {
  const logger = window.console.error;
  window.console.error = (...args: any) => {
    if (
      args[0]?.message?.includes?.('ResizeObserver') || 
      args[0]?.includes?.('ResizeObserver')
    ) {
      return;
    }
    logger(...args);
  };
};