import type { SVGProps } from 'react';

type EditorialSvgProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  /**
   * Supplying a title promotes the visual from decorative artwork to a labelled
   * image. Visuals without a title are hidden from assistive technology.
   */
  title?: string;
  /**
   * Force a labelled visual to remain decorative when the surrounding copy
   * already communicates the same information.
   */
  decorative?: boolean;
};

type HandArrowProps = EditorialSvgProps & {
  direction?: 'up' | 'right' | 'down' | 'left';
  label?: string;
};

type StampProps = EditorialSvgProps & {
  label?: string;
  sublabel?: string;
  shape?: 'rectangle' | 'circle';
};

const palette = {
  paper: 'var(--visual-paper, var(--color-paper, #f2efe6))',
  ink: 'var(--visual-ink, var(--color-ink, #111111))',
  blue: 'var(--visual-blue, var(--color-blue, #1257ff))',
  aqua: 'var(--visual-aqua, var(--color-aqua, #64f4dc))',
  acid: 'var(--visual-acid, var(--color-acid, #e8ff45))',
  red: 'var(--visual-red, var(--color-red, #ff4d2e))',
};

function svgAccessibility(title?: string, decorative?: boolean) {
  const isDecorative = decorative ?? !title;

  return isDecorative
    ? ({ 'aria-hidden': true } as const)
    : ({ 'aria-label': title, role: 'img' } as const);
}

function VisualTitle({
  title,
  decorative,
}: Pick<EditorialSvgProps, 'title' | 'decorative'>) {
  const isDecorative = decorative ?? !title;

  return isDecorative ? null : <title>{title}</title>;
}

/**
 * A hand-plotted field map: pitch, positions and a wagon wheel. Embedded words
 * are intentionally redundant with the tab copy, so the visual is decorative
 * unless a title is supplied.
 */
export function CricketVisual({
  className,
  title,
  decorative,
  ...props
}: EditorialSvgProps) {
  const a11y = svgAccessibility(title, decorative);

  return (
    <svg
      {...props}
      {...a11y}
      className={className}
      focusable="false"
      viewBox="0 0 720 520"
      xmlns="http://www.w3.org/2000/svg"
    >
      <VisualTitle title={title} decorative={decorative} />
      <rect
        className="editorial-visual__paper"
        x="8"
        y="8"
        width="704"
        height="504"
        fill={palette.paper}
        stroke={palette.ink}
        strokeWidth="8"
      />
      <path
        className="editorial-visual__scribble"
        d="M93 266C98 138 206 55 358 53C524 51 630 141 629 264C628 392 522 468 359 469C203 470 88 389 93 266Z"
        fill="none"
        stroke={palette.ink}
        strokeWidth="5"
        strokeDasharray="4 9 22 7"
        strokeLinecap="round"
      />
      <path
        d="M111 260C111 147 220 77 359 77C498 77 609 149 609 262C609 375 499 445 360 445C218 445 111 374 111 260Z"
        fill={palette.aqua}
        fillOpacity=".3"
        stroke={palette.ink}
        strokeWidth="3"
      />
      <path
        d="M132 259H589M359 79V445"
        fill="none"
        stroke={palette.ink}
        strokeWidth="2"
        strokeDasharray="8 9"
        opacity=".5"
      />
      <rect
        className="editorial-visual__pitch"
        x="329"
        y="165"
        width="62"
        height="190"
        fill={palette.acid}
        stroke={palette.ink}
        strokeWidth="4"
      />
      <path
        d="M329 190H391M329 330H391M338 174V201M349 174V201M360 174V201M371 174V201M382 174V201M338 319V346M349 319V346M360 319V346M371 319V346M382 319V346"
        fill="none"
        stroke={palette.ink}
        strokeWidth="2.5"
      />

      <g
        className="editorial-visual__wagon-wheel"
        fill="none"
        stroke={palette.red}
        strokeLinecap="round"
      >
        <path d="M360 260C304 237 247 205 198 148" strokeWidth="5" />
        <path d="M360 260C407 220 466 179 531 147" strokeWidth="3" />
        <path d="M360 260C435 259 504 272 568 309" strokeWidth="6" />
        <path d="M360 260C327 315 287 358 230 394" strokeWidth="4" />
        <path d="M360 260C389 315 427 367 489 400" strokeWidth="2.5" />
        <path d="M360 260C305 266 241 289 165 328" strokeWidth="3" />
      </g>
      <circle cx="360" cy="260" r="13" fill={palette.blue} stroke={palette.ink} strokeWidth="4" />

      <g className="editorial-visual__fielders" fill={palette.ink}>
        <circle cx="210" cy="189" r="7" />
        <circle cx="278" cy="113" r="7" />
        <circle cx="464" cy="112" r="7" />
        <circle cx="531" cy="213" r="7" />
        <circle cx="545" cy="364" r="7" />
        <circle cx="422" cy="413" r="7" />
        <circle cx="255" cy="403" r="7" />
        <circle cx="160" cy="285" r="7" />
      </g>

      <g
        className="editorial-visual__labels"
        fill={palette.ink}
        fontFamily="var(--font-mono, monospace)"
        fontSize="18"
        fontWeight="700"
        letterSpacing="1.5"
      >
        <text x="34" y="48">FIELD / 01</text>
        <text x="152" y="136" transform="rotate(-12 152 136)">TIMING</text>
        <text x="487" y="126" transform="rotate(8 487 126)">RISK</text>
        <text x="502" y="421" transform="rotate(-5 502 421)">MOMENTUM</text>
        <text x="99" y="389" transform="rotate(6 99 389)">CONTEXT</text>
      </g>
      <path
        d="M618 57L681 57L681 123"
        fill="none"
        stroke={palette.blue}
        strokeWidth="9"
      />
      <text
        x="647"
        y="153"
        fill={palette.blue}
        fontFamily="var(--font-mono, monospace)"
        fontSize="14"
        fontWeight="700"
        textAnchor="middle"
      >
        4–5
      </text>
    </svg>
  );
}

