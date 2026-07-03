/**
 * Avatar com moldura cosmética (frame). Foto do bucket público `avatars` ou
 * inicial do nome. Frame = anel em conic-gradient com as cores do item.
 */

export function publicAvatarUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/avatars/${path}`;
}

export function frameGradient(colors: string[] | undefined): string | null {
  if (!colors || colors.length === 0) return null;
  if (colors.length === 1) return colors[0]!;
  return `conic-gradient(${[...colors, colors[0]].join(", ")})`;
}

interface AvatarProps {
  nome: string;
  avatarPath?: string | null;
  frameColors?: string[] | null;
  size?: number;
}

export function Avatar({ nome, avatarPath, frameColors, size = 36 }: AvatarProps) {
  const url = publicAvatarUrl(avatarPath ?? null);
  const grad = frameGradient(frameColors ?? undefined);
  const inner = size - (grad ? 6 : 0);

  const nucleo = url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Avatar de ${nome}`}
      width={inner}
      height={inner}
      className="rounded-full object-cover"
      style={{ width: inner, height: inner }}
    />
  ) : (
    <span
      className="inline-flex items-center justify-center rounded-full bg-brand font-bold uppercase text-void"
      style={{ width: inner, height: inner, fontSize: inner * 0.42 }}
    >
      {nome.charAt(0)}
    </span>
  );

  if (!grad) return nucleo;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{ width: size, height: size, background: grad, padding: 3 }}
    >
      {nucleo}
    </span>
  );
}
