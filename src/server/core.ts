import { SettingsContextValue } from '@store/context/settings/settingsProvider';

/**
 * 获取预加载数据
 */
export const getPreloadedData = () => {
  const preloadedDataElement = document.querySelector('#data-preloaded');
  if (!preloadedDataElement) throw new Error('Preloaded data element not found');
  return JSON.parse(preloadedDataElement.getAttribute('data-preloaded') || '{}');
};

/**
 * 获取用户名
 */
export const getUsername = () => {
  const preloadedData = getPreloadedData();
  return JSON.parse(preloadedData.currentUser).username;
};

/**
 * 获取 csrf token
 */
export const getCsrfToken = async (getCsrfTokenFromHtml: boolean) => {
  if (getCsrfTokenFromHtml) {
    const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
    if (!csrfTokenElement) throw new Error('CSRF token element not found');
    return csrfTokenElement.getAttribute('content') || '';
  }

  const response = await fetch('https://linux.do/session/csrf', {
    headers: {
      'x-csrf-token': 'undefined',
      'x-requested-with': 'XMLHttpRequest',
    },
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  }).then(res => res.json());

  if (!response || !response.csrf) throw new Error('CSRF token not fetched');
  return response.csrf;
};
