# WebSocket 事件渲染流程总结

## 一、整体架构

```
用户输入 → WebSocket 发送 → 服务端处理 → WebSocket 事件返回 → handleEvent 分发 → reducer 更新 state → React 渲染
```

- **通信协议**: 原生浏览器 `WebSocket`（非 socket.io）
- **状态管理**: React `useReducer` + `createContext`（无外部状态库）
- **事件类型**: 7 种 (`history`, `system`, `sub_graph_status`, `tool_call`, `tool_result`, `stream`, `query_result`)

---

## 二、关键文件索引

| 文件 | 职责 |
|------|------|
| `src/services/api.ts` | WebSocket 创建 (`createWebSocket`) 和 REST API |
| `src/hooks/useWebSocket.ts` | WebSocket 连接管理、事件解析、`handleEvent` 分发中心 |
| `src/context/ChatContext.tsx` | `chatReducer` 状态修改逻辑 |
| `src/types/index.ts` | 所有类型定义（事件、状态、Action） |
| `src/components/ChatArea/ChatArea.tsx` | 消息列表渲染入口 |
| `src/components/ChatArea/MessageBubble.tsx` | 单条消息渲染（含流式光标、Markdown、工厂名链接） |
| `src/components/ChatArea/QueryResultCard.tsx` | 查询结果表格渲染 |
| `src/utils/markdown.ts` | Markdown → HTML 渲染管线 |

---

## 三、服务端返回的典型事件顺序

```
1. sub_graph_status  →  显示当前处理步骤标签
2. query_result      →  暂存查询结果（不立即显示）
3. stream × N        →  逐 chunk 显示 AI 回复文本
4. stream (is_final) →  结束流式、将暂存的 query_result 卡片插入消息列表
```

---

## 四、Sub-Graph Stream 的渲染流程

### 4.1 事件接收 → 分发

**文件**: `src/hooks/useWebSocket.ts` (第 50-113 行)

```typescript
case 'sub_graph_status':
  dispatch({ type: 'SET_STATUS', label: event.label });
  break;

case 'stream':
  if (event.is_final) {
    dispatch({ type: 'APPEND_STREAM', content: '', isFinal: true });
    dispatch({ type: 'CLEAR_STATUS' });
  } else {
    dispatch({ type: 'APPEND_STREAM', content: event.content, isFinal: false });
  }
  break;
```

- `sub_graph_status` 设置当前步骤标签（如 "Analyzing query..."、"Searching factories..."）
- `stream` 事件携带增量文本 + `is_final` 标志 + `sub_graph_trace` 信息

### 4.2 Reducer 处理

**文件**: `src/context/ChatContext.tsx` (第 97-155 行)

`APPEND_STREAM` 的逻辑：

1. 如果当前没有活跃的流式消息 (`streamingMsgId == null`)，自动创建一条 `role: 'assistant', isStreaming: true, content: ''` 的空白消息
2. 将 `action.content` 追加到该消息的 `content` 字段
3. 如果是最终 chunk (`isFinal: true`)：
   - 将消息的 `isStreaming` 改为 `false`（去除流式光标）
   - 如果 `pendingQueryResult` 有值，将其作为一条 `role: 'query_result'` 的消息插入到 assistant 消息后面
   - 清空 `streamingMsgId` 和 `pendingQueryResult`

`SET_STATUS` / `CLEAR_STATUS`：

```typescript
case 'SET_STATUS':
  return { ...state, subGraphLabel: action.label };

case 'CLEAR_STATUS':
  return { ...state, subGraphLabel: null };
```

### 4.3 UI 渲染

**Sub-Graph 状态标签** — 文件: `src/components/ChatArea/ChatArea.tsx` (第 37-41 行)

```tsx
{subGraphLabel && (
  <div className="msg msg-system">
    <div className="msg-body">{subGraphLabel}</div>
  </div>
)}
```

- 渲染为一条居中、灰色小字的系统消息
- 位置在消息列表底部，输入框上方
- 流结束时自动消失

**流式文本** — 文件: `src/components/ChatArea/MessageBubble.tsx`

```tsx
const renderContent = () => {
  if (isSystem) return <span>{message.content}</span>;
  const html = renderMarkdown(message.content);  // marked + DOMPurify
  return (
    <span
      className={isStreaming ? 'stream-cursor' : ''}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
```

流式视觉效果 — 文件: `src/App.css` (第 268-275 行)

```css
.stream-cursor::after {
  content: '▍';
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}
```

- 每条新 chunk 到来时，`content` 字段增长，React 重新渲染
- `isStreaming: true` 时，文本末尾带闪烁光标 `▍`
- `renderMarkdown` 管线：`marked` 解析 Markdown → `DOMPurify` 消毒 → 正则注入工厂名点击链接

---

## 五、Query Result 事件的渲染流程

### 5.1 事件接收 → 分发

**文件**: `src/hooks/useWebSocket.ts` (第 88-97 行)

