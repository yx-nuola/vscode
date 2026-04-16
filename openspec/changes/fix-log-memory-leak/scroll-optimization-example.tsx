/**
 * 滚动逻辑优化 - 完整示例代码
 * 
 * 问题分析:
 * 1. 原代码在 useEffect 中每次都创建新的防抖函数,导致不必要的内存分配
 * 2. 需要保持两种模式的正确行为:
 *    - 锁定模式 (isLocked=true): 自动滚动到底部,显示最新日志
 *    - 非锁定模式 (isLocked=false): 保持当前可视区域不变,通过锚点实现
 * 
 * 优化方案:
 * 1. 使用 useMemo 创建防抖函数,避免频繁创建
 * 2. 使用 useRef 存储 logData 的最新引用,避免闭包陷阱
 * 3. 保持原有的两种模式逻辑不变
 */

import { useRef, useEffect, useMemo } from 'react';
import { VirtuosoHandle } from 'react-virtuoso';
import { debounce } from 'lodash-es';

// ============================================
// 方案 1: 只需要 isLockedRef (推荐)
// ============================================

const useOptimizedScroll_V1 = (
  logContainerRef: React.RefObject<VirtuosoHandle>,
  logData: any[],
  isLocked: boolean,
  anchorRef: React.MutableRefObject<{
    logId: string;
    relativePosition: number;
  } | null>,
  setIsLocked: (value: boolean) => void
) => {
  // 使用 ref 存储 isLocked 的最新值
  const isLockedRef = useRef(isLocked);

  // 保持 isLockedRef 同步
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // 使用 ref 存储 logData 的最新值,避免闭包问题
  const logDataRef = useRef(logData);

  // 保持 logDataRef 同步
  useEffect(() => {
    logDataRef.current = logData;
  }, [logData]);

  // 创建防抖函数 - 只创建一次
  const debouncedScroll = useMemo(
    () =>
      debounce(() => {
        // 通过 ref 获取最新的 logData
        const currentLogData = logDataRef.current;

        if (isLockedRef.current) {
          // ===== 锁定模式: 自动滚动到底部 =====
          requestAnimationFrame(() => {
            if (logContainerRef.current && currentLogData.length > 0) {
              logContainerRef.current.scrollToIndex({
                index: currentLogData.length - 1,
                behavior: 'auto',
                align: 'end',
              });
            }
          });
        } else {
          // ===== 非锁定模式: 保持锚点位置 =====
          if (anchorRef.current) {
            requestAnimationFrame(() => {
              const { logId, relativePosition } = anchorRef.current!;

              // 查找锚点日志的新位置
              const newIndex = currentLogData.findIndex((log: any) =>
                log?.includes(logId)
              );

              if (newIndex !== -1) {
                // 锚点日志还在 > 滚动到它,保持相对位置
                logContainerRef.current?.scrollToIndex({
                  index: newIndex,
                  align:
                    relativePosition < 0.3
                      ? 'start'
                      : relativePosition > 0.7
                        ? 'end'
                        : 'center',
                  behavior: 'auto',
                });
              } else {
                // 锚点日志已被删除 > 恢复自动滚动
                console.warn('锁定的日志已被删除,自动恢复滚动。');
                setIsLocked(true);
                logContainerRef.current?.scrollToIndex({
                  index: currentLogData.length - 1,
                  align: 'end',
                  behavior: 'auto',
                });
              }
            });
          }
          // 如果没有锚点,不做任何操作(保持当前位置)
        }
      }, 100), // 防抖 100ms
    [] // 无依赖,只创建一次
  );

  // 触发滚动的 useEffect
  useEffect(() => {
    if (!logContainerRef.current || logData.length === 0) {
      return;
    }

    // 调用防抖函数
    debouncedScroll();

    // 清理函数: 取消防抖
    return () => {
      debouncedScroll.cancel();
    };
  }, [logData, isLocked]); // 依赖 logData 和 isLocked 来触发滚动

  // 组件卸载时清理防抖函数
  useEffect(() => {
    return () => {
      debouncedScroll.cancel();
    };
  }, []);
};

// ============================================
// 方案 2: 更简洁,直接在 useMemo 中使用闭包 (不推荐)
// ============================================
/**
 * 这个方案有闭包陷阱问题,仅供参考
 * 
 * 问题: useMemo 依赖 logData 时,每次 logData 变化都会重新创建防抖函数
 * 这样优化意义不大,反而增加了复杂度
 */
