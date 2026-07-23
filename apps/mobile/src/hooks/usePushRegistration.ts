import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { trpc } from "../lib/trpc";

/**
 * Registra o dispositivo para push nativo (Expo) quando o usuário está logado.
 *
 * Fluxo: pede permissão → obtém ExponentPushToken → envia ao backend
 * (push.registerExpo). Best-effort: qualquer falha (sem device físico, sem
 * projectId EAS, permissão negada) é silenciosa — o app nunca quebra por push.
 * Só roda uma vez por sessão (ref guard).
 */
export function usePushRegistration(ativo: boolean) {
  const registrado = useRef(false);
  const registerExpo = trpc.push.registerExpo.useMutation();

  useEffect(() => {
    if (!ativo || registrado.current) return;
    registrado.current = true;

    (async () => {
      try {
        if (!Device.isDevice) return; // emulador não recebe push

        // Canal Android (obrigatório para heads-up).
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Rise",
            importance: Notifications.AndroidImportance.DEFAULT,
            lightColor: "#10b981",
          });
        }

        const perm = await Notifications.getPermissionsAsync();
        let status = perm.status;
        if (status !== "granted") {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== "granted") return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (!token) return;

        registerExpo.mutate({
          token,
          platform: Platform.OS === "ios" ? "ios" : "android",
        });
      } catch {
        // Best-effort — silencioso.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo]);
}
