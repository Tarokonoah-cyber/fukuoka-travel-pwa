"use client";

import { useRef, useState } from "react";
import type { ChecklistItemImage } from "@/types/shopping";
import type { ChecklistItemData } from "@/types/trip";

type ChecklistItemProps = {
  item: ChecklistItemData;
  image?: ChecklistItemImage;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onDelete?: () => void;
};

const thumbnailStyle = { width: 80, height: 80 } as const;
const enlargedImageStyle = { width: "100%", height: "auto" } as const;

export function ChecklistItem({ item, image, checked, disabled = false, onToggle, onDelete }: ChecklistItemProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const displayImage = image && imageFailed
    ? { ...image, src: image.fallbackSrc, alt: image.fallbackAlt, kind: "category" as const, statusLabel: "款式現場決定" }
    : image;

  function openImage() {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }

  function closeImage() {
    dialogRef.current?.close();
  }

  function handleImageError() {
    if (image && image.src !== image.fallbackSrc) setImageFailed(true);
  }

  return (
    <div className={displayImage ? "check-item-shell has-image" : "check-item-shell"}>
      {displayImage && (
        <button
          type="button"
          className="shopping-thumb"
          data-image-kind={displayImage.kind}
          aria-label={`放大查看 ${item.name} 圖片`}
          onClick={openImage}
        >
          {/* Fixed local PWA asset: keep the raw path so Serwist can serve it offline. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage.src}
            alt=""
            width={80}
            height={80}
            style={thumbnailStyle}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        </button>
      )}
      <div className={checked ? "check-item checked" : "check-item"}>
        <label className="check-toggle">
          <input
            type="checkbox"
            aria-label={item.name}
            checked={checked}
            disabled={disabled}
            onChange={onToggle}
          />
          <span className="check-box" aria-hidden>{checked ? "✓" : ""}</span>
        </label>
        <span className="check-copy">
          <strong>{item.name}</strong>
          {displayImage && <small className={`shopping-image-status ${displayImage.kind}`}>{displayImage.statusLabel}</small>}
          {item.note && <small>{item.note}</small>}
          {item.sourceUrl && (
            <a className="check-source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
              查看推薦來源（另開視窗）
            </a>
          )}
          {(item.price || item.location) && (
            <small>
              {typeof item.price === "number" ? `約 ¥${item.price.toLocaleString()}` : item.price}
              {item.price && item.location ? " · " : ""}
              {item.location}
            </small>
          )}
          {item.reason && <small>{item.area} · {item.reason}</small>}
          {(item.suitability || item.momFriendly) && (
            <small>
              {item.suitability && `適合 ${item.suitability}`}
              {item.suitability && item.momFriendly ? " · " : ""}
              {item.momFriendly && `媽媽友善 ${item.momFriendly}`}
            </small>
          )}
        </span>
        {item.important && <span className="important-tag">重要</span>}
      </div>
      {onDelete && <button type="button" className="check-item-delete" onClick={onDelete} aria-label={`刪除${item.name}`}>刪除</button>}
      {displayImage && (
        <dialog
          ref={dialogRef}
          className="shopping-image-dialog"
          aria-labelledby={`shopping-image-title-${item.id}`}
          onClick={(event) => { if (event.target === event.currentTarget) closeImage(); }}
        >
          <div className="shopping-image-dialog-card">
            <button type="button" className="shopping-image-close" onClick={closeImage} aria-label="關閉商品大圖">×</button>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage.src}
                alt={displayImage.alt}
                width={960}
                height={960}
                style={enlargedImageStyle}
                decoding="async"
                onError={handleImageError}
              />
              <figcaption>
                <strong id={`shopping-image-title-${item.id}`}>{item.name}</strong>
                <span>{displayImage.statusLabel}</span>
              </figcaption>
            </figure>
            {displayImage.sourceHref && displayImage.sourceName && (
              <a href={displayImage.sourceHref} target="_blank" rel="noreferrer">
                圖片來源：{displayImage.sourceName}
              </a>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
