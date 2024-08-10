import React, { ButtonHTMLAttributes, ReactNode, useMemo } from 'react';
import { Merge } from 'type-fest';

export type IconNameType = |
  'play' |
  'stop-circle' |
  'far-trash-alt';

type IconButtonProps<T = any> = Merge<ButtonHTMLAttributes<T>, {
  changeMe?: 'changeMe';
  icon?: ReactNode | IconNameType;
}>;

function IconButton({ changeMe = 'changeMe', icon, ...restProps }: IconButtonProps) {
  const iconElement = typeof icon === 'string' ? <use href={`#${icon}`} /> : icon;

  return (
    <button
      type="button"
      aria-label="Icon Button"
      className="btn btn-default no-text btn-icon"
      {...restProps}
    >
      <svg
        className="fa d-icon svg-icon svg-string"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {iconElement}
      </svg>
    </button>
  );
}

export default IconButton;
