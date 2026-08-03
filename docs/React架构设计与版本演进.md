# React 架构设计、Hooks 演进与高级面试指南

> 面向高级 / 资深前端工程师的面试回答与工程实践手册  
> 版本基线：React 19.2；官方版本页当前列出的最新补丁为 19.2.7（截至 2026-08-01，依据 React 官方版本页与发布公告核验）

## 目录

1. [一段话回答 React 的架构演进](#一段话回答-react-的架构演进)
2. [React 的核心设计原则](#react-的核心设计原则)
3. [从 Stack Reconciler 到 Fiber](#从-stack-reconciler-到-fiber)
4. [Fiber、调度、Render 与 Commit](#fiber调度render-与-commit)
5. [从 Class Component 到 Hooks](#从-class-component-到-hooks)
6. [Hooks 的运行原理与规则](#hooks-的运行原理与规则)
7. [闭包陷阱与依赖数组](#闭包陷阱与依赖数组)
8. [Effect 的正确定位与常见坑](#effect-的正确定位与常见坑)
9. [Context 的使用边界与优化](#context-的使用边界与优化)
10. [React 性能优化体系](#react-性能优化体系)
11. [Hooks、Memoization 与更新触发时机](#hooksmemoization-与更新触发时机)
12. [如何写出优雅、可维护的 React 代码](#如何写出优雅可维护的-react-代码)
13. [React 16 到 19.2 的关键更新](#react-16-到-192-的关键更新)
14. [React 19.2 与 React Compiler 1.0](#react-192-与-react-compiler-10)
15. [高频面试问题与参考回答](#高频面试问题与参考回答)
16. [面试回答模板](#面试回答模板)
17. [官方资料](#官方资料)

---

## 一段话回答 React 的架构演进

React 的核心始终是：**用声明式组件描述 UI，由 React 根据状态变化计算并提交最小必要的宿主环境更新**。它的架构演进不是从“虚拟 DOM”简单升级为“Hooks”，而是两条相互配合的主线：

- **运行时架构演进**：React 15 及以前的同步递归协调器，演进为 React 16 的 Fiber 可中断工作单元；React 18 再把并发渲染能力正式用于自动批处理、Transition、Suspense 与流式 SSR。
- **组件编程模型演进**：从 Class 的实例、生命周期和 `this`，演进到函数组件、Hooks、状态快照与基于数据依赖的同步模型；React 19 又通过 Actions、`use`、Server Components 生态和 React Compiler 继续降低异步状态及手工性能优化成本。

高级工程师需要同时理解两点：**Fiber 解决 React 如何安排工作，Hooks 解决开发者如何组织有状态逻辑。两者不是替代关系。**

---

## React 的核心设计原则

### 1. 声明式 UI

开发者描述“某个状态下 UI 应该是什么”，React 负责把前一次结果更新为下一次结果。组件 render 应当是纯计算：相同的 props、state、context 应产生相同的 JSX，不应在 render 中请求接口、修改 DOM 或产生不可回滚的外部副作用。

### 2. 单向数据流

数据通常由父组件通过 props 向下传递，事件通过回调向上传递。单向数据流降低了状态变化的追踪难度。Context 只是跨层级传值机制，并没有改变数据流方向。

### 3. 组合优于继承

React 通过组件组合、children、render props 和自定义 Hook 复用能力。Class 时代常用 HOC、render props 复用状态逻辑；Hooks 让状态逻辑可以直接组合，通常减少额外组件层级。

### 4. 状态是一次渲染的快照

函数组件每次执行都会形成一份独立的 props、state 和事件处理函数。调用 `setState` 是请求下一次渲染，并不会修改当前函数执行中的变量。这是理解闭包、批处理和并发渲染的基础。

### 5. 身份决定状态是否保留

React 通过组件在树中的位置、元素类型和 `key` 判断身份。相同位置且身份一致时通常保留状态；类型或 `key` 改变时会重置对应子树状态。`key` 不只是消除列表警告，它直接参与协调和状态身份判断。

---

## 从 Stack Reconciler 到 Fiber

### React 15 及以前：同步递归协调

早期协调过程主要沿组件树同步递归。一旦开始处理较大的更新，JavaScript 主线程可能长时间被占用，React 无法在树的中间安全暂停并优先响应输入、动画等高优先级任务。

问题并不是“虚拟 DOM 很慢”，而是：

- 一次更新的工作缺乏可暂停、恢复和废弃的边界；
- 不同更新难以按紧急程度调度；
- 大树同步计算可能形成长任务，影响输入响应和动画流畅度。

### React 16：Fiber 架构

Fiber 将组件树的协调工作表示为一组可遍历的工作单元。每个 Fiber 大致对应组件树中的一个节点，并通过 `child`、`sibling`、`return` 等关系形成可由循环驱动的链式树结构。

Fiber 带来的关键能力：

- 把渲染工作拆成可管理的单元；
- 可以暂停、恢复或放弃尚未提交的 render 工作；
- 可以为更新赋予不同优先级；
- 可以在后台准备一棵候选树，完成后再统一提交；
- 为并发渲染、Suspense、Transition 等能力奠定基础。

Fiber 并不意味着 React 在 Web Worker 中多线程渲染 DOM。React 的主要 JavaScript 工作通常仍运行在主线程；它通过调度和让出执行权提升响应性。

### 双缓冲思想

React 通常维护两套相关 Fiber：

- `current`：当前屏幕已经提交的树；
- `workInProgress`：正在计算的候选树；
- 两者通过 `alternate` 关联。

候选树可以被中断或废弃，因为在 Commit 前不会把不完整结果暴露给用户。完成后，React 再把新树提交为 current。这类似图形领域的双缓冲思想，但不要把它理解成两份完整 DOM。

---

## Fiber、调度、Render 与 Commit

### 更新链路

```text
事件 / 请求 / 外部订阅
        ↓
创建更新并标记优先级
        ↓
Scheduler 安排执行机会
        ↓
Render：计算下一棵 Fiber 树和副作用标记
        ↓
Commit：把完成的结果应用到 DOM，并处理相关 Effect
        ↓
浏览器布局与绘制
```

### Render 阶段

Render 阶段负责计算“下一次 UI 应该是什么”。在支持并发的更新中，这一阶段可能被暂停、恢复、重新执行或放弃。因此：

- render 必须保持纯净；
- 不能依赖“组件函数只执行一次”；
- 不能在 render 中发送请求、写入全局变量或直接修改 DOM；
- `useMemo` 也只是性能优化，不应承载必须执行的业务副作用。

### Commit 阶段

Commit 阶段把已完成的结果应用到宿主环境。它需要保持一致性，不能把半完成 UI 暴露给用户。概念上可关注：

- DOM 变更前的必要处理；
- DOM 插入、更新、删除和 ref 变更；
- `useLayoutEffect` 在浏览器绘制前执行；
- `useEffect` 通常在提交后以被动 Effect 的方式处理。

面试中不要说“React 的 Commit 阶段也能随时中断”。可中断主要描述 Render；DOM 提交通常必须一致地完成。

### 优先级与 Lane

现代 React 内部使用 Lane 模型表达更新优先级和可组合的更新集合。离散输入、普通更新、Transition 等工作可能进入不同 Lane。调度器据此决定先处理哪些工作、哪些工作可以稍后继续。

Lane 是内部实现，不属于稳定公共 API。面试中可以用它解释优先级，但不应让业务代码依赖具体位掩码或内部常量。

### Reconciliation 与“最小更新”

React 不会求解理论上的任意树最小编辑距离，而是采用启发式规则：

1. 元素类型不同，通常重建对应子树；
2. 同类型元素复用既有实例 / Fiber，并比较属性和子节点；
3. 列表通过 `key` 匹配稳定身份。

因此不应把 React 描述成“精确计算出全局最少 DOM 操作”。更准确的说法是：React 通过 O(n) 级别的启发式协调，确定必要的宿主更新。

### `key` 的典型陷阱

- 使用数组下标作为可变列表的 key，插入、删除、排序后可能让状态对应到错误数据；
- 每次 render 使用随机 key，会导致组件反复卸载和挂载；
- key 只需在同一组兄弟节点中唯一，不要求全局唯一；
- 有意更改 key 可以重置表单或子树状态。

---

## 从 Class Component 到 Hooks

### 为什么需要 Hooks

Hooks 于 React 16.8 正式发布，主要改善的是代码组织和逻辑复用：

- Class 的相关逻辑容易散落在多个生命周期中；
- 不相关逻辑又容易挤在同一个生命周期方法里；
- HOC、render props 会增加组件嵌套和命名冲突；
- `this`、方法绑定和实例可变状态增加理解成本；
- 状态逻辑很难在不改变组件结构的情况下复用。

Hooks 没有让 Class 立即失效，也不是因为 Class “不能优化”。它提供了一套更适合组合状态逻辑的函数式接口。

### Class 与 Hooks 对比

| 维度 | Class Component | Function Component + Hooks |
|---|---|---|
| 状态模型 | 实例上的可变 `this.state` | 每次 render 获得状态快照 |
| 更新方式 | `this.setState` 浅合并对象 | setter 替换该 state 值；对象需显式合并 |
| 生命周期 | 按 mount/update/unmount 分类 | Effect 按“同步目标”组织 setup/cleanup |
| 逻辑复用 | HOC、render props、继承（不推荐） | 自定义 Hook 组合逻辑 |
| 访问最新值 | 实例字段通常指向最新 props/state | 闭包捕获创建它的那次 render 快照 |
| 方法身份 | 实例方法可保持身份，需处理 `this` | 函数每次 render 创建；必要时 memoize |
| 代码组织 | 同一业务常拆到多个生命周期 | 同一同步过程放进同一个 Effect / Hook |
| 错误边界 | Class 可实现 `componentDidCatch` | React 19.2 核心仍没有等价的函数组件 Hook |
| 并发安全 | 旧代码可能依赖生命周期只执行一次 | 纯 render + 对称 Effect 更符合并发要求 |

### 生命周期不能机械映射

常见但不够准确的说法是：

```text
componentDidMount ≈ useEffect(..., [])
componentDidUpdate ≈ useEffect(..., [deps])
componentWillUnmount ≈ useEffect 的 cleanup
```

这只能帮助入门，不能作为设计模型。Class 生命周期围绕组件的“时间阶段”组织，而 Effect 围绕某个外部系统的“开始同步—停止同步”过程组织。一个 Effect 应代表一个独立同步过程，不应把所有 mount 逻辑塞进一个空依赖 Effect。

### `setState` 的重要差异

Class 的对象形式 `setState` 会对顶层 state 做浅合并：

```tsx
this.setState({ name: 'Ada' });
```

`useState` setter 会替换该 state 槽位的值：

```tsx
setUser(previous => ({ ...previous, name: 'Ada' }));
```

复杂且相关的状态转换可考虑 `useReducer`；不要为了模仿 Class 而把所有状态都塞进一个巨大对象。

---

## Hooks 的运行原理与规则

### 为什么 Hooks 不能写在条件分支中

在一个函数组件的 Fiber 上，Hooks 状态按稳定调用顺序关联。React 依赖第 N 次 Hook 调用找到第 N 个 Hook 对应的状态。如果某次 render 跳过了某个 Hook，后续 Hook 的对应关系就会错位。

```tsx
// 错误：条件变化后 Hook 调用顺序改变
if (enabled) {
  const [value, setValue] = useState(0);
}
```

正确做法是始终调用 Hook，把条件放到 Hook 内部逻辑中，或拆出新组件：

```tsx
const [value, setValue] = useState(0);

useEffect(() => {
  if (!enabled) {
    return;
  }
  // 同步逻辑
}, [enabled]);
```

### Hooks 的两条基础规则

1. 只在函数组件或自定义 Hook 的顶层调用 Hook；
2. 不在循环、条件、嵌套函数、事件处理器或普通工具函数中调用 Hook。

`use(promiseOrContext)` 是 React 19 的特殊资源读取 API，官方明确说明它不等同于普通 Hook，并允许在条件和循环中调用；但仍必须在组件或 Hook 内使用，也不能放进 `try/catch` 随意包裹挂起过程。

### 自定义 Hook 复用的是什么

自定义 Hook 复用的是**状态逻辑**，不是共享同一份状态。两个组件分别调用同一个 Hook，会获得两套独立状态。若要共享状态，需要状态提升、Context、外部 store 或服务端数据缓存等机制。

---

## 闭包陷阱与依赖数组

### 闭包不是 React 的 Bug

每次 render 都会创建新的函数，这些函数捕获当次 render 的 props 和 state。旧函数看到旧值，是 JavaScript 闭包和 React 状态快照共同作用的正常结果。

### 坑 1：定时器中的旧状态

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCount(count + 1); // 永远基于首次 Effect 捕获的 count
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return <span>{count}</span>;
}
```

推荐使用函数式更新，因为下一状态只依赖上一状态：

```tsx
useEffect(() => {
  const timer = window.setInterval(() => {
    setCount(current => current + 1);
  }, 1000);

  return () => window.clearInterval(timer);
}, []);
```

### 坑 2：异步回调读取旧值

```tsx
function SearchBox() {
  const [keyword, setKeyword] = useState('');

  function handleSearch() {
    window.setTimeout(() => {
      console.log(keyword); // 点击时那次 render 的 keyword
    }, 1000);
  }
}
```

先判断业务语义：

- 要的是“点击那一刻的值”：当前闭包正是正确行为；
- 要的是“回调执行时的最新值”：可用 ref 保存最新值；
- 逻辑属于 Effect 且只想读取最新已提交值、不希望其触发重同步：React 19.2 可用 `useEffectEvent`。

```tsx
const latestKeywordRef = useRef(keyword);
latestKeywordRef.current = keyword;

function handleSearchLater() {
  window.setTimeout(() => {
    console.log(latestKeywordRef.current);
  }, 1000);
}
```

不要把 ref 当成通用状态容器。修改 ref 不触发渲染；会影响页面展示的数据通常应该是 state。

### 坑 3：遗漏 Effect 依赖

```tsx
useEffect(() => {
  const connection = connect(roomId);
  return () => connection.disconnect();
}, []); // 错误：roomId 改变后仍连接旧房间
```

正确写法：

```tsx
useEffect(() => {
  const connection = connect(roomId);
  return () => connection.disconnect();
}, [roomId]);
```

依赖数组不是开发者凭感觉选择的执行时机列表，而是 Effect 代码所读取的响应式值清单。props、state，以及组件函数体内声明并被 Effect 使用的变量和函数，通常都属于响应式值。

### 坑 4：对象 / 函数依赖导致重复执行

```tsx
const options = { roomId };

useEffect(() => {
  const connection = connect(options);
  return () => connection.disconnect();
}, [options]); // 每次 render 都是新对象
```

优先把对象创建移入 Effect，仅依赖原始值：

```tsx
useEffect(() => {
  const options = { roomId };
  const connection = connect(options);
  return () => connection.disconnect();
}, [roomId]);
```

如果对象完全静态，可移到组件外。只有当稳定身份本身有价值时，才考虑 `useMemo` / `useCallback`；不要用 memoization 掩盖错误的 Effect 结构。

### 坑 5：通过禁用 ESLint“修复”依赖

```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => subscribe(userId), []);
```

这通常是在向 React 隐瞒真实依赖，可能产生难以复现的旧值 Bug。正确策略是改变代码结构：

- 事件引起的逻辑放入事件处理器；
- 不同同步目标拆成不同 Effect；
- 用函数式 state updater 去掉对旧 state 的读取；
- 静态值移到组件外；
- 动态对象在 Effect 内创建；
- 只读最新值但不响应变化时，使用 `useEffectEvent`（仅限 Effect 内调用场景）或谨慎使用 ref。

### React 19.2：`useEffectEvent`

```tsx
function ChatRoom({ roomId, theme }: Props) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected', theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', onConnected);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);
}
```

这里连接过程对 `roomId` 是响应式的，但通知只需在连接事件发生时读取最新 `theme`。`useEffectEvent` 将非响应式部分从 Effect 中分离出来。

注意：

- 它不是逃避依赖声明的工具；
- 只能从 Effect 或其他 Effect Event 中调用；
- 不用于普通点击事件，也不应传给子组件；
- Effect Event 不放进依赖数组。

---

## Effect 的正确定位与常见坑

### Effect 的定位

Effect 是把 React 与外部系统同步的逃生舱，例如：

- WebSocket、EventSource 或第三方 SDK 订阅；
- 浏览器 DOM / 媒体 API；
- 定时器；
- 非 React 小部件；
- 某些不由框架或数据层管理的网络同步。

如果没有外部系统，通常不需要 Effect。

### 常见误用与改法

#### 1. 用 Effect 计算派生数据

```tsx
// 不推荐：多一次提交和渲染，还可能短暂显示旧值
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(`${firstName} ${lastName}`), [firstName, lastName]);
```

```tsx
// 推荐：render 时直接计算
const fullName = `${firstName} ${lastName}`;
```

昂贵计算可在确认存在性能问题后使用 `useMemo`，而不是 Effect + state。

#### 2. 用 Effect 响应用户操作

提交订单、点击后通知等逻辑应直接放进事件处理器，因为事件处理器知道“发生了什么”。Effect 只知道组件因某些数据变化完成了提交，容易丢失事件语义。

#### 3. Effect 触发 Effect

多个 Effect 通过 state 串成瀑布，会产生额外渲染和脆弱的时序。若整个变化源自同一事件，应在事件中一次计算并提交；若状态可派生，应在 render 计算。

#### 4. 请求竞态

较早请求可能晚于较新请求返回，从而覆盖新数据。至少要在 cleanup 中忽略过期结果或使用 `AbortController`：

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function load(): Promise<void> {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        signal: controller.signal,
      });
      const user: User = await response.json();
      setUser(user);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  void load();
  return () => controller.abort();
}, [userId]);
```

大型应用更适合使用框架数据加载、服务端组件或具备缓存、去重、竞态处理的数据请求库，而不是每个组件手写 fetch Effect。

#### 5. cleanup 不对称

订阅、定时器、事件监听和连接都必须正确清理。应把一个 Effect 看作独立进程，确保 `setup → cleanup → setup` 与只执行一次在用户感知上等价。

#### 6. Strict Mode “执行两次”

开发环境 Strict Mode 会额外执行相关检查，包括一次额外的 Effect setup/cleanup 周期，以暴露不纯 render 和缺失清理。它不是生产环境重复执行的性能 Bug。解决方案是让逻辑幂等并补全 cleanup，不是关闭 Strict Mode 或增加“只运行一次”的 ref 开关。

#### 7. `useEffect` 与 `useLayoutEffect` 混用

- `useEffect`：不需要阻塞浏览器绘制的外部同步，优先使用；
- `useLayoutEffect`：必须在绘制前测量布局并同步调整 DOM 的少数场景；
- 滥用 `useLayoutEffect` 会阻塞绘制，影响响应速度；
- 服务端没有布局，SSR 代码需谨慎处理 layout effect。

---

## Context 的使用边界与优化

### Context 是什么

Context 让祖先向任意深度的后代提供值，消费者会读取并订阅最近的匹配 Provider。React 19 可以直接写：

```tsx
<ThemeContext value={theme}>
  <App />
</ThemeContext>
```

React 18 及更早版本通常写：

```tsx
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>
```

### 适合使用 Context 的场景

- 主题、语言、字号、方向等跨层级配置；
- 当前登录身份与权限能力（注意敏感信息边界）；
- 某个业务子树范围内共享的稳定服务或控制器；
- 组件库内部复合组件协作，如 Form、Tabs、Menu；
- `useReducer + Context` 管理中小规模、更新频率适中的领域状态；
- 避免确实没有中间层业务意义的深层 props 透传。

### 不适合直接使用 Context 的场景

- 高频变化且消费者很多的实时数据，例如鼠标位置、每帧动画值、大规模行情；
- 需要细粒度 selector、时间旅行、持久化或复杂中间件的全局状态；
- 只有一两层传递，props 已足够清晰；
- 为了避免给一个组件传 props，就把所有数据塞进全局 Context；
- 服务端远程数据缓存。远程数据有缓存、过期、去重、重试等语义，Context 本身不提供这些能力；
- 能通过组件组合或 children 自然解决的问题。

### 为什么不能滥用 Context

1. **扩大耦合范围**：消费者隐式依赖 Provider，组件的输入不再完全体现在 props 上；
2. **影响复用和测试**：脱离 Provider 后组件可能无法独立运行；
3. **更新传播较粗**：Provider 的 `value` 经 `Object.is` 判断发生变化时，读取该 Context 的消费者会重新渲染；`memo` 不能阻止消费者接收新的 Context 值；
4. **容易形成“万能全局仓库”**：不同更新频率和业务含义的数据混在一起，维护和性能都会恶化；
5. **Provider 层级不是主要问题，边界混乱才是**：多个职责清晰的 Provider 通常好过一个巨大且高频变化的 Context。

### 常见坑 1：每次 render 创建新 value

```tsx
function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext value={{ user, setUser }}>
      {children}
    </AuthContext>
  );
}
```

父组件任何重渲染都会创建新对象，使消费者获得新的 value。未使用 React Compiler 或需要显式身份控制时，可写为：

```tsx
function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({ user, setUser }),
    [user],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
```

`setUser` 身份稳定，因此通常无需加入依赖；保留它也不会造成错误。不要无条件给所有 Provider 加 `useMemo`，应结合消费者成本、更新频率、Compiler 使用情况和 Profiler 结果判断。

### 常见坑 2：状态与操作混在同一 Context

只调用 dispatch 的组件也会因 state value 改变而重渲染。可以拆分：

```tsx
const TodosStateContext = createContext<TodosState | null>(null);
const TodosDispatchContext = createContext<Dispatch<TodosAction> | null>(null);

function TodosProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(todosReducer, initialState);

  return (
    <TodosDispatchContext value={dispatch}>
      <TodosStateContext value={state}>
        {children}
      </TodosStateContext>
    </TodosDispatchContext>
  );
}
```

这能让只读取 dispatch 的组件不订阅 state Context，但读取整个 state 的组件仍会随 state 变化。需要 selector 粒度时，应考虑支持 selector 的外部 store，并通过 `useSyncExternalStore` 等并发安全接口集成。

### 常见坑 3：不安全的默认值

```tsx
const AuthContext = createContext<AuthContextValue | null>(null);

function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
```

这比伪造一个看似可用的默认对象更容易暴露 Provider 缺失。默认值是静态兜底，不会因为某处修改而自动更新。

### Context 决策表

| 场景 | 建议 |
|---|---|
| 主题、语言、身份 | Context |
| 仅跨 1～2 层传参 | 优先 props |
| 中间组件只负责布局 | 考虑 children / 组件组合 |
| 高频、细粒度全局状态 | 外部 store + selector |
| 服务端远程数据 | 框架数据层 / 请求缓存方案 |
| 局部复杂状态转换 | `useReducer`，必要时配合 Context |
| 表单局部字段 | 优先表单局部状态或专业表单方案 |

---

## React 性能优化体系

### 先建立正确模型

一次组件重新 render 不等于一定修改 DOM。React 会先计算，再在 Commit 中应用必要变化。优化目标不是消灭所有 render，而是降低用户可感知延迟、长任务、重复计算和不必要的提交。

### 优化顺序

1. 用 React DevTools Profiler、React 19.2 Performance Tracks 和浏览器 Performance 面板定位瓶颈；
2. 优化状态结构与组件边界；
3. 避免 Effect 瀑布和重复请求；
4. 虚拟化大列表、拆包和懒加载；
5. 区分紧急与非紧急更新；
6. 最后再做有证据的 memoization。

### 1. 状态就近放置

把输入框状态放到真正需要它的最小子树，不要因为顶层 state 每次变化而让整个页面参与 render。状态提升应服务于共享需求，而不是默认动作。

### 2. 避免冗余和互相矛盾的 state

能由 props/state 计算出的值不要再存 state。多个布尔值可能产生非法组合时，使用明确的联合状态：

```tsx
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: Error };
```

### 3. `memo`、`useMemo`、`useCallback`

- `memo`：props 按浅层 `Object.is` 比较相同时，可跳过组件 render；
- `useMemo`：缓存计算结果；
- `useCallback`：缓存函数身份，本质可理解为对函数值的 memoization；
- 它们是性能工具，不是语义保证；
- 如果子组件没有 memoized，单独稳定回调通常没有收益；
- 依赖频繁变化时缓存很快失效；
- 缓存也有比较、内存和复杂度成本。

适合场景：

- 经 Profiler 确认的昂贵纯计算；
- 传给昂贵且已 `memo` 的子组件；
- 某个稳定身份是其他 Hook 的必要依赖；
- 第三方 API 明确要求稳定引用。

### 4. 组件组合隔离更新

把不会随局部状态变化的内容作为 children 传入，可以自然缩小更新范围。相比到处手写 `memo`，良好的组件边界通常更稳定、更易读。

### 5. 大列表虚拟化

数千行 DOM 的主要成本往往不在协调算法，而在组件创建、DOM、布局和绘制。使用窗口化只渲染可视区域，通常比微调 `useMemo` 更有效。

### 6. 代码分割与 Suspense

通过 `lazy` 和路由级拆包减少首屏 JavaScript。Suspense 声明加载边界；它不是通用请求函数，数据源必须与支持 Suspense 的框架或缓存机制配合。

### 7. Transition 与 Deferred Value

- 输入框自身回显是紧急更新；
- 基于输入过滤大型列表可以标记为 Transition；
- `useDeferredValue` 让某个值的非紧急派生 UI 滞后更新；
- 它们提升调度和感知响应性，不会让昂贵算法凭空变快；
- 防抖控制“多久触发一次”，Transition 控制“更新优先级”，两者不是同一概念。

```tsx
const [text, setText] = useState('');
const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();

function handleChange(event: ChangeEvent<HTMLInputElement>): void {
  const next = event.target.value;
  setText(next);
  startTransition(() => {
    setQuery(next);
  });
}
```

### 8. 自动批处理

React 18 在 `createRoot` 下扩展了自动批处理范围，Promise、定时器、原生事件等来源的多个更新也通常会合并，减少重复 render。批处理意味着事件处理器中的 state 仍是当前 render 的快照。连续基于旧值更新时使用函数式 updater：

```tsx
setCount(value => value + 1);
setCount(value => value + 1);
setCount(value => value + 1);
```

### 9. 不可变更新

React 常依赖引用变化判断值是否改变。直接修改 state 可能导致无法正确触发更新、破坏历史快照并影响 memoization。应创建新对象 / 数组；深层状态过于难改时，优先重新设计扁平状态结构，而不是无限深拷贝。

---

## Hooks、Memoization 与更新触发时机

### 先纠正“Hook 什么时候触发”的说法

面试中应区分以下概念：

- **组件 render**：React 调用函数组件，计算 JSX；
- **Hook 调用**：Hook 随组件函数在 render 中按顺序调用；
- **缓存计算**：例如 `useMemo` 根据依赖决定复用还是重新计算；
- **更新入队**：调用 state setter / dispatch，把更新加入队列；
- **Commit**：React 把完成的结果应用到 DOM；
- **Effect 执行**：提交阶段相关时机执行 setup / cleanup。

`useMemo`、`useCallback` 本身不会触发组件更新。它们只能在一次已经发生的 render 中决定返回缓存还是新值。`memo` 也不“触发更新”，而是在父组件更新导致协调到该子组件时，提供跳过子组件 render 的机会。

### 一张表看懂常见 API 的时机

| API | 初次执行 / 创建 | 何时重新处理 | 是否主动触发 render | 关键说明 |
|---|---|---|---|---|
| `useState(initial)` | 首次挂载读取初始值；函数 initializer 只用于初始化 | setter 入队后，React 在后续 render 处理更新队列 | setter 会请求更新 | 新旧值 `Object.is` 相同通常跳过子树更新 |
| `useReducer` | 首次挂载计算初始状态 | `dispatch` 后在 render 中执行 reducer 处理更新 | dispatch 会请求更新 | reducer 与 initializer 必须纯净 |
| `useRef` | 首次创建稳定 ref 对象 | 后续 render 返回同一对象 | 修改 `current` 不触发 | 适合不参与 UI 的可变值 |
| `useMemo` | 初次 render 调用计算函数 | 某个依赖按 `Object.is` 改变，或缓存被 React 丢弃时 | 不会 | 缓存计算结果，计算函数必须纯净 |
| `useCallback` | 初次 render 保存函数定义 | 某个依赖变化时返回本次 render 的新函数 | 不会 | 不执行传入函数，只缓存函数身份 |
| `memo` | 组件首次挂载正常 render | 父组件更新时比较新旧 props；不同则 render | 不会 | 自身 state、Context 变化仍可 render |
| `useContext` | render 时读取最近 Provider | Provider value 按 `Object.is` 变化 | Context 变化会请求消费者更新 | `memo` 不能屏蔽 Context 新值 |
| `useEffect` | Commit 后进行外部同步 | 依赖变化时先旧 cleanup、后新 setup；卸载时 cleanup | Effect 内 setter 可再请求更新 | 不用于纯派生数据 |
| `useLayoutEffect` | DOM 提交后、浏览器重绘前 | 依赖变化时 cleanup/setup | 内部 setter 可在绘制前同步处理 | 会阻塞绘制，应少用 |
| `useInsertionEffect` | Commit 中、layout Effect 之前 | 依赖变化时 cleanup/setup | 不能在内部更新 state | 面向 CSS-in-JS 库作者 |
| `useTransition` | render 时返回 pending 与启动函数 | 启动 Transition 后跟踪非紧急工作 | 被包裹的 setter 请求非紧急更新 | 不应用于受控输入的直接回显 |
| `useDeferredValue` | render 时读取值 | 紧急 render 先用旧值，后台尝试新值 | 不替代 setter | 可中断，不等于固定时间防抖 |
| `useImperativeHandle` | layout Effect 相关提交时机更新 ref handle | 依赖变化时重新创建 handle | 不会 | 仅暴露必要的命令式能力 |

### `useMemo` 的执行与失效时机

```tsx
const visibleRows = useMemo(
  () => expensiveFilter(rows, query),
  [rows, query],
);
```

执行规则：

1. 初次 render 会调用计算函数；
2. 后续 render 中，若所有依赖与上次相比都满足 `Object.is`，返回上次缓存；
3. 任一依赖不同，会在当前 render 中重新调用计算函数；
4. `useMemo` 计算发生在 Render 阶段，可能因并发渲染被重复、暂停或废弃，所以必须是纯计算；
5. 开发环境 Strict Mode 可能额外调用计算函数以检查纯度；
6. React 在特定情况下可以丢弃缓存，例如组件初次挂起等，因此不能把它当持久化存储或业务语义保证。

常见误区：

```tsx
// 错误理解：组件 render 之后才计算
// 正确理解：expensiveFilter 是本次 render 计算的一部分
const result = useMemo(() => expensiveFilter(data), [data]);
```

`useMemo` 适合昂贵纯计算或必要的引用稳定。不适合网络请求、埋点、修改变量、更新 state 等副作用。

### `useCallback` 的执行与失效时机

```tsx
const handleSave = useCallback(() => {
  saveDocument(documentId);
}, [documentId]);
```

- render 时 React 接收函数定义，但不会执行函数体；
- 依赖未变时，返回上次缓存的函数对象；
- `documentId` 变化时，返回本次 render 创建的新函数；
- 函数体只在调用 `handleSave()` 时执行；
- 它仍然是闭包，捕获与依赖对应的 render 快照；
- 漏写依赖会得到稳定但过期的函数，这是 Bug，不是优化。

`useCallback(fn, deps)` 在概念上近似 `useMemo(() => fn, deps)`，区别主要是 API 表意。

### `memo` 的判断时机

```tsx
const UserCard = memo(function UserCard({ user, onSelect }: Props) {
  return <button onClick={() => onSelect(user.id)}>{user.name}</button>;
});
```

父组件重新 render 并再次产生 `<UserCard>` 元素时，React 在协调过程中比较前后 props。默认逐项使用 `Object.is`：

- props 都相同：React 通常复用上次结果，跳过 `UserCard` 函数执行；
- 任意 prop 不同：执行 `UserCard`；
- `UserCard` 自己的 state 改变：仍会执行；
- `UserCard` 读取的 Context 改变：仍会执行；
- 祖先 render 不代表它一定 Commit，也不代表 DOM 一定变化。

对象、数组和函数每次创建通常都有新引用：

```tsx
// Parent 每次 render 都产生新对象和新函数，memo 很难命中
<UserCard user={{ id, name }} onSelect={() => selectUser(id)} />
```

优先改善 props API，例如传最小必要的原始值；确认值得优化后，再用 `useMemo` / `useCallback` 稳定引用。

### 自定义比较函数的陷阱

```tsx
const Chart = memo(ChartView, (previous, next) => {
  return previous.points === next.points;
});
```

自定义比较返回 `true` 表示“可以跳过”，返回 `false` 表示“需要 render”。风险包括：

- 忘记比较函数 prop，子组件可能长期调用旧闭包；
- 深比较成本可能高于重新 render；
- 数据结构以后新增字段，比较函数容易漏改；
- 必须用生产构建和 Profiler 验证实际收益。

### 三者如何配合

```tsx
const ProductList = memo(function ProductList({ items, onSelect }: Props) {
  return items.map(item => (
    <button key={item.id} onClick={() => onSelect(item.id)}>
      {item.name}
    </button>
  ));
});

function SearchPage({ products }: SearchPageProps) {
  const [query, setQuery] = useState('');

  const visibleProducts = useMemo(
    () => filterProducts(products, query),
    [products, query],
  );

  const handleSelect = useCallback((id: string) => {
    navigate(`/products/${id}`);
  }, []);

  return (
    <>
      <input value={query} onChange={event => setQuery(event.target.value)} />
      <ProductList items={visibleProducts} onSelect={handleSelect} />
    </>
  );
}
```

- `useMemo` 尽量让 `items` 在输入未变时保持引用；
- `useCallback` 尽量让 `onSelect` 保持引用；
- `memo` 在两项 props 均未变化时跳过列表 render；
- 若过滤很轻、列表很小，这套缓存可能比直接 render 更复杂，不应机械套用；
- 启用 React Compiler 后，大量常规 memoization 可由编译器完成，但仍需正确建模状态和副作用。

### 什么会让组件重新 render

常见来源包括：

1. 自身 state setter / reducer dispatch 产生有效更新；
2. 父组件 render 后，子组件正常参与协调且未成功 bailout；
3. 所读取的 Context value 改变；
4. `useSyncExternalStore` 订阅的 snapshot 改变；
5. 组件被卸载后因类型、位置或 key 变化重新挂载——这是新实例，不只是普通 re-render；
6. 开发环境 Strict Mode 的额外检查调用。

以下操作不会单独触发 render：

- 修改普通局部变量；
- 修改 `ref.current`；
- 改变未被 React 订阅的模块级变量；
- 调用 `useMemo` / `useCallback`；
- 仅修改对象内部字段但仍把同一引用交给 state setter。

### 调用 setter 后发生什么

```text
调用 setter / dispatch
        ↓
创建并入队更新，标记优先级
        ↓
React 根据事件边界与优先级进行批处理和调度
        ↓
Render：处理更新队列，计算候选树
        ↓
可能暂停、重试或放弃低优先级 render
        ↓
Commit：应用完整结果到 DOM
        ↓
layout Effect → 浏览器绘制 → passive Effect（常见情况）
```

最后一行是帮助理解的常见顺序，不应把 `useEffect` 简化成绝对固定的宏任务。React 可能根据更新是否由交互触发、调度策略和平台时机，在绘制前或绘制后处理 passive Effect；如果业务严格依赖绘制前时机，应使用语义明确的 `useLayoutEffect`。

### 批处理、状态队列与快照

```tsx
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);
```

三行读取的是同一次 render 的 `count`，相当于多次请求替换成同一个值，结果通常只增加 1。

```tsx
setCount(current => current + 1);
setCount(current => current + 1);
setCount(current => current + 1);
```

函数式 updater 会在下一次 render 处理队列时依次得到前一个更新的结果，因此增加 3。Updater 在 Render 阶段处理，必须保持纯净；Strict Mode 开发检查可能调用两次以发现不纯逻辑。

React 通常等待当前事件处理器代码执行完，再批量处理其中的更新，避免页面出现“只更新了一半”的中间状态。React 不会把两个独立的用户点击无条件合并成一个业务事件。

### 相同 state 为什么有时仍看到组件函数被调用

当新状态与当前状态满足 `Object.is` 时，React 会跳过组件及其子树的更新。但官方明确说明，某些情况下 React 仍可能需要调用组件函数后再决定跳过子树。组件 render 必须纯净，不能依赖“同值 setter 后函数绝不调用”。

```tsx
setValue(previous => previous); // 通常 bailout，但不应作为控制副作用的机制
```

### Effect、Layout Effect 与浏览器绘制

常见客户端提交时序可这样回答：

1. React 完成 Render；
2. Commit 中更新 DOM；
3. ref 就绪并处理 layout Effect；
4. `useLayoutEffect` 内更新会在浏览器重绘前继续处理，因此会阻塞绘制；
5. 浏览器获得绘制机会；
6. `useEffect` 作为 passive Effect 处理外部同步，通常不阻塞绘制。

`useInsertionEffect` 是 CSS-in-JS 库注入样式的特殊入口，发生在 layout Effect 之前。普通业务代码不应使用它，也不能假设其中 ref 已挂载或随意读取 DOM。

### `flushSync` 什么时候用

`flushSync` 强制 React 同步刷新回调中的更新，返回时 DOM 已更新，主要用于必须满足同步 DOM 契约的第三方系统或浏览器 API：

```tsx
flushSync(() => {
  setIsPrinting(true);
});

// 此处 DOM 已反映 isPrinting = true
window.print();
```

它是最后手段：可能显著损害性能、提前刷新其他 pending 工作、运行 pending Effect，甚至让 Suspense fallback 重新出现。不能在 render、Effect 或生命周期执行过程中直接调用它来强行嵌套刷新。

### Transition 更新什么时候发生

```tsx
startTransition(() => {
  setFilteredQuery(nextQuery);
});
```

传给 `startTransition` 的函数会立即执行，但其中同步安排的 state 更新会被标记为非紧急 Transition。React 可以在其 Render 过程中暂停或被输入等紧急更新打断。

React 19 支持 async Transition / Action，但当前在 `await` 之后直接调用的 setter 仍需再包一层 `startTransition` 才能确保被标记为 Transition：

```tsx
startTransition(async () => {
  const result = await saveData();

  startTransition(() => {
    setResult(result);
  });
});
```

受控输入的 value 更新必须同步、紧急地反映用户输入，不应直接放入 Transition；可以把耗时的派生列表或页面切换放入 Transition。

---

## 如何写出优雅、可维护的 React 代码

### 1. Render 保持纯净

- 不在 render 中请求接口、订阅或修改 DOM；
- 不修改 props、state、context 或模块级共享对象；
- 不依赖调用次数；
- 派生数据直接计算。

### 2. 按业务能力拆组件，不按标签拆组件

组件应有清晰职责和输入输出。不要把每个 `<div>` 都抽成组件，也不要让一个页面组件同时负责请求、权限、表单、图表转换和所有展示。

### 3. 自定义 Hook 封装同步协议

好的自定义 Hook 隐藏订阅、清理、竞态等细节，暴露稳定的业务接口：

```tsx
function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeToNetwork,
    getNetworkSnapshot,
    getServerNetworkSnapshot,
  );
}
```

不要为了“复用两行代码”就抽 Hook。Hook 应表达有意义的状态逻辑或外部同步协议。

### 4. 事件命名表达语义

内部处理函数使用 `handleXxx`，对外回调使用 `onXxx`。与其向通用组件传 `onClick`，业务组件可暴露 `onSave`、`onDelete`，让实现可以从点击演进为键盘或其他交互。

### 5. Reducer 保持纯净

Reducer 只计算下一状态，不请求接口、不写存储。Action 描述发生的事实，而不是随意传一个“设置所有东西”的函数。

### 6. 明确受控与非受控边界

可复用表单组件要么由 props 完全控制，要么内部管理默认值。避免同一字段同时由内部 state 和外部 props 竞争控制。

### 7. 避免过早抽象

先识别稳定重复模式，再抽组件或 Hook。过度配置化的万能组件往往产生大量布尔 props 和分支；合理的组合 API 更易扩展。

### 8. TypeScript 建模状态，而不只是补类型

- 使用判别联合消除非法状态；
- 事件参数使用明确的 React 事件类型；
- Context 默认值用 `null` 并由自定义 Hook 校验；
- 不用 `any` 绕过数据边界，在解析接口数据时把输入视为 `unknown` 并验证。

### 9. 注释解释“为什么”

不要注释 JSX 做了什么；应解释为何必须保持引用稳定、为何某段逻辑属于 Effect、为何需要兼容第三方 API 等设计约束。

### 10. 性能代码必须可证明

在代码评审中说明性能问题的测量方式、优化前后数据和约束。没有证据的 `useMemo` / `useCallback` 堆积会降低可读性，并可能在依赖写错时引入语义 Bug。

---

## React 16 到 19.2 的关键更新

| 版本 | 关键变化 | 架构意义 |
|---|---|---|
| React 16 | Fiber、新错误边界、Fragments、Portals 等 | 协调器架构重写，为增量与优先级调度打基础 |
| React 16.8 | Hooks | 函数组件获得状态与 Effect，状态逻辑可组合复用 |
| React 17 | 渐进升级、事件系统调整 | 更易在同一页面逐步升级多个 React 版本 |
| React 18 | Concurrent Renderer 基础、自动批处理、Transitions、`useDeferredValue`、`useId`、流式 SSR + Suspense | 可中断渲染能力进入稳定产品特性 |
| React 19 | Actions、`useActionState`、`useOptimistic`、`use`、form Actions、ref 作为 prop、文档元数据、资源预加载、改进 hydration 错误 | 简化异步交互、表单和资源读取，推动客户端与服务端协作 |
| React 19.2 | `<Activity>`、`useEffectEvent`、`cacheSignal`、Performance Tracks、部分预渲染相关服务端 API、SSR 改进 | 状态保留、Effect 建模、缓存生命周期、性能诊断与服务端渲染继续演进 |

不要把所有框架功能都归于 React 核心：文件路由、Server Actions 的具体传输协议、缓存策略、部署模型等通常由 Next.js 等框架提供。React Server Components 定义组件与打包器层面的模型，但具体生产集成依赖框架。

---

## React 19.2 与 React Compiler 1.0

### React 19 的 Actions

Action 是对异步 Transition 约定的称呼。React 19 围绕 Action 提供：

- pending 状态管理；
- `useOptimistic` 乐观更新；
- `useActionState` 管理 Action 返回状态；
- `<form action={fn}>` 和 `formAction` 函数；
- React DOM 的 `useFormStatus`。

这些 API 减少表单提交中的 loading、错误、乐观回滚等样板代码，但不会替代业务校验、鉴权、幂等和服务端数据一致性设计。

### `use`

`use` 可以读取 Promise 或 Context。读取 pending Promise 时组件会挂起，由最近的 Suspense 边界处理 loading。它不是任意场景下直接创建 Promise 的许可：在 Client Component render 中反复创建新 Promise 会造成不稳定，应由框架、服务端或兼容缓存提供稳定资源。

### `<Activity>`

React 19.2 的 `<Activity>` 用于控制一部分 UI 的可见性和优先级。隐藏模式下可以保留子树状态，同时清理 Effect，并以较低优先级继续预渲染相关工作。它把 React 18 时期讨论的部分 Offscreen 愿景变成公开能力。

### `cacheSignal`

`cacheSignal` 面向 React Server Components 的缓存生命周期，使缓存作用域失效时，相关异步工作能够收到中止信号。它不是浏览器端通用请求缓存 Hook。

### Performance Tracks

React 19.2 为 Chrome DevTools Performance 面板增加 React 性能轨道，帮助观察 Scheduler、组件 render 和 Effect 等工作。它补充而不是取代 React DevTools Profiler。

### 部分预渲染与 SSR

React 19.2 增加了与部分预渲染恢复相关的服务端 API，并改进 Suspense 边界的服务端 reveal 批处理与 Web Streams 支持。实际路由、构建、缓存和部署仍通常由框架封装。

### React Compiler 1.0

React Compiler 1.0 于 2025-10-07 发布稳定版。它是构建期优化编译器，通过分析 React 组件和 Hooks 的数据流、可变性及 React 规则，进行自动 memoization。

正确理解：

- 它减少手写 `memo`、`useMemo`、`useCallback` 的需要；
- 它不消除 render，也不保证所有组件永不重渲染；
- 它不能修复错误的状态架构、Effect 瀑布、巨大 DOM 或低效算法；
- 现有手工 memoization 不应未经测试批量删除；
- 需要精确控制引用身份时，手工 memoization 仍可作为逃生舱；
- 编译器与新的 `eslint-plugin-react-hooks` 规则能暴露违反 React 规则的潜在问题；
- 官方说明 Compiler 可兼容 React 17+，旧版本需配置目标和运行时支持。

### 稳定能力与框架 / 实验能力必须区分

截至本文日期：

- React 19.2 是官方版本页列出的最新文档版本，最新补丁记录为 19.2.7；生产项目不应停留在 19.2.0；
- React Compiler 1.0 已稳定；
- `<Activity>`、`useEffectEvent`、`cacheSignal` 随 React 19.2 发布；
- React Server Components 的组件模型已进入 React 19 语境，但底层打包器实现 API 可能在 React 19.x 小版本间发生变化，框架应固定或协调版本；
- View Transitions、Fragment Refs 等若只出现在 Canary / Labs 说明中，不能在面试中不加限定地称为 React 19.2 稳定核心能力。

### React Server Components 安全版本提醒

React 官方在 2025 年底披露过 React Server Components 相关严重漏洞，并发布了多轮修复。只使用纯客户端 React、且构建链不支持 RSC 的应用不受这些特定 RSC 漏洞影响；使用 RSC 的项目必须跟随框架与 React 官方安全公告升级，不能只满足于 `19.2.x` 这个模糊范围。按截至本文日期的官方版本记录，应优先使用当前维护线的最新补丁，并同步升级框架和 `react-server-dom-*` 适配包。

---

## 高频面试问题与参考回答

### 1. Virtual DOM 为什么不一定比直接操作 DOM 快？

Virtual DOM 的主要价值是提供声明式编程和跨平台协调模型，并通过批量、比较和调度减少不必要的宿主更新。对于一个已知且简单的 DOM 修改，精准的手写 DOM 操作可能更快；React 的优势是让复杂 UI 更新保持可预测、可组合，并获得一致的优化空间。

### 2. Fiber 解决了什么问题？

Fiber 把原先难以暂停的同步递归协调改造成可管理的工作单元，使 React 能够为更新分配优先级，并暂停、恢复或放弃尚未提交的 render 工作。它为并发渲染、Suspense 和 Transition 提供运行时基础。

### 3. 并发渲染是不是多线程？

不是。并发描述 React 可以让不同优先级的渲染工作交错推进，render 可以中断或废弃；主要 JavaScript 和 DOM 提交仍通常在主线程。它优化的是调度与响应性，不等同于并行计算。

### 4. Render 和 Commit 有什么区别？

Render 计算下一棵树，可以被重复或在并发更新中中断，因此必须纯净。Commit 把完成结果应用到 DOM 并处理 ref、layout effect 等，需要保证 UI 一致，通常不可像 Render 那样任意中断。

### 5. React diff 真的是 O(n) 吗？

React 基于“不同类型产生不同子树”和“key 标识稳定子节点”等假设进行线性级启发式协调。说 O(n) 是对该启发式过程的概括，不代表它计算任意两棵树的数学最优编辑方案，也不代表整体渲染成本永远严格为 O(n)。

### 6. 为什么不能用数组下标作为 key？

静态、永不排序和增删的列表可以使用下标，但可变列表中，下标代表位置而不是数据身份。插入或排序后，React 可能复用错误组件状态，导致输入值、焦点或动画与数据错配。应使用稳定的业务 ID。

### 7. Hooks 相比 Class 优化了什么？

Hooks 的核心收益不是语法更短，而是让相关状态逻辑按业务同步过程聚合，并通过自定义 Hook 组合复用，减少 HOC / render props 的额外层级和 Class 的实例心智负担。它同时强化了纯 render 和状态快照模型，更适合可中断渲染与编译器静态分析。

### 8. `useEffect` 能完全对应 Class 生命周期吗？

不能。生命周期描述组件处于 mount/update/unmount 的时间节点；Effect 描述组件与某个外部系统如何开始和停止同步。可以做近似迁移，但设计新代码时应按同步目标拆分 Effect，而不是机械模拟生命周期。

### 9. 什么是 stale closure？

函数捕获了创建它的那次 render 的 props/state，稍后执行时仍看到该快照。解决方式取决于语义：基于前值更新用函数式 updater；需要重新同步就声明完整依赖；需要最新可变值但不触发 render 可谨慎用 ref；Effect 内非响应式逻辑在 React 19.2 可用 `useEffectEvent`。

### 10. 为什么不能随便删 Effect 依赖？

依赖数组描述 Effect 读取的响应式值。遗漏依赖会让同步过程继续使用旧闭包。若某个依赖导致不必要执行，应重构代码以证明它不再是依赖，而不是禁用 `exhaustive-deps`。

### 11. `useCallback` 能解决闭包问题吗？

不能自动解决。`useCallback` 只在依赖不变时缓存函数身份；依赖漏写仍会冻结旧闭包。它主要用于引用身份优化，不是获取最新 state 的工具。

### 12. ref 与 state 的区别？

state 参与渲染，更新会请求下一次 render；ref 是跨 render 保留的可变容器，修改 `current` 不触发 render。DOM 引用、定时器 ID、无需展示的最新值可用 ref；任何决定 UI 的数据通常应使用 state。

### 13. `useMemo` 有什么坑？

它不是语义保证，React 可以在特定情况下丢弃缓存。过度使用会增加依赖维护、比较与内存成本。依赖写错还会产生旧值。只为昂贵纯计算、稳定引用需求或经测量的渲染瓶颈使用。

### 14. React.memo 为什么没有阻止 Context 消费者重渲染？

`memo` 比较 props，而 `useContext` 建立了独立订阅。Provider value 变化时，消费者需要获得新 Context。可通过拆分 Context、缩小 Provider、稳定 value 或改用支持 selector 的 store 降低更新范围。

### 15. Context 和 Redux / Zustand 等外部 store 如何选？

Context 适合跨层传递更新频率适中的环境值或领域依赖；它没有 selector、缓存、中间件和开发工具等完整状态管理能力。高频、细粒度订阅和复杂全局状态更适合外部 store。选择依据是更新模式和工程能力，不是项目大小这一项。

### 16. Context 能替代 props 吗？

不能。props 是显式组件 API，最利于复用和追踪；Context 适合真正跨层共享的数据。先考虑 props 和组合，只有当跨层传递确实造成结构噪声时再使用 Context。

### 17. `useReducer + Context` 是否等于 Redux？

不等于。它可以实现集中状态转换和跨层共享，但没有默认的 selector 订阅、middleware、DevTools、持久化和成熟生态。消费者粒度也取决于 Context 的拆分方式。

### 18. React 18 自动批处理改变了什么？

在新 root API 下，来自 React 事件、Promise、定时器和原生事件等来源的多个更新通常都会批处理，从而减少重复 render。若下一状态依赖上一状态，仍应使用函数式 updater。

### 19. `startTransition` 和防抖有什么区别？

Transition 不减少更新触发次数，而是把更新标记为非紧急，使输入等高优先级工作可以先响应；防抖通过等待一段时间减少实际触发次数。搜索场景中可同时使用，但解决的是不同问题。

### 20. Suspense 是否会自动请求数据？

不会。Suspense 负责声明挂起时的 UI 边界。数据读取必须来自支持 Suspense 的框架、缓存或资源机制。直接在 render 中每次创建 Promise 通常会造成重复挂起和缓存问题。

### 21. SSR 与 React Server Components 有什么区别？

SSR 是把 React 树在服务器生成 HTML，以改善首屏和可索引内容，客户端组件通常仍需 hydration。Server Components 是让一部分组件只在服务器执行，并把序列化结果传给客户端，从而减少客户端 JavaScript，并可直接访问服务端资源。二者可以组合，但概念和传输产物不同。

### 22. hydration 是什么？

服务端已经输出 HTML 后，客户端 React 根据同一组件树附加事件和建立运行时状态。服务端与客户端初次输出不一致会产生 hydration mismatch。时间、随机数、浏览器专属值等需保证首轮一致或移到合适的客户端同步阶段。

### 23. Strict Mode 为什么会重复 render / Effect？

开发环境通过额外调用暴露 render 不纯、cleanup 缺失和对“只执行一次”的错误假设。生产环境不执行这些开发检查。正确修复是保证纯度、幂等和对称清理。

### 24. Error Boundary 能否捕获所有错误？

不能。它主要捕获后代 render、生命周期等过程中的错误；通常不捕获事件处理器、任意异步回调、服务端渲染错误以及边界自身错误。事件与异步流程需要各自处理。React 19.2 仍常用 Class 或框架 / 库提供的错误边界封装。

### 25. React Compiler 是否意味着不再写 `useMemo`？

大多数新代码可以优先依赖 Compiler 自动 memoization，但手工 API 仍是精确控制的逃生舱。已有代码不应机械删除 memoization；应结合编译结果、Effect 身份依赖、性能测试和端到端测试逐步迁移。

### 26. 为什么 reducer 必须是纯函数？

React 可能重复调用 render 相关逻辑以检查纯度或准备并发结果。Reducer 若修改外部对象或执行请求，会产生不可预测的重复副作用，并破坏状态快照。副作用应放在事件、Effect 或专门的数据层中。

### 27. `useEffectEvent` 和 `useCallback` 有什么区别？

`useCallback`用于稳定可传递函数的身份，仍遵循依赖和闭包规则；`useEffectEvent` 用于 Effect 内部的非响应式逻辑，总能读取最新已提交值，只能从 Effect 体系中调用，也不进入依赖数组。二者用途不同。

### 28. 为什么组件定义不能随意写在另一个组件内部？

父组件每次 render 都会创建一个新的组件函数类型。React 会把它识别为不同类型，导致子树反复卸载、状态重置和 DOM 重建。应把组件定义放在模块顶层；普通渲染辅助函数则根据需要判断。

### 29. state 更新后为什么立即读取还是旧值？

当前事件处理器属于当前 render 快照，setter 请求的是下一次 render。需要计算下一值时可先保存变量，连续基于前值更新时用函数式 updater。不要期待 setter 同步修改当前局部变量。

### 30. 如何系统性优化一个慢页面？

先用性能工具定位 render、Commit、JavaScript、网络、布局或绘制瓶颈；再检查状态是否过高、Effect 是否形成瀑布、列表是否需要虚拟化、包是否过大、更新能否使用 Transition。最后对明确的昂贵组件或计算做 memoization，并对比优化前后指标。

### 31. `useMemo` 什么时候执行？会触发 render 吗？

计算函数在初次 render 执行，后续已经发生的 render 中，如果依赖按 `Object.is` 比较发生变化才重新执行。它不会触发 render，只是本次 render 的一部分。由于 Render 可能被重试或放弃，计算函数必须纯净。

### 32. `useCallback` 中的函数什么时候执行？

`useCallback` 在 render 时缓存函数对象，不执行函数体。函数体只在事件、Effect 或其他调用方真正调用它时执行。依赖变化时返回新函数；遗漏依赖可能形成 stale closure。

### 33. `memo` 在什么时候比较 props？

父组件更新并协调到该子组件时比较前后 props，默认逐项使用 `Object.is`。相同则通常跳过子组件函数执行；不同则 render。首次挂载不跳过，自身 state 与读取的 Context 变化也不受 props 比较阻挡。

### 34. `memo`、`useMemo`、`useCallback` 的本质区别？

- `memo` 缓存组件上一次渲染结果的可复用机会，比较对象是 props；
- `useMemo` 缓存计算结果；
- `useCallback` 缓存函数身份；
- 三者都是性能优化，不应决定业务正确性。

### 35. 为什么到处使用 `useCallback` 可能更慢？

每次 render 仍需创建函数表达式、读取 Hook、比较依赖并保留缓存，还增加代码和闭包维护成本。如果回调没有传给 memoized 子组件，也不是其他 Hook 的身份依赖，稳定引用通常没有可观收益。

### 36. `Object.is` 与 `===` 对 React 比较有什么影响？

多数值行为相同，但 `Object.is(NaN, NaN)` 为 `true`，`Object.is(0, -0)` 为 `false`。更重要的是对象、数组和函数按引用比较，即使内容一样，新创建的引用也不同。这影响 state bailout、Hook 依赖、Context value 和 `memo` props 比较。

### 37. 调用 state setter 到 DOM 更新经历什么？

setter 先把带优先级的更新加入队列；React 按批处理和调度策略开始 Render，处理更新队列并计算候选树；低优先级 Render 可被暂停或废弃；完整结果进入 Commit 后才修改 DOM。setter 调用本身不等于 DOM 已经同步变化。

### 38. 为什么 `console.log(state)` 紧跟在 setter 后仍是旧值？

当前事件处理器闭包属于当前 render 快照，setter 请求下一次 render，不会修改当前局部变量。如果后续计算依赖下一值，可先计算 `const next = ...`；若依赖更新队列的前值，应使用函数式 updater。

### 39. React 什么时候进行批处理？

React 会把安全范围内的多个 state 更新合并处理，React 18 的新 root 扩大到 Promise、定时器和原生事件等来源。React 通常在当前事件处理代码结束后处理队列，但不会把两个独立用户事件无条件合并为同一个业务事件。

### 40. `flushSync` 为什么不应常用？

它强迫 React 立即刷新 DOM，破坏正常调度和批处理，可能刷新额外 pending 工作、运行 Effect 或让 Suspense fallback 出现。仅在浏览器 API、第三方控件等明确要求回调结束前 DOM 必须更新时使用。

### 41. `useLayoutEffect` 中更新 state 会发生什么？

React 会在浏览器重绘前处理该更新并再次 render/commit，使用户通常只看到最终布局。这适合必须测量后修正位置的 UI，但会阻塞绘制，滥用会增加交互延迟。

### 42. 为什么网络请求不适合放进 `useMemo`？

`useMemo` 计算属于 Render，Render 可重试、废弃，缓存也可能被清除。请求是外部副作用，会出现重复请求、竞态和不可回滚行为。应使用框架数据层、RSC、请求缓存方案，或在确有必要时通过正确 cleanup 的 Effect 管理。

### 43. `useState(() => expensiveInit())` 与 `useMemo` 有何区别？

惰性 initializer 用于首次创建 state，后续 render 不重新初始化；`useMemo` 用于根据依赖缓存可重新计算的派生值。若值需要被用户操作更新，它可能是 state；若完全可由输入计算，它通常是派生值。Strict Mode 开发检查可能额外调用 initializer，因此同样必须纯净。

### 44. 为什么不应把 `useId` 用作列表 key？

`useId` 用于生成可关联的可访问性 ID 或 SSR/客户端稳定标识，不表示业务数据身份。列表 key 应来自数据本身的稳定 ID，并且 Hook 也不能在 map 循环中任意调用。

### 45. `useSyncExternalStore` 解决了什么问题？

它为 React 提供订阅外部 store 和读取一致快照的标准协议，支持并发渲染与 SSR，避免组件在一次更新中读取到互相不一致的外部状态（tearing）。状态库应优先通过该接口集成，而不是组件各自手写 Effect 订阅。

### 46. 什么是 tearing？

并发渲染期间，如果外部可变数据在不同组件读取之间发生变化，同一屏 UI 可能展示两个时间点的值，这就是撕裂。React state/context 由 React 管理快照；外部 store 则需要 `useSyncExternalStore` 等协议保证一致性。

### 47. Portal 中的事件按 DOM 树还是 React 树传播？

Portal 只改变真实 DOM 的挂载位置，不改变它在 React 树中的父子关系。Context 仍按 React 树传递，React 事件也会沿 React 组件树冒泡。因此模态框渲染到 `document.body` 后，事件仍可能触发声明它的 React 祖先处理器。

### 48. 受控组件和非受控组件如何选择？

受控组件由 props/state 作为唯一数据源，便于校验、联动和统一管理；非受控组件主要由 DOM 保存即时值，通过 ref 或提交事件读取，代码可能更轻。可复用组件应明确选择一种控制模式，避免同一字段在生命周期中从非受控切换为受控。

### 49. 为什么在组件内部定义另一个组件会丢状态？

外层组件每次 render 都创建新的函数对象，React 把它视为新的组件类型，因而卸载旧子树并挂载新子树。状态按树中位置和类型关联，所以会重置。应把组件定义提升到模块顶层。

### 50. 如何判断一个值应该是 state、ref 还是普通变量？

- 决定 UI 且会随交互变化：state；
- 跨 render 保留但变化不应触发 UI：ref；
- 能由本次 props/state 直接计算：普通派生变量；
- 昂贵派生计算且已证明确有需要：可加 `useMemo`；
- 不要用 Effect 把可计算值再同步成另一份 state。

### 51. 为什么父组件 render 后子组件通常也会 render？

父组件产生新的子元素描述后，React 默认继续协调子组件。即使 props 内容看起来相同，普通函数组件仍会执行；`memo` 或 React Compiler 可以提供 bailout。子组件执行不等于 DOM 一定更新，Commit 只应用实际宿主差异。

### 52. 为什么 state 要视为不可变数据？

React 的快照、并发准备和许多浅比较优化都依赖清晰的引用变化。原地修改会污染旧快照，并可能把同一引用交回 setter 导致更新被跳过。不可变更新让新旧版本可以安全共存，也让 memoization 和调试更可靠。

### 53. `useDeferredValue` 与 `useMemo` 能互相替代吗？

不能。`useDeferredValue` 调整派生 UI 使用新值的优先级，允许紧急 UI 先显示旧值；`useMemo` 缓存计算结果，不改变优先级。常见做法是在使用 deferred value 的子树中再通过 memoization 避免不必要计算。

### 54. Transition 会让计算速度变快吗？

不会。它让非紧急 Render 可中断，使输入等高优先级工作更快响应，从而改善感知性能。总计算量可能不降，甚至因被中断重试而增加；真正的重计算仍需算法优化、虚拟化或减少渲染范围。

### 55. 为什么不能在 Render 中调用 setter？

一般会形成“render → 更新 → 再 render”的循环，并破坏纯函数模型。React 只允许当前组件在极少数模式下于 render 中调整自身状态，并会丢弃本次输出立即重试；这不是常规方案。事件更新放事件处理器，外部同步放 Effect，派生值直接计算。

---

## 面试回答模板

### 3 分钟版本

> React 的演进可以从运行时和编程模型两条线看。运行时上，React 15 以前主要是同步递归协调，大更新容易长时间占用主线程；React 16 通过 Fiber 把协调拆成工作单元，使 render 可以按优先级调度、暂停或废弃，并通过 current 与 work-in-progress 树保证只提交完整结果。React 18 在这个基础上正式提供并发渲染相关能力，包括自动批处理、Transition、Suspense 和流式 SSR。
>
> 编程模型上，Class 用实例、`this` 和生命周期组织状态逻辑，相关业务经常分散在 mount/update/unmount 中，复用又依赖 HOC 或 render props。Hooks 改成函数组件每次 render 获得状态快照，通过 Hook 调用顺序关联状态，并用 Effect 表达与外部系统的同步过程。它提升了逻辑组合能力，但带来了闭包和依赖管理要求。闭包不是 Bug；旧回调看到旧值是渲染快照。应根据语义使用完整依赖、函数式更新、ref 或 React 19.2 的 `useEffectEvent`，而不是禁用依赖规则。
>
> Context 适合主题、身份、业务子树服务等跨层且更新频率适中的数据，不适合作为万能状态仓库。Provider value 变化会让消费者更新，所以要拆分职责、稳定必要的 value，并在高频细粒度状态下选择带 selector 的外部 store。
>
> 截至 2026 年 8 月，官方最新文档版本是 React 19.2，重点增加了 Activity、useEffectEvent、cacheSignal、性能轨道和服务端渲染改进；React Compiler 1.0 已稳定，通过构建期数据流分析自动 memoization。它减少手工优化成本，但不能替代正确的状态设计、Effect 边界、列表虚拟化和性能测量。

### 资深工程师回答的评价标准

一个合格的高级回答应做到：

- 不把 Fiber 简化成“虚拟 DOM diff”；
- 不把并发渲染说成多线程；
- 区分 Render 可中断与 Commit 一致性；
- 不机械映射生命周期与 Effect；
- 能解释闭包为何产生，并按语义选择解决方案；
- 知道依赖数组描述代码，而不是控制执行次数的开关；
- 能说明 Context 的订阅粒度和适用边界；
- 性能优化以测量、状态结构和更新边界为先；
- 区分 React 核心、React DOM、Server Components、框架功能和 Canary 实验能力；
- 对 React Compiler 的能力和边界不过度承诺。

---

## 官方资料

本文的版本事实和公共 API 以 React 官方资料为准；Fiber 与 Lane 等内部实现细节不属于稳定 API，未来可能变化。

- [React Versions](https://react.dev/versions)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [React 19](https://react.dev/blog/2024/12/05/react-19)
- [React 18](https://react.dev/blog/2022/03/29/react-v18)
- [React Compiler 1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React Server Components 安全公告](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- [React Hooks Reference](https://react.dev/reference/react/hooks)
- [useEffect](https://react.dev/reference/react/useEffect)
- [useEffectEvent](https://react.dev/reference/react/useEffectEvent)
- [memo](https://react.dev/reference/react/memo)
- [useMemo](https://react.dev/reference/react/useMemo)
- [useCallback](https://react.dev/reference/react/useCallback)
- [useState](https://react.dev/reference/react/useState)
- [Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)
- [useInsertionEffect](https://react.dev/reference/react/useInsertionEffect)
- [startTransition](https://react.dev/reference/react/startTransition)
- [flushSync](https://react.dev/reference/react-dom/flushSync)
- [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [createContext](https://react.dev/reference/react/createContext)
- [useContext](https://react.dev/reference/react/useContext)
- [use](https://react.dev/reference/react/use)
- [React Compiler](https://react.dev/learn/react-compiler)