/**
 * An intentionally non-actionable market dashboard: abstract candles, a
 * hand-drawn price line and a tiny watchlist.
 */
export function MarketsVisual({
  className,
  title,
  decorative,
  ...props
}: EditorialSvgProps) {
  const a11y = svgAccessibility(title, decorative);
  const candles = [
    [95, 285, 246, 310, 22, palette.ink],
    [135, 255, 220, 292, 24, palette.blue],
    [177, 231, 208, 275, 22, palette.blue],
    [217, 240, 214, 264, 24, palette.ink],
    [259, 202, 174, 238, 22, palette.blue],
    [301, 190, 167, 219, 24, palette.blue],
    [343, 203, 180, 235, 22, palette.ink],
    [385, 167, 136, 211, 24, palette.blue],
    [427, 147, 119, 184, 22, palette.blue],
    [469, 161, 132, 193, 24, palette.ink],
  ] as const;

  return (
    <svg
      {...props}
      {...a11y}
      className={className}
      focusable="false"
      viewBox="0 0 720 520"
      xmlns="http://www.w3.org/2000/svg"
    >
      <VisualTitle title={title} decorative={decorative} />
      <rect x="8" y="8" width="704" height="504" fill={palette.ink} stroke={palette.ink} strokeWidth="8" />
      <rect x="25" y="25" width="500" height="362" fill={palette.paper} />
      <rect x="541" y="25" width="154" height="362" fill={palette.aqua} />
      <rect x="25" y="403" width="670" height="92" fill={palette.acid} />

      <g stroke={palette.ink} strokeWidth="1" opacity=".25">
        <path d="M64 80H503M64 145H503M64 210H503M64 275H503M64 340H503" />
        <path d="M108 60V355M195 60V355M282 60V355M369 60V355M456 60V355" />
      </g>
      <path d="M64 56V355H505" fill="none" stroke={palette.ink} strokeWidth="4" />

      <g className="editorial-visual__candles">
        {candles.map(([x, bodyY, wickTop, wickBottom, bodyHeight, fill]) => (
          <g key={x}>
            <path d={`M${x + 10} ${wickTop}V${wickBottom}`} stroke={palette.ink} strokeWidth="3" />
            <rect
              x={x}
              y={bodyY}
              width="20"
              height={bodyHeight}
              fill={fill}
              stroke={palette.ink}
              strokeWidth="3"
            />
          </g>
        ))}
      </g>

      <path
        className="editorial-visual__market-line"
        d="M73 310L112 272L153 286L194 236L235 247L276 193L318 208L359 164L400 179L441 125L492 97"
        fill="none"
        stroke={palette.red}
        strokeWidth="7"
        strokeLinejoin="bevel"
      />
      <path d="M475 92L495 97L486 117" fill="none" stroke={palette.red} strokeWidth="7" />

      <g
        fill={palette.ink}
        fontFamily="var(--font-mono, monospace)"
        fontSize="14"
        fontWeight="700"
      >
        <text x="47" y="54">PERCEPTION / VALUE</text>
        <text x="558" y="56">WATCHLIST</text>
        <text x="558" y="102">SYSTEMS</text>
        <text x="658" y="102" textAnchor="end">+4.2</text>
        <path d="M558 114H680" stroke={palette.ink} strokeWidth="2" />
        <text x="558" y="148">PRICE</text>
        <text x="658" y="148" textAnchor="end">–1.1</text>
        <path d="M558 160H680" stroke={palette.ink} strokeWidth="2" />
        <text x="558" y="194">CONTEXT</text>
        <text x="658" y="194" textAnchor="end">↑</text>
        <path d="M558 206H680" stroke={palette.ink} strokeWidth="2" />
        <text x="558" y="240">NOISE</text>
        <text x="658" y="240" textAnchor="end">99%</text>
        <text x="558" y="345" fontSize="31">BULL?</text>
        <text x="558" y="373" fontSize="18">BEAR?</text>
        <text x="46" y="438" fontSize="18">EQUITY MARKETS</text>
        <text x="46" y="469" fontSize="24">NO F&amp;O HEROICS.</text>
        <text x="667" y="469" fontSize="16" textAnchor="end">NOT FINANCIAL ADVICE</text>
      </g>
    </svg>
  );
}

