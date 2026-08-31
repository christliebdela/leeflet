import React from 'react';

interface MiddleTruncateProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  startChars?: number;
  endChars?: number;
}

export const MiddleTruncate: React.FC<MiddleTruncateProps> = ({
  value,
  className = '',
  style,
  startChars = 10,
  endChars = 8,
}) => {
  if (!value) return null;

  if (value.length <= startChars + endChars + 3) {
    return (
      <span
        className={`truncate min-w-0 max-w-full block ${className}`}
        style={style}
      >
        {value}
      </span>
    );
  }

  const prefix = value.slice(0, -endChars);
  const suffix = value.slice(-endChars);

  return (
    <span
      className={`inline-flex items-center min-w-0 max-w-full overflow-hidden ${className}`}
      style={style}
    >
      <span className="truncate min-w-0">{prefix}</span>
      <span className="shrink-0">{suffix}</span>
    </span>
  );
};
