import { useCallback, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";

type Estado = "checando" | "bloqueado" | "desbloqueado";

/**
 * Bloqueio biométrico (Face ID / Touch ID / impressão). Protege a sessão já
 * autenticada por uma camada local no cold start. Se o aparelho não tiver
 * hardware ou nenhuma biometria cadastrada, não bloqueia (desbloqueado direto)
 * — nunca tranca o usuário para fora.
 */
export function useBiometricLock() {
  const [estado, setEstado] = useState<Estado>("checando");

  const desbloquear = useCallback(async () => {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: "Desbloquear o Rise",
      fallbackLabel: "Usar senha do aparelho",
    });
    if (r.success) setEstado("desbloqueado");
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const temHardware = await LocalAuthentication.hasHardwareAsync();
      const cadastrada = await LocalAuthentication.isEnrolledAsync();
      if (!vivo) return;
      if (!temHardware || !cadastrada) {
        setEstado("desbloqueado");
        return;
      }
      setEstado("bloqueado");
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: "Desbloquear o Rise",
        fallbackLabel: "Usar senha do aparelho",
      });
      if (vivo && r.success) setEstado("desbloqueado");
    })();
    return () => {
      vivo = false;
    };
  }, []);

  return { estado, desbloquear };
}
