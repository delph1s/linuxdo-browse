import { localStorageGetItem } from '@utils/storage';
import { isEqual } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * 获取存储数据
 *
 * @param key 键
 */
export const getStorage = (key: string) => {
  try {
    const result = localStorageGetItem(key);

    if (result) {
      return JSON.parse(result);
    }
  } catch (error) {
    console.error('Error while getting from storage:', error);
  }

  return null;
};

/**
 * 设置存储数据
 *
 * @param key 键
 * @param value 值
 */
export const setStorage = <T>(key: string, value: T) => {
  try {
    const serializedValue = JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Error while setting storage:', error);
  }
};

/**
 * 删除存储数据
 *
 * @param key 键
 */
export const removeStorage = (key: string) => {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error while removing from storage:', error);
  }
};

export type UseLocalStorageReturn<T> = {
  state: T;
  canReset: boolean;
  resetState: () => void;
  setState: (updateState: T | Partial<T>) => void;
  setField: (name: keyof T, updateValue: T[keyof T]) => void;
};

export const useLocalStorage = <T>(key: string, initialValue: T): UseLocalStorageReturn<T> => {
  const [value, setValue] = useState(initialValue);

  const multiValue = initialValue && typeof initialValue === 'object';

  const canReset = !isEqual(value, initialValue);

  useEffect(() => {
    const restoredValue: T = getStorage(key);

    if (restoredValue) {
      if (multiValue) {
        setValue(prevValue => ({ ...prevValue, ...restoredValue }));
      } else {
        setValue(restoredValue);
      }
    }
  }, [key, multiValue]);

  const setState = useCallback(
    (updateValue: T | Partial<T>) => {
      if (multiValue) {
        setValue(prevValue => {
          setStorage<T>(key, { ...prevValue, ...updateValue });
          return { ...prevValue, ...updateValue };
        });
      } else {
        setStorage<T>(key, updateValue as T);
        setValue(updateValue as T);
      }
    },
    [key, multiValue],
  );

  const setField = useCallback(
    (name: keyof T, updateValue: T[keyof T]) => {
      if (multiValue) {
        setState({ [name]: updateValue } as Partial<T>);
      }
    },
    [multiValue, setState],
  );

  const resetState = useCallback(() => {
    setValue(initialValue);
    removeStorage(key);
  }, [initialValue, key]);

  const memorizedValue = useMemo(
    () => ({
      state: value,
      setState,
      setField,
      resetState,
      canReset,
    }),
    [canReset, resetState, setField, setState, value],
  );

  return memorizedValue;
};
