import { useCallback } from "react";
import * as Haptics from "expo-haptics";

/**
 * Feedback tátil padronizado. `toque` para ações comuns, `sucesso` para
 * recompensas (XP/level-up), `erro` para falhas. Encapsula para trocar a
 * intensidade num só lugar e permitir mutar por preferência no futuro.
 */
export function useHaptics() {
  const toque = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  const impacto = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);
  const sucesso = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  const erro = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);
  return { toque, impacto, sucesso, erro };
}
