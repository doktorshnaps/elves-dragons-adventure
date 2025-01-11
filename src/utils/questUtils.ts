export const updateQuestProgress = (questId: string, progress: number) => {
  const event = new CustomEvent('questProgress', {
    detail: { questId, progress }
  });
  window.dispatchEvent(event);
};