/**
 * A grown-up game HUD with chunky pixel geometry and a deliberately utilitarian
 * mission-complete readout.
 */
export function GamingVisual({
  className,
  title,
  decorative,
  ...props
}: EditorialSvgProps) {
  const a11y = svgAccessibility(title, decorative);

  return (
    <svg
      {...props}
      {...a11y}
      className={className}
      focusable="false"
      shapeRendering="crispEdges"
      viewBox="0 0 720 520"
      xmlns="http://www.w3.org/2000/svg"
    >
      <VisualTitle title={title} decorative={decorative} />
      <rect x="8" y="8" width="704" height="504" fill={palette.blue} stroke={palette.ink} strokeWidth="8" />
      <path d="M36 36H684V379H36Z" fill={palette.ink} />
      <path d="M55 55H665V360H55Z" fill={palette.paper} />

      <g className="editorial-visual__hud" fill={palette.ink} fontFamily="var(--font-mono, monospace)" fontWeight="700">
        <text x="78" y="92" fontSize="18">PLAYER_01</text>
        <text x="642" y="92" fontSize="18" textAnchor="end">XP 0088</text>
        <rect x="78" y="112" width="260" height="26" fill="none" stroke={palette.ink} strokeWidth="4" />
        <rect x="84" y="118" width="204" height="14" fill={palette.aqua} />
        <text x="78" y="166" fontSize="13">SYSTEMS THINKING</text>
        <text x="642" y="166" fontSize="13" textAnchor="end">DIFFICULTY: USEFUL</text>
      </g>

      <g className="editorial-visual__pixel-cursor" transform="translate(102 198)">
        <path
          d="M0 0H14V14H28V28H42V42H56V56H42V70H28V56H14V42H0Z"
          fill={palette.acid}
          stroke={palette.ink}
          strokeWidth="5"
        />
        <path d="M42 56L65 79" stroke={palette.ink} strokeWidth="10" />
      </g>

      <g transform="translate(226 198)">
        <rect width="366" height="114" fill={palette.aqua} stroke={palette.ink} strokeWidth="6" />
        <path d="M15 15H351V99H15Z" fill="none" stroke={palette.ink} strokeWidth="2" strokeDasharray="8 6" />
        <text
          x="183"
          y="49"
          fill={palette.ink}
          fontFamily="var(--font-mono, monospace)"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
        >
          MISSION COMPLETE
        </text>
        <text
          x="183"
          y="81"
          fill={palette.ink}
          fontFamily="var(--font-display, sans-serif)"
          fontSize="28"
          fontWeight="900"
          textAnchor="middle"
        >
          RANK: 1ST
        </text>
      </g>

      <g fill={palette.ink}>
        <rect x="80" y="331" width="18" height="18" />
        <rect x="104" y="331" width="18" height="18" />
        <rect x="128" y="331" width="18" height="18" />
        <rect x="152" y="331" width="18" height="18" fill={palette.red} />
      </g>
      <text
        x="636"
        y="343"
        fill={palette.ink}
        fontFamily="var(--font-mono, monospace)"
        fontSize="14"
        fontWeight="700"
        textAnchor="end"
      >
        NEXT QUEST: TEACHING ASSISTANT
      </text>

      <g className="editorial-visual__game-footer" fill={palette.ink}>
        <path d="M36 401H684V484H36Z" fill={palette.acid} />
        <path d="M57 423H77V443H57ZM77 443H97V463H77ZM97 423H117V443H97ZM77 403H97V423H77Z" />
        <text
          x="142"
          y="451"
          fontFamily="var(--font-mono, monospace)"
          fontSize="20"
          fontWeight="700"
        >
          RULES + FEEDBACK + BEHAVIOUR
        </text>
      </g>
    </svg>
  );
}

