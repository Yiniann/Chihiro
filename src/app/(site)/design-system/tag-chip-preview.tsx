"use client";

import { useState } from "react";

export function TagChipPreview() {
  const [active, setActive] = useState(false);

  return (
    <button
      type="button"
      className="tag-chip"
      data-active={active}
      onClick={() => setActive((current) => !current)}
    >
      Typography
    </button>
  );
}
