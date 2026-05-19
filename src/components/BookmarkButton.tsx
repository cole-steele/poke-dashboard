"use client";

import { useState, useTransition } from "react";
import { toggleBookmark } from "@/app/actions/bookmarks";
import styles from "./BookmarkButton.module.scss";

export default function BookmarkButton({
  pokemonName,
  initialBookmarked,
}: {
  pokemonName: string;
  initialBookmarked: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const optimistic = !bookmarked;
    setBookmarked(optimistic);
    startTransition(async () => {
      const confirmed = await toggleBookmark(pokemonName);
      setBookmarked(confirmed);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`${styles.btn} ${bookmarked ? styles.saved : ""}`}
      aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"}
    >
      {bookmarked ? "★ Saved" : "☆ Save"}
    </button>
  );
}