/**
 * A prototype pipeline represented as terminal fragments and hard-edged
 * component boxes, ending in a corrected deployment state.
 */
export function CodingVisual({
  className,
  title,
  decorative,
  ...props
}: EditorialSvgProps) {
  const a11y = svgAccessibility(title, decorative);

  return (
    <svg
      {...props}
      {...a11y}
      className={className}
      focusable="false"
      viewBox="0 0 720 520"
      xmlns="http://www.w3.org/2000/svg"
    >
      <VisualTitle title={title} decorative={decorative} />
      <rect x="8" y="8" width="704" height="504" fill={palette.paper} stroke={palette.ink} strokeWidth="8" />
      <rect x="32" y="32" width="656" height="52" fill={palette.ink} />
      <circle cx="57" cy="58" r="8" fill={palette.red} />
      <circle cx="83" cy="58" r="8" fill={palette.acid} />
      <circle cx="109" cy="58" r="8" fill={palette.aqua} />
      <text
        x="660"
        y="64"
        fill={palette.paper}
        fontFamily="var(--font-mono, monospace)"
        fontSize="14"
        fontWeight="700"
        textAnchor="end"
      >
        PROTOTYPE.TSX
      </text>

      <g
        className="editorial-visual__code"
        fill={palette.ink}
        fontFamily="var(--font-mono, monospace)"
        fontSize="16"
      >
        <text x="52" y="124" fill={palette.blue}>01</text>
        <text x="88" y="124">&lt;Idea status="sentence" /&gt;</text>
        <text x="52" y="154" fill={palette.blue}>02</text>
        <text x="88" y="154">const prototype = build(idea);</text>
        <text x="52" y="184" fill={palette.blue}>03</text>
        <text x="88" y="184">prototype.test({"{"} realPeople: true {"}"});</text>
        <text x="52" y="214" fill={palette.blue}>04</text>
        <text x="88" y="214">ship(whatDeservesToExist);</text>
      </g>
      <path d="M86 231H483" stroke={palette.ink} strokeWidth="3" strokeDasharray="7 6" />

      <g className="editorial-visual__component-map">
        <rect x="52" y="265" width="135" height="75" fill={palette.aqua} stroke={palette.ink} strokeWidth="4" />
        <rect x="245" y="265" width="135" height="75" fill={palette.acid} stroke={palette.ink} strokeWidth="4" />
        <rect x="438" y="265" width="135" height="75" fill={palette.blue} stroke={palette.ink} strokeWidth="4" />
        <path d="M188 302H230M219 289L232 302L219 315M381 302H423M412 289L425 302L412 315" fill="none" stroke={palette.ink} strokeWidth="5" />
        <g
          fill={palette.ink}
          fontFamily="var(--font-mono, monospace)"
          fontSize="15"
          fontWeight="700"
          textAnchor="middle"
        >
          <text x="119" y="297">IDEA</text>
          <text x="119" y="320">.TXT</text>
          <text x="312" y="297">BUILD</text>
          <text x="312" y="320">.TSX</text>
          <text x="505" y="297" fill={palette.paper}>CLICK</text>
          <text x="505" y="320" fill={palette.paper}>.NOW</text>
        </g>
      </g>

      <g className="editorial-visual__status" fontFamily="var(--font-mono, monospace)" fontWeight="700">
        <text x="52" y="388" fill={palette.red} fontSize="18">ERROR: OVERTHINKING</text>
        <path d="M48 379L282 396" stroke={palette.ink} strokeWidth="6" />
        <text x="52" y="429" fill={palette.ink} fontSize="18">STATUS: SHIPPABLE</text>
        <rect x="438" y="372" width="222" height="76" fill={palette.ink} />
        <text x="549" y="418" fill={palette.acid} fontSize="24" textAnchor="middle">[ DEPLOY ]</text>
      </g>
      <path d="M51 476H661" stroke={palette.blue} strokeWidth="7" />
      <rect x="51" y="467" width="425" height="18" fill={palette.blue} />
      <rect x="476" y="467" width="12" height="18" fill={palette.ink} />
    </svg>
  );
}

