import { useSettingsContext } from '@hooks/useSettingsContext';

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

const settings = {
  globalCsrfToken: '',
  getCsrfTokenFromHtml: false,
};

/**
 * 获取 csrf token
 */
export const getCsrfToken = async () => {
  // const settings = useSettingsContext();

  if (settings.globalCsrfToken) return settings.globalCsrfToken;

  if (settings.getCsrfTokenFromHtml) {
    const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
    if (!csrfTokenElement) throw new Error('CSRF token element not found');
    settings.globalCsrfToken = csrfTokenElement.getAttribute('content') || '';
  } else {
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
    // settings.onUpdateField('globalCsrfToken', response.csrf);
    settings.globalCsrfToken = response.csrf;
  }

  return settings.globalCsrfToken;
};
