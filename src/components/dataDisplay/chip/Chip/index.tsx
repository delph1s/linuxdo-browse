import styles from '@assets/scss/vars.module.scss';
import { ColorScheme } from '@assets/theme/vars/color';
import React, { HTMLAttributes } from 'react';
import { Merge } from 'type-fest';

type ChipProps<T = any> = Merge<
  HTMLAttributes<T>,
  {
    label?: string;
    color?: ColorScheme;
  }
>;

function Chip({ label, color = 'primary', ...restProps }: ChipProps) {
  return (
    <span className={`${styles.chipName} ${styles.chipName}-${color}`} {...restProps}>
      {label}
    </span>
  );
}

export default Chip;
