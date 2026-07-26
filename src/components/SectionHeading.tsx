interface SectionHeadingProps {
  label: string;
  headline?: readonly string[] | string;
  id: string;
  align?: "left" | "right";
}

export function SectionHeading({
  label,
  headline,
  id,
  align = "left",
}: SectionHeadingProps) {
  return (
    <header className={`section-heading section-heading--${align}`}>
      <p className="section-kicker">{label}</p>
      {headline ? (
        <h2 id={id}>
          {(Array.isArray(headline) ? headline : [headline]).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
      ) : null}
    </header>
  );
}
