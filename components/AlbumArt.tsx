import Image from 'next/image'

type Props = {
  src: string
  alt: string
  spotifyUrl: string
}

export default function AlbumArt({ src, alt, spotifyUrl }: Props) {
  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-[0.99]"
    >
      <Image
        src={src}
        alt={alt}
        width={375}
        height={375}
        className="object-cover cursor-pointer"
        priority
      />
    </a>
  )
}