const useOptimizedScroll_V2_NOT_RECOMMENDED = (
  logContainerRef: React.RefObject<VirtuosoHandle>,
  logData: any[],
  isLocked: boolean,
  anchorRef: React.MutableRefObject<{
    logId: string;
    relativePosition: number;
  } | null>,
  setIsLocked: (value: boolean) => void
) => {
  // 创建防抖函数 - 每次 logData 变化都重新创建(不推荐)
  const debouncedScroll = useMemo(
    () =>
      debounce(() => {
        if (isLocked) {
          // 锁定模式: 自动滚动到底部
          requestAnimationFrame(() => {
            if (logContainerRef.current && logData.length > 0) {
              logContainerRef.current.scrollToIndex({
                index: logData.length - 1,
                behavior: 'auto',
                align: 'end',
              });
            }
          });
        } else {
          // 非锁定模式: 保持锚点位置
          if (anchorRef.current) {
            requestAnimationFrame(() => {
              const { logId, relativePosition } = anchorRef.current!;
              const newIndex = logData.findIndex((log: any) =>
                log?.includes(logId)
              );

              if (newIndex !== -1) {
                logContainerRef.current?.scrollToIndex({
                  index: newIndex,
                  align:
                    relativePosition < 0.3
                      ? 'start'
                      : relativePosition > 0.7
                        ? 'end'
                        : 'center',
                  behavior: 'auto',
                });
              } else {
                console.warn('锁定的日志已被删除,自动恢复滚动。');
                setIsLocked(true);
                logContainerRef.current?.scrollToIndex({
                  index: logData.length - 1,
                  align: 'end',
                  behavior: 'auto',
                });
              }
            });
          }
        }
      }, 100),
    [logData, isLocked] // ❌ 依赖 logData,每次都重新创建
  );

  useEffect(() => {
    if (!logContainerRef.current || logData.length === 0) {
      return;
    }

    debouncedScroll();

    return () => {
      debouncedScroll.cancel();
    };
  }, [logData, isLocked]);
};

// ============================================
// 完整使用示例
// ============================================

/**
 * 在 LogMonitoring 组件中使用:
 * 
 * const LogMonitoring = () => {
 *   const [logData, setLogData] = useState<any[]>([]);
 *   const [isLocked, setIsLocked] = useState<boolean>(true);
 *   const logContainerRef = useRef<VirtuosoHandle>(null);
 *   const anchorRef = useRef<{ logId: string; relativePosition: number } | null>(null);
 *   
 *   // 使用优化后的滚动逻辑
 *   useOptimizedScroll_V1(
 *     logContainerRef,
 *     logData,
 *     isLocked,
 *     anchorRef,
 *     setIsLocked
 *   );
 *   
 *   // ... 其他逻辑
 * };
 */

// ============================================
// 内存影响分析
// ============================================

/**
 * Q: logDataRef 和 isLockedRef 会增加内存吗?
 * 
 * A: 几乎不会。
 * 
 * 详细分析:
 * 
 * 1. logDataRef.current = logData
 *    - 这是一个指针引用,大小约 8 bytes (64位系统)
 *    - logDataRef.current 指向 React state 中的 logData 数组
 *    - 不会复制数组内容,只增加一个引用
 *    - 旧的 logData 数组仍会被 GC 正常回收
 * 
 * 2. isLockedRef.current = isLocked
 *    - 这是一个布尔值引用,大小约 8 bytes
 *    - 完全可以忽略不计
 * 
 * 3. 对比原代码已有的 ref:
 *    - logContainerRef
 *    - logAllDataRef (存储 20000 条数据!)
 *    - firstRef
 *    - rangeRef
 *    - anchorRef
 *    - 新增的两个 ref 相比之下微不足道
 * 
 * 结论:
 * - 新增的 ref 只是指针引用,不会导致内存泄漏
 * - 不会阻止旧数组被 GC 回收
 * - 这是 React 官方推荐的模式
 * 
 * 真正的内存问题:
 * - setLogData([...prev, ...newData]) 创建新数组
 * - 每次创建大量临时对象
 * - GC 频繁回收导致性能下降
 */

// ============================================
// 为什么不能用 logData.length 作为依赖?
// ============================================

/**
 * 错误示例:
 * 
 * useEffect(() => {
 *   debouncedScroll();
 * }, [logData.length, isLocked]); // ❌ 错误!
 * 
 * 问题分析:
 * 
 * 当数据超过 20000 条时,会执行"首删尾插":
 * 
 * Before: [...19999条旧数据, 新数据1, 新数据2]
 *         长度 = 20002
 *         logData.length = 20002
 * 
 * After:  [新数据1, 新数据2, ...其他20000条]
 *         长度 = 20000
 *         logData.length = 20000
 * 
 * 下次:   [新数据2, 新数据3, ...其他20000条]
 *         长度 = 20000
 *         logData.length = 20000 (没变!)
 * 
 * 结果:
 * - 长度都是 20000,依赖不会触发更新
 * - 用户期望看到新数据自动滚动到底部
 * - 但滚动不会触发,用户体验受损
 * 
 * 正确做法:
 * 
 * useEffect(() => {
 *   debouncedScroll();
 * }, [logData, isLocked]); // ✅ 正确!依赖整个 logData
 */

export { useOptimizedScroll_V1 };
