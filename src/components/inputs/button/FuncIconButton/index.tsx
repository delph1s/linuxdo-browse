import { IconNameType } from '@components/dataDisplay/icons/NativeIcon/types';
import React, { ButtonHTMLAttributes, ReactNode, useMemo } from 'react';
import { Merge } from 'type-fest';

type IconButtonProps<T = any> = Merge<
  ButtonHTMLAttributes<T>,
  {
    changeMe?: 'changeMe';
    icon?: ReactNode | IconNameType;
  }
>;

function FuncIconButton({ changeMe = 'changeMe', icon, ...restProps }: IconButtonProps) {
  const iconElement = typeof icon === 'string' ? <use href={`#${icon}`} /> : icon;

  return (
    <button
      type="button"
      title="Function Icon Button"
      aria-label="Function Icon Button"
      className="btn btn-icon btn-flat no-text"
      {...restProps}
    >
      <svg className="fa d-icon svg-icon svg-string" xmlns="http://www.w3.org/2000/svg">
        {iconElement}
      </svg>
    </button>
  );
}

export default FuncIconButton;
