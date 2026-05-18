/* SOMS UI kit — primitives. Mounts onto window so other scripts can use them. */

const SmButton = ({ variant = "primary", size, block, children, onClick, type = "button", style }) => {
  const cls = [
    "sm-btn",
    variant && `sm-btn--${variant}`,
    size === "lg" && "sm-btn--lg",
    block && "sm-btn--block",
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} onClick={onClick} type={type} style={style}>
      {children}
    </button>
  );
};

const SmInput = ({ value, onChange, placeholder, mono, type = "text", maxLength, style }) => (
  <input
    className={"sm-input" + (mono ? " sm-input--mono" : "")}
    value={value}
    onChange={(e) => onChange && onChange(e.target.value)}
    placeholder={placeholder}
    type={type}
    maxLength={maxLength}
    style={style}
  />
);

const SmLabel = ({ children }) => <span className="sm-label">{children}</span>;

const SmBadge = ({ variant, children, style }) => (
  <span className={"sm-badge" + (variant ? ` sm-badge--${variant}` : "")} style={style}>
    {children}
  </span>
);

const SmCard = ({ hero, children, className = "", style }) => (
  <div className={"sm-card" + (hero ? " sm-card--hero" : "") + " " + className} style={style}>
    {children}
  </div>
);

const SmAvatar = ({ initial, color = "var(--primary)", size, textColor }) => (
  <div
    className={"sm-avatar" + (size === "lg" ? " sm-avatar--lg" : "")}
    style={{ background: color, color: textColor || "var(--ink)" }}
  >
    {initial}
  </div>
);

/* ---- Icon system (inline lucide-style SVGs) ---- */
const Icon = ({ name, size = 22, strokeWidth = 2.8, style }) => {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {paths}
    </svg>
  );
};

const ICONS = {
  music: <>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </>,
  crown: <path d="M2 4l3 12h14l3-12-6 4-4-8-4 8z" />,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  play: <polygon points="6 4 20 12 6 20" />,
  pause: <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
  trophy: <>
    <path d="M6 9H4l-2 4v6h20v-6l-2-4h-2" />
    <path d="M12 2v15" />
    <path d="M5 21h14" />
  </>,
  sparkles: <path d="M12 3l2 5 5 1-4 4 1 6-4-3-4 3 1-6-4-4 5-1z" />,
  skull: <path d="M9 21a3 3 0 0 1-3-3v-2H4v-1l3-3V7a5 5 0 1 1 10 0v5l3 3v1h-2v2a3 3 0 0 1-3 3M9 21h6" />,
  users: <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>,
  copy: <>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>,
  send: <>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </>,
  share: <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
  </>,
  arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  volume: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></>,
};

Object.assign(window, { SmButton, SmInput, SmLabel, SmBadge, SmCard, SmAvatar, Icon });
