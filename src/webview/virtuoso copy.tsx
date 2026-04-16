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

const renderItemContent = (_: any, item: any) => {
  const { matchContent = [], content, data = [] } = item || {};
  const logLevelKey = data?.[DataFormatEnum.logLevelKey];
  const logTime = matchContent?.[LogDataEnum.logTime];
  const logLevel = matchContent?.[LogDataEnum.logLevel];
  const logServer = matchContent?.[LogDataEnum.logServer];

  if (['5', '6'].includes(logLevelKey)) {
    return (
      <BaseList.Item key={data[DataFormatEnum.key]} className={styles.lineStyle}>
        <span
          key={data?.[DataFormatEnum.logData]}
          className={`${styles[handleClassName(logLevelKey)]}`}
          dangerouslySetInnerHTML={{ __html: data?.[DataFormatEnum.logData] }}
        ></span>
      </BaseList.Item>
    );
  }

  return (
    <BaseList.Item key={data[DataFormatEnum.key]} className={styles.lineStyle}>
      <span key={logTime} className={`${styles[handleClassName(logLevelKey)]}`}>
        {logTime}
      </span>
      <span key={logLevel} className={`${styles.logLevel} ${levelRegex.test(logLevel) ? handleClassName(logLevelKey) : ''} || ''`}>
        {logLevel}
      </span>
      <span key={logServer} className={`${styles.port} ${levelRegex.test(logServer) ? handleClassName(logLevelKey) : ''} || ''}`}>
        {logServer}
      </span>
      <span key={content} className={styles.logContent} dangerouslySetInnerHTML={{ __html: content }}></span>
    </BaseList.Item>
  );
};

