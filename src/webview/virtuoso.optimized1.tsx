import { useState, useEffect, useRef, forwardRef, useMemo, useCallback, memo } from 'react';
import { onNotification } from '@/utils/messenger';
import { messages, GlobalNotificationMethod, GlobalNotificationMethodParams, GlobalMethodType } from 'ate-tool-config';
import { setLogLevel, saveLogFile, getIsFirstRender } from '@/services/panel/log-management-panel';
import { IconExclamationCircle } from '@arco-design/web-react/icon';

import { BaseInput, BaseList, BaseSelect, BaseTooltip, useViewportSize, BaseIconButtonGroup, usePanelIcons } from 'hf-components';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { options, showMaxLineCount, matchReg, levelRegex, LogDataEnum, DataFormatEnum, handleClassName, disposeMeasureContext } from './config';
import { RangeChangedParams } from './type';
import { logger } from '../utils/logger';
import { debounce } from 'lodash-es';
import styles from './index.module.scss';

const Option = BaseSelect.Option;

const {
  panel: { logMonitoringPanel },
} = messages;

const BaseVirtuosoList = forwardRef<VirtuosoHandle, any>((props, ref) => {
  return <Virtuoso ref={ref} className={styles.virtualList} {...props} />;
});

BaseVirtuosoList.displayName = 'BaseVirtuosoList';