/**
 * Deliberately empty contact sheet. Each frame is labelled as a future genuine
 * photograph, avoiding synthetic personal imagery.
 */
export function PhotographyVisual({
  className,
  title,
  decorative,
  ...props
}: EditorialSvgProps) {
  const a11y = svgAccessibility(title, decorative);
  const frames = [
    { x: 46, y: 90, width: 188, height: 142, index: '01', meta: '35MM / F4' },
    { x: 266, y: 90, width: 188, height: 142, index: '02', meta: '1/250 / ISO400' },
    { x: 486, y: 90, width: 188, height: 142, index: '03', meta: 'FRAME PENDING' },
    { x: 46, y: 280, width: 298, height: 166, index: '04', meta: 'NOTICE THE MOMENT' },
    { x: 376, y: 280, width: 298, height: 166, index: '05', meta: 'REAL PHOTO ONLY' },
  ];

  return (
    <svg
      {...props}
      {...a11y}
      className={className}
      focusable="false"
      viewBox="0 0 720 520"
      xmlns="http://www.w3.org/2000/svg"
    >
      <VisualTitle title={title} decorative={decorative} />
      <rect x="8" y="8" width="704" height="504" fill={palette.ink} stroke={palette.ink} strokeWidth="8" />
      <path d="M31 31H689V489H31Z" fill={palette.paper} />
      <g fill={palette.ink} fontFamily="var(--font-mono, monospace)" fontWeight="700">
        <text x="47" y="64" fontSize="18">ATOM_CONTACT_SHEET / 001</text>
        <text x="672" y="64" fontSize="14" textAnchor="end">UNEXPOSED</text>
      </g>

      {frames.map(({ x, y, width, height, index, meta }) => (
        <g className="editorial-visual__contact-frame" key={index}>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="none"
            stroke={palette.ink}
            strokeWidth="4"
          />
          <path
            d={`M${x + 12} ${y + 12}h26M${x + 12} ${y + 12}v26M${x + width - 12} ${y + 12}h-26M${x + width - 12} ${y + 12}v26M${x + 12} ${y + height - 12}h26M${x + 12} ${y + height - 12}v-26M${x + width - 12} ${y + height - 12}h-26M${x + width - 12} ${y + height - 12}v-26`}
            fill="none"
            stroke={palette.blue}
            strokeWidth="2"
          />
          <circle
            cx={x + width / 2}
            cy={y + height / 2 - 8}
            r="15"
            fill="none"
            stroke={palette.ink}
            strokeWidth="3"
          />
          <path
            d={`M${x + width / 2 - 24} ${y + height / 2 + 20}h48`}
            stroke={palette.ink}
            strokeWidth="3"
          />
          <text
            x={x + 10}
            y={y + height + 20}
            fill={palette.ink}
            fontFamily="var(--font-mono, monospace)"
            fontSize="12"
            fontWeight="700"
          >
            {index} / {meta}
          </text>
        </g>
      ))}
      <path d="M20 81H42M35 70V92M678 81H700M685 70V92M20 461H42M35 450V472M678 461H700M685 450V472" stroke={palette.red} strokeWidth="3" />
    </svg>
  );
}

