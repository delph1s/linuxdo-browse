/**
 * 检查 local storage 是否存在
 */
export const localStorageAvailable = () => {
  try {
    const key = '__some_random_key_you_are_not_going_to_use__';
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 获取 local storage 中的数据
 *
 * @param key 键
 * @param defaultValue 默认值
 */
export const localStorageGetItem = (key: string, defaultValue = '') => {
  const storageAvailable = localStorageAvailable();

  let value;

  if (storageAvailable) {
    value = localStorage.getItem(key) || defaultValue;
  }

  return value;
};
