import type { ReactNode } from "react";

/** A museum wall label: the readable layer that sits over the scene. */
export function Panel({
  label,
  children,
  className = "",
  side = "left",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  side?: "left" | "right" | "center";
}) {
  return (
    <div className={`panel panel--${side} ${className}`} data-ui>
      {label ? <p className="kicker">{label}</p> : null}
      {children}
    </div>
  );
}

export function Station({
  station,
  id,
  labelledBy,
  className = "",
  children,
  as = "section",
}: {
  station: string;
  id?: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
  as?: "section" | "article" | "div";
}) {
  const Tag = as;
  return (
    <Tag id={id} data-station={station} className={`station ${className}`} aria-labelledby={labelledBy}>
      {children}
    </Tag>
  );
}

export function Lines({ lines, as: Tag = "span" }: { lines: readonly string[]; as?: "span" }) {
  return (
    <>
      {lines.map((line) => (
        <Tag key={line} className="line">
          {line}
        </Tag>
      ))}
    </>
  );
}
