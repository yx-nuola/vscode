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
    return prevProps.item?.data?.at(-1) === nextProps.item?.data?.at(-1);
  }
);

LogItem.displayName = 'LogItem';

const renderItemContent = (_: number, item: any) => <LogItem item={item} />;

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
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>('');

  const logContainerRef = useRef<VirtuosoHandle>(null);
  const logAllDataRef = useRef<Array<any>>([]);

  const firstRef = useRef<boolean>(false);
  const viewportState = useViewportSize();
  const rangeRef = useRef({ startIndex: -1, endIndex: -1 });
  const anchorRef = useRef<{
    logId: string;
    relativePosition: number;
    index: number;
  } | null>(null);
  const isRestoringScrollRef = useRef<boolean>(false);

  const isLockedRef = useRef(isLocked);
  const logDataRef = useRef(logData);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // useEffect(() => {
  //   logDataRef.current = logData;
  // }, [logData]);

  useEffect(() => {
    firstRef.current = true;
    getIsFirstRender({ firstRenderFlag: true });
  }, []);

  const dealMessageData = async (datalist: string[][]) => {
    const processedDatalist = datalist.map(processLogEntry);

    if (inputValue) {
      setInputValue('');
    }

    // setLogData(() => {
    //   logAllDataRef.current = logAllDataRef.current.concat(processedDatalist);
    //   if (logAllDataRef.current.length > showMaxLineCount) {
    //     logAllDataRef.current = logAllDataRef.current.slice(-showMaxLineCount);
    //   }
    //   return logAllDataRef.current;
    // });

    setLogData(() => {
      logAllDataRef.current.push(...processedDatalist);
      if (logAllDataRef.current.length > showMaxLineCount) {
        logAllDataRef.current.splice(0, logAllDataRef.current.length - showMaxLineCount);
      }
      return [...logAllDataRef.current];
    });
  };

  // ============================================
  // 优化 4: 捕获中间锚点
  // ============================================
  const captureMiddleAnchor = useCallback(() => {
    if (isRestoringScrollRef.current) return;
    
    const { startIndex, endIndex } = rangeRef.current;
    if (startIndex === -1 || endIndex === -1 || logData.length === 0) return;

    const middleIndex = Math.floor((startIndex + endIndex) / 2);
    const safeIndex = Math.min(Math.max(middleIndex, 0), logData.length - 1);
    const logId = logData[safeIndex]?.data?.at(-1);

    if (logId) {
      anchorRef.current = {
        logId,
        relativePosition: 0.5,
        index: safeIndex,
      };
    }
  }, [logData]);

  // 锁定模式：自动滚动到底部；非锁定模式：保持锚点位置
  useEffect(() => {
    let rgId: number | null = null;
    if (!logContainerRef.current) return;
    if (logData.length === 0) return;

    const debouncedScrollToBottom = debounce(() => {
      // 使用 ref 获取最新数据，避免闭包问题
      const currentLogData = logDataRef.current;

      if (isLockedRef.current) {
        rgId = requestAnimationFrame(() => {
          rgId = null;
          logContainerRef.current?.scrollToIndex({
            index: currentLogData.length - 1,
            behavior: 'auto',
            align: 'end',
          });
        });
        anchorRef.current = null;
      } else if (anchorRef.current) {
        const { logId, relativePosition } = anchorRef.current;
        // 精确匹配：logId 是 data 的最后一个元素
        const newIndex = currentLogData.findIndex(
          (log: any) => log?.data?.at(-1) === logId
        );
        if (newIndex !== -1) {
          logContainerRef.current?.scrollToIndex({
            index: newIndex,
            align: relativePosition < 0.3 ? 'start' : relativePosition > 0.7 ? 'end' : 'center',
            behavior: 'auto',
          });
        } else {
          setIsLocked(true);
          logContainerRef.current?.scrollToIndex({
            index: currentLogData.length - 1,
            align: 'end',
            behavior: 'auto',
          });
          console.warn('锁定的日志已被删除，自动恢复滚动。');
        }
      }
    }, 100);
    debouncedScrollToBottom();

    return () => {
      rgId && cancelAnimationFrame(rgId);
      debouncedScrollToBottom.cancel();
    };
  }, [logData, isLocked]);

  onNotification<GlobalNotificationMethodParams>(
    {
      method: GlobalNotificationMethod.CommonBroadcast,
    },
    ({ data: { initData = [], methodType } }: { data: { initData: any[]; methodType: any } }) => {
      if (methodType === GlobalMethodType.CacheInitData) {
        if (firstRef.current) {
          logAllDataRef.current = initData;
          setLogData(initData);
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
    logAllDataRef.current = [];
    setLogData([]);
    logger.info('[handleClear] clear log data');
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setInputValue(value);
    logger.info(`[handleFilterChange] filter log data: ${value}`);
  }, []);

  const handleFilterClear = useCallback(() => {
    setLogData([...logAllDataRef.current]);
  }, []);

  const handleLevelChange = useCallback(async (value: string) => {
    const _value = value ? value : 'DBG';
    await setLogLevel(_value);
    logger.info(`[handleLevelChange] logLevel: ${_value}`);
  }, []);

  const handleToggleMode = useCallback(() => {
    setIsLocked(!isLocked);
    if (isLocked) {
      // 从自动 -> 固定: 先捕获锚点
      captureMiddleAnchor();
    } else {
      // 从固定 -> 自动: 清除锚点并滚动到底部
      anchorRef.current = null;
      if (logData.length > 0) {
        logContainerRef.current?.scrollToIndex({
          index: logData.length - 1,
          align: 'end',
          behavior: 'auto',
        });
      }
    }
  }, [isLocked, logData, captureMiddleAnchor]);

  const handleRangeChanged = useCallback(
    (range: RangeChangedParams) => {
      const { startIndex, endIndex } = range;
      rangeRef.current = { startIndex, endIndex };
      if (!isLocked) {
        captureMiddleAnchor();
      }
    },
    [isLocked, captureMiddleAnchor]
  );

  const debouncedHandleEnter = useMemo(
    () =>
      debounce((value: string) => {
        if (!value) {
          setLogData([...logAllDataRef.current]);
        } else {
          const filtered = logAllDataRef.current.filter((item: any) => {
            const { data = [] } = item || {};
            const line = data?.[DataFormatEnum.logData];
            return line.includes(value);
          });
          setLogData(filtered);
        }
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