const LogMonitoring = () => {
  const { ateOutput } = usePanelIcons();
  const [logData, setLogData] = useState<Array<any>>([]);
  const logContainerRef = useRef<VirtuosoHandle>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>('');
  // 存储全量数据（可能超2w条数据
  const logAllDataRef = useRef<Array<any>>([]);
  // 存储展示数据
  const firstRef = useRef<boolean>(false);
  const viewportState = useViewportSize();
  // 记录当前可视区域范围
  const rangeRef = useRef({ startIndex: -1, endIndex: -1 });

  useEffect(() => {
    firstRef.current = true;
    getIsFirstRender({ firstRenderFlag: true });
  }, []);

  const captureMiddleAnchor = useCallback(() => {
    const { startIndex, endIndex } = rangeRef.current;
    if (startIndex === -1 || endIndex === -1 || logData.length === 0) return;
    // 计算中间项索引
    const middleIndex = Math.floor((startIndex + endIndex) / 2);
    const safeIndex = Math.min(Math.max(middleIndex, 0), logData.length - 1);
    const logId = logData[safeIndex]?.at(-1);
    // console.log('middleIndex', middleIndex, 'safeIndex', safeIndex, 'logId', logId);
    if (logId) {
      // 计算相对位置：假设中间项在视口的 50% 位置
      anchorRef.current = {
        logId,
        relativePosition: 0.5,
      };
    }
  }, [logData]);

  // 锁定模式：自动滚动到底部 固定可视区
  useEffect(() => {
    let rgId: number | null = null;
    const newTotalCount = logData.length;
    if (!logContainerRef.current) return;
    if (newTotalCount === 0) return;
    // console.log('logData, isLocked', logData, isLocked, newTotalCount);

    // 使用防抖优化自动滚动
    const debouncedScrollToBottom = debounce(() => {
      if (isLocked) {
        rgId = requestAnimationFrame(() => {
          logContainerRef.current &&
            logContainerRef.current.scrollToIndex({
              index: newTotalCount - 1,
              behavior: 'auto',
              align: 'end',
            });
        });
        anchorRef.current = null; // 清除锚点
      } else {
        if (anchorRef.current) {
          const { logId, relativePosition } = anchorRef.current;
          const newIndex = logData.findIndex((log: any) => log?.includes(logId));
          // console.log('newIndex', newIndex, anchorRef.current);
          if (newIndex !== -1) {
            // 锚点日志还在 > 滚动到它，并保持偏移
            logContainerRef.current &&
              logContainerRef.current.scrollToIndex({
                index: newIndex,
                // 根据相对位置选择对齐方式
                align: relativePosition < 0.3 ? 'start' : relativePosition > 0.7 ? 'end' : 'center',
                behavior: 'auto',
              });
          } else {
            setIsLocked(true);
            logContainerRef.current?.scrollToIndex({
              index: logData.length - 1,
              align: 'end',
              behavior: 'auto',
            });
            // 可选：给用户提示
            console.warn('锁定的日志已被删除，自动恢复滚动。');
          }
        }
      }
    }, 100); // 防抖延迟100ms
    debouncedScrollToBottom();

    return () => {
      rgId && cancelAnimationFrame(rgId);
      debouncedScrollToBottom.cancel(); // 取消防抖
    };
  }, [logData, isLocked]);

  onNotification<GlobalNotificationMethodParams>(
    {
      method: GlobalNotificationMethod.CommonBroadcast,
    },
    ({ data: { initData = [], methodType } }) => {
      if (methodType === GlobalMethodType.CacheInitData) {
        if (firstRef.current) {
          logAllDataRef.current = initData;
          setLogData([...initData]);
          // 只展示一次缓存数据
          firstRef.current = false;
        }
      }
    },
  );

  onNotification(
    {
      method: logMonitoringPanel.webview.methods.LOG_MANAGEMENT_OUTPUT,
    },
    async (datalist: string[][]) => {
      dealMessageData(datalist);
    },
  );

  const handleSaveLogFile = () => {
    try {
      logger.info('[handleSaveLogFile] click log save button');
      if (!logData.length) return;
      const datalist = logData.map((item: string[] = []) => item?.[1]);
      saveLogFile(datalist);
    } catch (error: any) {
      logger.error('[handleSaveLogFile] saveLogFile', { error });
    }
  };

  useEffect(() => {
    return () => {
      handleClear();
      disposeMeasureContext();
    };
  }, []);

  const handleClear = () => {
    setLogData([]);
    logAllDataRef.current = [];
    logger.info('[handleClear] clear log data');
  };

  const dealMessageData = async (datalist: string[][]) => {
    const processedDatalist = datalist.map((data: string[] = []) => {
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
    });
    setInputValue('');
    setLogData((prev: any) => {
      const allList = [...prev, ...processedDatalist];
      if (allList.length > showMaxLineCount) {
        const startIndex = allList.length - showMaxLineCount;
        logAllDataRef.current = allList.slice(startIndex);
        return allList.slice(-showMaxLineCount);
      }
      logAllDataRef.current = allList;
      return allList;
    });
  };

  const handleFilterChange = (value: string) => {
    setInputValue(value);
    logger.info(`[handleFilterChange] filter log data: ${value}`);
  };

  const debouncedHandleEnter = useCallback(
    debounce((e: React.KeyboardEvent<HTMLInputElement>) => {
      setLogData([]);
      const target = e.target as HTMLInputElement;
      const value = target.value;
      console.log('--------value', value);
      const newList = value
        ? logAllDataRef.current.filter((item: any) => {
            const { data = [] } = item || {};
            const line = data?.[DataFormatEnum.logData];
            const result = line.includes(value);
            return result;
          })
        : logAllDataRef.current;
      setLogData(newList || []);
    }, 100),
    [],
  );

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    debouncedHandleEnter(e);
  };

  const handleRangeChanged = (range: RangeChangedParams) => {
    const { startIndex, endIndex } = range;
    rangeRef.current = { startIndex, endIndex };
    if (!isLocked) {
      captureMiddleAnchor();
    }
  };

  const anchorRef = useRef<{
    logId: string;
    relativePosition: number;
  } | null>(null);

  const computeItemKey = useCallback((_i: number, item: any) => {
    const { data = [] } = item;
    return data.at(-1) || `key_${_i}`;
  }, []);

  const handleFilterClear = () => {
    setLogData(logAllDataRef.current);
  };

  const handleLevelChange = async (value: string) => {
    const _value = value ? value : 'DBG';
    await setLogLevel(_value);
    logger.info(`[handleLevelChange] logLevel: ${_value}`);
  };

  // 切换模式
  const handleToggleMode = () => {
    setIsLocked(!isLocked);
    if (isLocked) {
      // 从自动 -> 固定：先捕获锚点
      captureMiddleAnchor();
    } else {
      // 从固定 -> 自动：清除锚点并滚动到底部
      anchorRef.current = null;
      if (logData.length > 0) {
        logContainerRef.current &&
          logContainerRef.current.scrollToIndex({
            index: logData.length - 1,
            align: 'end',
            behavior: 'auto',
          });
      }
    }
  };

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
            {options.map((option, index) => (
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
            onClick={() => {
              handleSaveLogFile();
            }}
          />
          <BaseIconButtonGroup.IconButton
            icon={isLocked ? <ateOutput.LockIcon /> : <ateOutput.UnLockIcon />}
            tooltip={isLocked ? 'Turn Auto Scrolling Off' : 'Turn Auto Scrolling On'}
            onClick={() => {
              handleToggleMode();
            }}
          />
          <BaseIconButtonGroup.IconButton
            icon={<ateOutput.ClearIcon />}
            tooltip={'Clear log'}
            onClick={() => {
              handleClear();
            }}
          />
        </BaseIconButtonGroup>
      </div>
      <div className={styles.contain}>
        <BaseVirtuosoList
          ref={logContainerRef}
          data={logData}
          itemContent={renderItemContent}
          initialTopMostItemIndex={logData.length - 1} // 初始滚动到底部
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

