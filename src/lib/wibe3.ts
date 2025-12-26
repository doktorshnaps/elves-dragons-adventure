// HotConnector (wibe3) initialization
// @hot-labs/kit - multichain wallet SDK
// Using dynamic require to avoid TypeScript circular dependency issues

// eslint-disable-next-line @typescript-eslint/no-var-requires
let HotConnectorClass: any = null;
let wibe3Instance: any = null;

export async function initWibe3() {
  if (wibe3Instance) return wibe3Instance;
  
  try {
    // Dynamic import to avoid TypeScript stack overflow
    const kit = await import('@hot-labs/kit');
    HotConnectorClass = kit.HotConnector;
    
    wibe3Instance = new HotConnectorClass({
      apiKey: '',
      walletConnect: {
        projectId: '1292473190ce7eb75c9de67e15aaad99',
      },
      defaultConnectors: true,
    });
    
    return wibe3Instance;
  } catch (error) {
    console.error('Failed to initialize HotConnector:', error);
    throw error;
  }
}

export function getWibe3() {
  return wibe3Instance;
}
