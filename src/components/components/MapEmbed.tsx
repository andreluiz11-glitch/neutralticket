type Props = { value?: string };

export default function MapEmbed({ value }: Props) {
  if (!value) return null;

  const isIframe = value.trim().startsWith("<iframe");
  if (isIframe) {
    return (
      <div className="w-full h-[360px] my-6 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:rounded-xl"
        dangerouslySetInnerHTML={{ __html: value }} />
    );
  }

  try {
    new URL(value);
    return (
      <div className="my-6">
        <a className="underline" href={value} target="_blank">Abrir mapa</a>
      </div>
    );
  } catch {
    return null;
  }
}
