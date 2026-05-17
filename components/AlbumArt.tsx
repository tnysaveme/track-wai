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
      className="block w-full max-w-[375px] transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-[0.99]"
    >
      <Image
        src={src}
        alt={alt}
        width={375}
        height={375}
        className="w-full h-auto object-cover cursor-pointer"
        sizes="(max-width: 440px) calc(100vw - 4rem), 375px"
        priority
      />
    </a>
  )
}