// ============================================
// 优化 1: 使用 React.memo 记忆化渲染函数
// ============================================
const LogItem = memo(
  ({ item }: { item: any }) => {
    const { matchContent = [], content, data = [] } = item || {};
    const logLevelKey = data?.[DataFormatEnum.logLevelKey];
    const logTime = matchContent?.[LogDataEnum.logTime];
    const logLevel = matchContent?.[LogDataEnum.logLevel];
    const logServer = matchContent?.[LogDataEnum.logServer];

    if (['5', '6'].includes(logLevelKey)) {
      return (
        <BaseList.Item className={styles.lineStyle}>
          <span
            className={`${styles[handleClassName(logLevelKey)]}`}
            dangerouslySetInnerHTML={{ __html: data?.[DataFormatEnum.logData] }}
          />
        </BaseList.Item>
      );
    }

    return (
      <BaseList.Item className={styles.lineStyle}>
        <span className={`${styles[handleClassName(logLevelKey)]}`}>{logTime}</span>
        <span className={`${styles.logLevel} ${levelRegex.test(logLevel) ? handleClassName(logLevelKey) : ''}`}>
          {logLevel}
        </span>
        <span className={`${styles.port} ${levelRegex.test(logServer) ? handleClassName(logLevelKey) : ''}`}>
          {logServer}
        </span>
        <span className={styles.logContent} dangerouslySetInnerHTML={{ __html: content }} />
      </BaseList.Item>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数:只在 data 的最后一个元素(唯一ID)变化时才更新
    return prevProps.item?.data?.at(-1) === nextProps.item?.data?.at(-1);
  }
);

LogItem.displayName = 'LogItem';

const renderItemContent = (_: number, item: any) => <LogItem item={item} />;

// ============================================
// 优化 2: 处理日志数据的辅助函数(避免重复创建)
// ============================================
const processLogEntry = (data: string[] = []): { matchContent: string[]; content: string; data: string[] } => {
  if (!data || !data[DataFormatEnum.logData]) {
    return {
      matchContent: [],
      content: '',
      data,
    };
  }

  const matchContent: string[] = data?.[DataFormatEnum.logData].match(matchReg) || [];
  const splitVal = matchContent?.slice(0, 3)?.join('');
  const _content: string = matchContent.length > 1 ? data[DataFormatEnum.logData].split(splitVal)[1] || '' : '';
  const content = _content.replace(/\n/g, '<br />');

  return {
    matchContent,
    content,
    data,
  };
};

const LogMonitoring = () => {
  const { ateOutput } = usePanelIcons();
  const [logData, setLogData] = useState<Array<any>>([]);
  const logContainerRef = useRef<VirtuosoHandle>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>('');

  // 存储全量数据（可能超2w条数据）
  const logAllDataRef = useRef<Array<any>>([]);
  // 存储展示数据
  const firstRef = useRef<boolean>(false);
  const viewportState = useViewportSize();
  // 记录当前可视区域范围
  const rangeRef = useRef({ startIndex: -1, endIndex: -1 });
  // 锚点引用
  const anchorRef = useRef<{
    logId: string;
    relativePosition: number;
    index: number; // 存储锚点索引，用于判断数据变化时是否需要滚动
  } | null>(null);
  // 标记是否正在执行锚点恢复滚动（防止与手动滚动冲突）
  const isRestoringScrollRef = useRef<boolean>(false);
  // 自由浏览模式下的可视区域状态
  const freeScrollStateRef = useRef<{
    startIndex: number;
  } | null>(null);
  // 记录本次数据更新新增了多少条
  const addedCountRef = useRef<number>(0);

  // ============================================
  // 优化 3: 使用 ref 存储最新值,用于防抖和动画帧
  // ============================================
  const isLockedRef = useRef(isLocked);
  const logDataRef = useRef(logData);
  const rafIdRef = useRef<number | null>(null);

  // 保持 ref 同步
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    logDataRef.current = logData;
  }, [logData]);

  useEffect(() => {
    firstRef.current = true;
    getIsFirstRender({ firstRenderFlag: true });
  }, []);

  // ============================================
  // 优化 8: 优化 dealMessageData 数组操作(必须定义在 onNotification 之前)
  // ============================================
  const dealMessageData = async (datalist: string[][]) => {
    const processedDatalist = datalist.map(processLogEntry);

    // 优化: 只在输入框有值时才清空
    if (inputValue) {
      setInputValue('');
    }

    // 记录新增数量
    addedCountRef.current = processedDatalist.length;

    setLogData((prev: any) => {
      // 使用 push 代替展开操作符,减少临时数组创建
      const allList = [...prev];
      processedDatalist.forEach((item) => allList.push(item));

      // 超出限制时,使用 splice 删除头部(原地修改)
      if (allList.length > showMaxLineCount) {
        const deleteCount = allList.length - showMaxLineCount;
        allList.splice(0, deleteCount);
        logAllDataRef.current = [...allList];
      } else {
        logAllDataRef.current = [...allList];
      }

      return allList;
    });
  };

  // ============================================
  // 优化 5: 清理动画帧的辅助函数
  // ============================================
  const cancelPendingRAF = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // ============================================
  // 优化 6: 防抖滚动逻辑 - 只创建一次
  // ============================================
  const debouncedScroll = useMemo(
    () =>
      debounce(() => {
        // 先清理之前的动画帧
        cancelPendingRAF();

        // 通过 ref 获取最新的 logData
        const currentLogData = logDataRef.current;

        if (isLockedRef.current) {
          // ===== 锁定模式: 自动滚动到底部 =====
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;

            if (logContainerRef.current && currentLogData.length > 0) {
              logContainerRef.current.scrollToIndex({
                index: currentLogData.length - 1,
                behavior: 'auto',
                align: 'end',
              });
            }
          });
    } else {
      // ===== 非锁定模式: 基于索引偏移保持可视区内容不变 =====
      if (freeScrollStateRef.current) {
        const { startIndex: oldStartIndex } = freeScrollStateRef.current;
        const addedCount = addedCountRef.current;

        if (addedCount > 0) {
          // 计算删除了多少条（超出限制时）
          // 如果数据总数超过最大限制，则删除数量等于新增数量
          const deletedCount = currentLogData.length >= showMaxLineCount ? addedCount : 0;

          // 计算新的起始索引
          const newStartIndex = Math.max(0, oldStartIndex - deletedCount);

          // 滚动到新的位置，保持可视区内容不变
          if (newStartIndex < currentLogData.length) {
            rafIdRef.current = requestAnimationFrame(() => {
              rafIdRef.current = null;
              if (logContainerRef.current) {
                logContainerRef.current.scrollToIndex({
                  index: newStartIndex,
                  align: 'start',
                  behavior: 'auto',
                });
              }
            });
          }

          // 更新记录的状态
          freeScrollStateRef.current = {
            startIndex: newStartIndex,
          };
        }

        // 重置新增计数
        addedCountRef.current = 0;
      }
    }
      }, 100),
    []
  );

  // 触发滚动的 useEffect
  useEffect(() => {
    if (!logContainerRef.current || logData.length === 0) {
      return;
    }

    debouncedScroll();

    return () => {
      debouncedScroll.cancel();
    };
  }, [logData, isLocked]);

  // 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      debouncedScroll.cancel();
      cancelPendingRAF();
    };
  }, []);

  // ============================================
  // 监听器注册(保持原有方式,不在 useEffect 中)
  // ============================================
  onNotification<GlobalNotificationMethodParams>(
    {
      method: GlobalNotificationMethod.CommonBroadcast,
    },
    ({ data: { initData = [], methodType } }: { data: { initData: any[]; methodType: any } }) => {
      if (methodType === GlobalMethodType.CacheInitData) {
        if (firstRef.current) {
          logAllDataRef.current = initData;
          setLogData([...initData]);
          firstRef.current = false;
        }
      }
    }
  );

  onNotification(
    {
      method: logMonitoringPanel.webview.methods.LOG_MANAGEMENT_OUTPUT,
    },
    async (datalist: string[][]) => {
      dealMessageData(datalist);
    }
  );

  // ============================================
  // 优化 9: 使用 useCallback 优化事件处理函数
  // ============================================
  const handleSaveLogFile = useCallback(() => {
    try {
      logger.info('[handleSaveLogFile] click log save button');
      if (!logData.length) return;
      const datalist = logData.map((item: string[] = []) => item?.[1]);
      saveLogFile(datalist);
    } catch (error: any) {
      logger.error('[handleSaveLogFile] saveLogFile', { error });
    }
  }, [logData]);

  const handleClear = useCallback(() => {
    setLogData([]);
    logAllDataRef.current = [];
    logger.info('[handleClear] clear log data');
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setInputValue(value);
    logger.info(`[handleFilterChange] filter log data: ${value}`);
  }, []);

  const handleFilterClear = useCallback(() => {
    setLogData(logAllDataRef.current);
  }, []);

  const handleLevelChange = useCallback(async (value: string) => {
    const _value = value ? value : 'DBG';
    await setLogLevel(_value);
    logger.info(`[handleLevelChange] logLevel: ${_value}`);
  }, []);

  const handleToggleMode = useCallback(() => {
    const newIsLocked = !isLocked;
    setIsLocked(newIsLocked);

    if (!newIsLocked) {
      // 从自动 -> 固定：记录当前可视区域起始位置
      const { startIndex } = rangeRef.current;
      if (startIndex !== -1 && logData.length > 0) {
        freeScrollStateRef.current = {
          startIndex,
        };
      }
      // 清除锚点引用
      anchorRef.current = null;
    } else {
      // 从固定 -> 自动：清除记录并滚动到底部
      freeScrollStateRef.current = null;
      anchorRef.current = null;
      if (logData.length > 0) {
        logContainerRef.current?.scrollToIndex({
          index: logData.length - 1,
          align: 'end',
          behavior: 'auto',
        });
      }
    }
  }, [isLocked, logData]);

  const handleRangeChanged = useCallback(
    (range: RangeChangedParams) => {
      if (isRestoringScrollRef.current) return;

      const { startIndex, endIndex } = range;
      rangeRef.current = { startIndex, endIndex };

      // 在自由浏览模式下，记录当前可视区域状态
      if (!isLockedRef.current && startIndex !== -1) {
        freeScrollStateRef.current = {
          startIndex,
        };
      }
    },
    []
  );

  const debouncedHandleEnter = useMemo(
    () =>
      debounce((value: string) => {
        setLogData([]);
        const newList = value
          ? logAllDataRef.current.filter((item: any) => {
              const { data = [] } = item || {};
              const line = data?.[DataFormatEnum.logData];
              return line.includes(value);
            })
          : logAllDataRef.current;
        setLogData(newList || []);
      }, 100),
    []
  );

  const handleEnter = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const value = target.value;
      debouncedHandleEnter(value);
    },
    [debouncedHandleEnter]
  );

  const computeItemKey = useCallback((_i: number, item: any) => {
    const { data = [] } = item;
    return data.at(-1) || `key_${_i}`;
  }, []);

  // ============================================
  // 优化 10: 清理资源
  // ============================================
  useEffect(() => {
    return () => {
      handleClear();
      disposeMeasureContext();
    };
  }, [handleClear]);

  // ============================================
  // 优化 11: 记忆化初始滚动位置
  // ============================================
  const initialTopMostItemIndex = useMemo(() => {
    return logData.length > 0 ? logData.length - 1 : 0;
  }, [logData.length]);

  const { width } = viewportState;
  const widthFlag = width < 480;

  return (
    <div className={styles.logManagement}>
      <div className={styles.logHeader} style={width < 480 ? { display: 'block' } : {}}>
        <div className={styles.buttons}>
          <BaseInput
            placeholder="Search log"
            className={styles.filterStyle}
            style={widthFlag ? { margin: '0 10px 5px 0' } : { width: 200 }}
            allowClear
            onPressEnter={handleEnter}
            onChange={handleFilterChange}
            onClear={handleFilterClear}
            value={inputValue}
            size="mini"
          />
          <BaseSelect
            placeholder="Select Log Level"
            style={widthFlag ? { margin: '0 10px 5px 0' } : { width: 120, margin: '0 10px' }}
            onChange={handleLevelChange}
            className={styles.selectStyle}
            allowClear
          >
          {options.map((option: string) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
          </BaseSelect>
        </div>
        <span className={styles.prompt}>
          <BaseTooltip
            position="rt"
            trigger="hover"
            content={
              <>
                At present,
                <span style={{ fontWeight: 600, margin: '0 5px' }}>{logData.length}</span>
                pieces of data are displayed, and the maximum number of rows is {showMaxLineCount}
              </>
            }
          >
            <span className={styles.pieces}>
              <span style={{ fontWeight: 600, margin: '0 5px' }}>{logData.length}</span>
              pieces <IconExclamationCircle style={{ marginLeft: '5px' }} />
            </span>
          </BaseTooltip>
        </span>
        <BaseIconButtonGroup>
          <BaseIconButtonGroup.IconButton
            icon={<ateOutput.ExportIcon />}
            tooltip={'Export as'}
            onClick={handleSaveLogFile}
          />
          <BaseIconButtonGroup.IconButton
            icon={isLocked ? <ateOutput.LockIcon /> : <ateOutput.UnLockIcon />}
            tooltip={isLocked ? 'Turn Auto Scrolling Off' : 'Turn Auto Scrolling On'}
            onClick={handleToggleMode}
          />
          <BaseIconButtonGroup.IconButton
            icon={<ateOutput.ClearIcon />}
            tooltip={'Clear log'}
            onClick={handleClear}
          />
        </BaseIconButtonGroup>
      </div>
      <div className={styles.contain}>
        <BaseVirtuosoList
          ref={logContainerRef}
          data={logData}
          itemContent={renderItemContent}
          initialTopMostItemIndex={initialTopMostItemIndex}
          rangeChanged={handleRangeChanged}
          overscan={{
            main: 20,
            reverse: 10,
          }}
          computeItemKey={computeItemKey}
        />
      </div>
    </div>
  );
};

export default LogMonitoring;
