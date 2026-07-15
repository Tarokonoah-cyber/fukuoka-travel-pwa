import Image from "next/image";
import type { TripDayImage } from "@/types/trip";

export function TripDayPhoto({ image, eager = false }: { image: TripDayImage; eager?: boolean }) {
  return (
    <figure className="trip-day-photo">
      <Image
        src={image.src}
        alt={image.alt}
        width={1280}
        height={720}
        sizes="(max-width: 720px) calc(100vw - 36px), 684px"
        loading={eager ? "eager" : "lazy"}
        unoptimized
      />
      <figcaption>
        <strong>{image.caption}</strong>
        <span>
          照片：<a href={image.sourceHref} target="_blank" rel="noreferrer">{image.author}／來源</a>
          <span aria-hidden> · </span>
          <a href={image.licenseHref} target="_blank" rel="noreferrer">{image.licenseName}</a>
          <span aria-hidden> · </span>已裁切、縮放並轉為 WebP
        </span>
      </figcaption>
    </figure>
  );
}
