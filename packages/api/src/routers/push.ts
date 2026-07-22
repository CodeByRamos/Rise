import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { pushSubscriptions } from "@rise/db";
import { router, protectedProcedure } from "../trpc";
import { vapidPublicKey } from "../lib/push";

/**
 * Inscrições Web Push (Sprint 6). O cliente pede a chave pública, assina no
 * navegador (PushManager) e registra aqui. Sem VAPID no ambiente, publicKey
 * retorna null e a UI esconde o recurso — app inteiro funciona sem push.
 */
export const pushRouter = router({
  /** Chave pública VAPID — null se push não configurado no servidor. */
  publicKey: protectedProcedure.query(() => ({ key: vapidPublicKey() })),

  /** Registra (ou re-registra) a inscrição deste navegador. */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url().max(1000),
        p256dh: z.string().min(1).max(300),
        auth: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Endpoint é único global: se trocou de dono (outro login no mesmo
        // navegador), reatribui — o navegador pertence a quem está logado.
        await ctx.db
          .insert(pushSubscriptions)
          .values({
            userId: ctx.userId,
            endpoint: input.endpoint,
            p256dh: input.p256dh,
            auth: input.auth,
          })
          .onConflictDoUpdate({
            target: pushSubscriptions.endpoint,
            set: { userId: ctx.userId, p256dh: input.p256dh, auth: input.auth },
          });
      } catch (e) {
        // FK de user_id: bootstrap ainda não criou o usuário de domínio.
        if (e instanceof Error && /foreign key|violates/i.test(e.message)) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Abra o app uma vez antes de ativar as notificações.",
          });
        }
        throw e;
      }
      return { ok: true as const };
    }),

  /** Remove a inscrição deste navegador. */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url().max(1000) }))
    .mutation(async ({ ctx, input }) => {
      // Filtra por dono: sem o userId no WHERE, qualquer usuário autenticado que
      // conheça o endpoint de outro poderia removê-lo (docs/18 §1.2).
      await ctx.db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.endpoint, input.endpoint),
            eq(pushSubscriptions.userId, ctx.userId),
          ),
        );
      return { ok: true as const };
    }),
});
