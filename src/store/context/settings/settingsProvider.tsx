import { useLocalStorage } from '@hooks/useLocalStorage';
import { APP_SETTINGS_KEY } from '@src/config';
import React, { createContext, ReactNode, useCallback, useMemo, useState } from 'react';
import { Merge } from 'type-fest';

export type SettingsState = {
  readAllPostsInTopic: boolean, // 是否阅读主题所有帖子，false 从最后的内容开始看
  singlePostsReading: number, // 单次阅读帖子数，控制 timings 请求 body 行为
  maxRetryTimes: number, // 最大重试次数
  windowPeriodTopics: number[][], // 空窗期随机阅读的帖子列表，[[<topic_id>, <阅读楼层数>]]
  getCsrfTokenFromHtml: boolean, // 是否从 html 中获取 csrf token
  maxLogLineNum: number, // 日志最大条数
  uiWidth: number | string, // ui 宽度
  uiQueueHeight: number | string, // ui 任务队列高度
  uiLogHeight: number | string, // ui 日志高度
  uiTagFontSize: number | string, // ui 标签字体大小
  uiQueueFontSize: number | string, // ui 队列字体大小
  uiLogFontSize: number | string, // ui 日志字体大小
};

export type SettingsCaches = 'localStorage';

export type SettingsProviderProps = {
  settings: SettingsState;
  children: ReactNode;
  caches?: SettingsCaches;
};

export type SettingsContextValue = Merge<
  SettingsState,
  {
    canReset: boolean;
    onReset: VoidFunction;
    onUpdate: (updateValue: Partial<SettingsState>) => void;
    onUpdateField: (name: keyof SettingsState, updateValue: SettingsState[keyof SettingsState]) => void;
    // Drawer
    openDialog: boolean;
    onCloseDialog: VoidFunction;
    onToggleDialog: VoidFunction;
  }
>;

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsConsumer = SettingsContext.Consumer;

export function SettingsProvider({ settings, children, caches = 'localStorage' }: SettingsProviderProps) {
  const localStorage = useLocalStorage<SettingsState>(APP_SETTINGS_KEY, settings);

  // const values = caches === 'localStorage' ? localStorage : localStorage;
  const values = localStorage;

  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const onToggleDialog = useCallback(() => {
    setOpenDialog(prevState => !prevState);
  }, []);

  const onCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const memorizedValue = useMemo(
    () => ({
      ...values.state,
      canReset: values.canReset,
      onReset: values.resetState,
      onUpdate: values.setState,
      onUpdateField: values.setField,
      openDialog,
      onCloseDialog,
      onToggleDialog,
    }),
    [
      values.canReset,
      values.resetState,
      values.setField,
      values.setState,
      values.state,
      openDialog,
      onCloseDialog,
      onToggleDialog,
    ]
  );

  return <SettingsContext.Provider value={memorizedValue}>{children}</SettingsContext.Provider>;
}
