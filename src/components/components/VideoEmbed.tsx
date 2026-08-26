type Props = { url?: string };

export default function VideoEmbed({ url }: Props) {
  if (!url) return null;
  const match = url.match(/(?:v=|\.be\/)([\w-]{11})/);
  const id = match?.[1];
  if (!id) {
    return (
      <div className="my-6">
        <a className="underline" href={url} target="_blank">Ver vídeo</a>
      </div>
    );
  }
  const embed = `https://www.youtube.com/embed/${id}`;
  return (
    <div className="w-full aspect-video my-6">
      <iframe
        className="w-full h-full rounded-xl"
        src={embed}
        title="Vídeo do evento"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen />
    </div>
  );
}