/**
 * Loose two-stroke annotation arrow. The outer SVG changes its viewBox for
 * vertical directions, so it remains easy to size with only a className.
 */
export function HandArrow({
  className,
  direction = 'right',
  label,
  title,
  decorative,
  ...props
}: HandArrowProps) {
  const a11y = svgAccessibility(title, decorative);
  const isVertical = direction === 'up' || direction === 'down';
  const isReverse = direction === 'left' || direction === 'up';
  const viewBox = isVertical ? '0 0 70 180' : '0 0 180 70';
  const transform = isVertical
    ? isReverse
      ? 'translate(70 180) rotate(180)'
      : undefined
    : isReverse
      ? 'translate(180 70) rotate(180)'
      : undefined;
  const shaft = isVertical
    ? 'M35 12C28 43 43 72 34 103C28 125 34 143 35 160'
    : 'M12 35C44 27 71 43 102 34C126 27 145 34 163 35';
  const head = isVertical ? 'M19 144L35 163L52 143' : 'M146 19L166 35L146 52';

  return (
    <svg
      {...props}
      {...a11y}
      className={className}
      focusable="false"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <VisualTitle title={title} decorative={decorative} />
      <g className="editorial-visual__hand-arrow" transform={transform}>
        <path d={shaft} fill="none" stroke={palette.ink} strokeWidth="7" strokeLinecap="round" />
        <path d={shaft} fill="none" stroke={palette.paper} strokeWidth="2" strokeLinecap="round" opacity=".65" />
        <path d={head} fill="none" stroke={palette.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {label ? (
        <text
          x={isVertical ? 9 : 13}
          y={isVertical ? 91 : 64}
          fill={palette.ink}
          fontFamily="var(--font-mono, monospace)"
          fontSize={isVertical ? 9 : 11}
          fontWeight="700"
          letterSpacing="1"
          transform={isVertical ? 'rotate(-90 9 91)' : undefined}
        >
          {label.toUpperCase()}
        </text>
      ) : null}
    </svg>
  );
}

/**
 * Reusable rough registration stamp for labels such as SHIPPED, PATCHING and
 * SIDE QUEST. Text remains live SVG text rather than a raster asset.
 */
export function Stamp({
  className,
  label = 'SIDE QUEST',
  sublabel,
  shape = 'rectangle',
  title,
  decorative,
  ...props
}: StampProps) {
  const a11y = svgAccessibility(title, decorative);
  const fontSize = label.length > 15 ? 20 : label.length > 10 ? 24 : 29;

  return (
    <svg
      {...props}
      {...a11y}
      className={className}
      focusable="false"
      viewBox="0 0 240 110"
      xmlns="http://www.w3.org/2000/svg"
    >
      <VisualTitle title={title} decorative={decorative} />
      {shape === 'circle' ? (
        <g className="editorial-visual__stamp-ring">
          <ellipse cx="120" cy="55" rx="102" ry="46" fill="none" stroke="currentColor" strokeWidth="7" />
          <ellipse cx="120" cy="55" rx="91" ry="36" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4" />
        </g>
      ) : (
        <g className="editorial-visual__stamp-frame">
          <path d="M14 16L226 10L231 94L19 101Z" fill="none" stroke="currentColor" strokeWidth="7" />
          <path d="M25 25L216 20L220 84L29 91Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 5" />
        </g>
      )}
      <text
        x="120"
        y={sublabel ? 54 : 65}
        fill="currentColor"
        fontFamily="var(--font-display, sans-serif)"
        fontSize={fontSize}
        fontWeight="900"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        {label.toUpperCase()}
      </text>
      {sublabel ? (
        <text
          x="120"
          y="78"
          fill="currentColor"
          fontFamily="var(--font-mono, monospace)"
          fontSize="11"
          fontWeight="700"
          letterSpacing="2"
          textAnchor="middle"
        >
          {sublabel.toUpperCase()}
        </text>
      ) : null}
      <path d="M42 30L61 28M177 86L203 83M25 69L43 68M197 35L222 33" stroke="currentColor" strokeWidth="3" opacity=".65" />
    </svg>
  );
}

/**
 * A lightweight code-authored texture. Use as an absolutely positioned layer;
 * pointer events are disabled inline so it never blocks interaction.
 */
export function TechnicalGrid({
  className,
  title,
  decorative = true,
  ...props
}: EditorialSvgProps) {
  const a11y = svgAccessibility(title, decorative);

  return (
    <svg
      {...props}
      {...a11y}
      className={className}
      focusable="false"
      preserveAspectRatio="none"
      style={{ pointerEvents: 'none', ...props.style }}
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
    >
      <VisualTitle title={title} decorative={decorative} />
      <g className="editorial-visual__technical-grid" fill="none" stroke="currentColor">
        <path
          d="M0 60H800M0 120H800M0 180H800M0 240H800M0 300H800M0 360H800M0 420H800M0 480H800M0 540H800M80 0V600M160 0V600M240 0V600M320 0V600M400 0V600M480 0V600M560 0V600M640 0V600M720 0V600"
          strokeWidth="1"
          opacity=".18"
        />
        <path d="M0 300H800M400 0V600" strokeWidth="2" opacity=".28" />
        <path d="M34 45H94M64 15V75M706 525H766M736 495V555" strokeWidth="3" opacity=".55" />
        <circle cx="400" cy="300" r="68" strokeWidth="2" strokeDasharray="7 9" opacity=".4" />
        <circle cx="400" cy="300" r="5" fill="currentColor" stroke="none" opacity=".65" />
      </g>
      <g
        fill="currentColor"
        fontFamily="var(--font-mono, monospace)"
        fontSize="10"
        fontWeight="700"
        opacity=".55"
      >
        <text x="14" y="18">X.00</text>
        <text x="742" y="592">Y.10</text>
        <text x="411" y="293">SYSTEM</text>
      </g>
    </svg>
  );
}

/**
 * Sparse screen-print dots for photocopy grain without a bitmap or SVG filter.
 */
export function HalftoneTexture({
  className,
  title,
  decorative = true,
  ...props
}: EditorialSvgProps) {
  const a11y = svgAccessibility(title, decorative);
  const dots = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 13 }, (_, column) => ({
      key: `${row}-${column}`,
      x: 18 + column * 32 + (row % 2) * 11,
      y: 16 + row * 31,
      radius: 1.5 + ((row * 5 + column * 3) % 5) * 0.72,
    })),
  ).flat();

  return (
    <svg
      {...props}
      {...a11y}
      className={className}
      focusable="false"
      preserveAspectRatio="none"
      style={{ pointerEvents: 'none', ...props.style }}
      viewBox="0 0 430 280"
      xmlns="http://www.w3.org/2000/svg"
    >
      <VisualTitle title={title} decorative={decorative} />
      <g className="editorial-visual__halftone" fill="currentColor">
        {dots.map((dot) => (
          <circle key={dot.key} cx={dot.x} cy={dot.y} r={dot.radius} opacity=".42" />
        ))}
      </g>
    </svg>
  );
}
