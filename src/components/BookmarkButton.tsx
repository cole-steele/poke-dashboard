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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const previous = bookmarked;
    const optimistic = !bookmarked;
    setBookmarked(optimistic);
    setError(null);
    startTransition(async () => {
      const result = await toggleBookmark(pokemonName);
      if (result.error) {
        setBookmarked(previous);
        setError(result.error);
        return;
      }
      setBookmarked(result.bookmarked);
    });
  }

  return (
    <div className={styles.wrapper}>
      <button
        onClick={handleClick}
        disabled={pending}
        className={`${styles.btn} ${bookmarked ? styles.saved : ""}`}
        aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"}
      >
        {pending ? "Saving..." : bookmarked ? "★ Saved" : "☆ Save"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