```typescript
case 'query_result':
  if (event.display_mode !== 'table') break;  // 仅处理 table 模式

  if (event.query_result 包含 'error') {
    dispatch({ type: 'SET_QUERY_RESULT', rows: [], isError: true, errorMessage: ... });
  } else if (Array.isArray(event.query_result)) {
    dispatch({ type: 'SET_QUERY_RESULT', rows: event.query_result, extraColumns: ..., isError: false });
  }
  break;
```

### 5.2 Reducer 处理 — 关键：延迟插入机制

**为什么 query_result 要暂存？**

因为服务端发送顺序是 `query_result` 先于 `stream (is_final)` 到达。如果直接将 query_result 插入消息列表，它在 AI 回复文本之前出现，顺序不对。所以需要：

1. `SET_QUERY_RESULT` 将结果存入 `pendingQueryResult`（暂不放入 messages 数组）
2. 等 `stream (is_final)` 到达时，由 `APPEND_STREAM` 将暂存的结果插入到 assistant 消息后面

```typescript
// SET_QUERY_RESULT
case 'SET_QUERY_RESULT':
  return {
    ...state,
    pendingQueryResult: {
      rows: action.rows,
      extraColumns: action.extraColumns,
      isError: action.isError,
      errorMessage: action.errorMessage,
    },
  };

// APPEND_STREAM 中的插入逻辑 (isFinal && pending)
if (action.isFinal && pending) {
  const idx = msgs.findIndex((m) => m.id === activeStreamId);
  const insertAt = idx >= 0 ? idx + 1 : msgs.length;
  msgs = [
    ...msgs.slice(0, insertAt),
    {
      id: generateId(),
      role: 'query_result',
      content: '',
      timestamp: Date.now(),
      queryResult: {
        isError: pending.isError,
        errorMessage: pending.errorMessage,
        rows: pending.rows,
        extraColumns: pending.extraColumns,
      },
    },
    ...msgs.slice(insertAt),
  ];
  pending = null;
}
```

### 5.3 UI 渲染 — QueryResultCard

**文件**: `src/components/ChatArea/ChatArea.tsx` (第 28-29 行)

```tsx
{messages.map((msg) =>
  msg.role === 'query_result' ? (
    <QueryResultCard key={msg.id} data={msg.queryResult!} />
  ) : (
    <MessageBubble key={msg.id} message={msg} />
  )
)}
```

**文件**: `src/components/ChatArea/QueryResultCard.tsx`

渲染分为两种状态：

**错误状态**：
```tsx
if (data.isError) {
  return (
    <div className="qr-card qr-error">
      <div className="qr-error-icon">!</div>
      <div className="qr-error-msg">{data.errorMessage || '查询出错'}</div>
    </div>
  );
}
```

**正常表格**：

1. **列头**：固定列（`factoryname`, `moq`, `coostring`, `factorystatus`）+ 动态列（来自服务端的 `extra_columns`）
   - 列名通过 `FIXED_COLUMNS` 和 `DYNAMIC_LABELS` 映射为中文标签（如 `mainhistorybrand` → `主要品牌`）
2. **数据行**：最多显示 20 行 (`DISPLAY_LIMIT = 20`)
   - `factoryname` 列渲染为可点击链接，点击后 dispatch `OPEN_FACTORY` 打开详情面板
3. **底部栏**（行数 > 20 时显示）：
   - 显示 "显示 20/N 条"
   - **导出 Excel** 按钮（使用 `xlsx` 库）

```tsx
<td key={col}>
  <span className="qr-factory-link"
    onClick={() => dispatch({ type: 'OPEN_FACTORY', factory: toInternalFactory(row) })}>
    {val}
  </span>
</td>
```

---

## 六、完整事件流示意

```
时间线 ──────────────────────────────────────────────────────────────►

服务端事件:    sub_graph_status   query_result    stream(chunk1)   stream(chunk2)   stream(final)
                    │                  │                │               │                │
handleEvent:    SET_STATUS       SET_QUERY_RESULT  APPEND_STREAM  APPEND_STREAM   APPEND_STREAM
                    │                  │                │               │           + CLEAR_STATUS
                    ▼                  ▼                ▼               ▼                ▼
State 变化:   subGraphLabel    pendingQueryResult  创建 assistant  content 追加   结束流式
              = "搜索中..."   = { rows, cols }    消息并追加文本                   插入 QueryResult
                                                                                    清空暂存

UI 渲染:      显示步骤标签       (暂无变化)        AI 文本 + ▍   AI 文本 + ▍    AI 文本(无光标)
                                                                                  查询结果表格
```

---

## 七、消息持久化

- 所有消息（包括 `query_result` 类型的卡片）通过 `sessionStorage` 持久化（key: `factory_chat_messages`）
- 页面刷新后消息不丢失
- 每次 `messages` 数组变化时自动保存
- 初始化时从 `sessionStorage` 恢复
