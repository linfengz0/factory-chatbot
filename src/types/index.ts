/* ================================================================
   Message types (matches API.md WebSocket protocol)
   ================================================================ */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'query_result';
  content: string;
  agentName?: string | null;
  timestamp: string;
  isStreaming?: boolean;
  queryResult?: QueryResultState;
}

export interface HistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent_name: string | null;
  timestamp: string;
}

export interface SubGraphTrace {
  node: string;
  start?: string;
  end?: string;
}

export interface StreamEvent {
  type: 'stream';
  content?: string;
  /** Snake_case (Python / default contract). */
  is_final?: boolean;
  /** CamelCase (some gateways / serializers). */
  isFinal?: boolean;
  sub_graph_trace?: SubGraphTrace[] | null;
}

export interface SubGraphStatusEvent {
  type: 'sub_graph_status';
  node: string;
  label: string;
}

export interface SystemEvent {
  type: 'system';
  content: string;
}

export interface HistoryEvent {
  type: 'history';
  messages: HistoryMessage[];
}

export interface ToolCallEvent {
  type: 'tool_call';
  tool: string;
  args: Record<string, unknown>;
}

export interface ToolResultEvent {
  type: 'tool_result';
  tool: string;
  args: Record<string, unknown>;
  result: string;
}

export interface QueryResultRow {
  [key: string]: unknown;
  factoryname?: string;
  moq?: number;
  coostring?: string;
  factorystatus?: string;
  factoryid?: number;
  type?: string;
}

export interface QueryResultState {
  isError: boolean;
  errorMessage?: string;
  rows: QueryResultRow[];
  extraColumns: string[];
  externalError?: string | null;
}

export interface QueryResultEvent {
  type: 'query_result';
  query_result?: QueryResultRow[] | { count: number } | { error: string } | null;
  /** CamelCase alias for `query_result`. */
  queryResult?: QueryResultRow[] | { count: number } | { error: string } | null;
  extra_columns?: string[];
  extraColumns?: string[];
  query_conditions?: Record<string, unknown>;
  sql_query?: string;
  /** When omitted, client treats as `table` (same as backend default). */
  display_mode?: 'table' | 'text';
  /** Some gateways emit camelCase; client accepts either. */
  displayMode?: 'table' | 'text';
  external_error?: string | null;
  externalError?: string | null;
}

export type WsServerEvent =
  | HistoryEvent
  | SystemEvent
  | SubGraphStatusEvent
  | ToolCallEvent
  | ToolResultEvent
  | StreamEvent
  | QueryResultEvent;

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

/* ================================================================
   Factory types (matches prototype data model)
   ================================================================ */

export interface CapacityRow {
  month: string;
  original: number;
  totalDemand: number;
  remaining: number;
  status: string;
}

export interface InternalFactory {
  type: 'internal';
  id: string;
  factoryid: string;
  factorystatus: string;
  factoryname: string;
  subcategory: string;
  historysubcategory: string;
  esg: string;
  moq: number;
  coostring: string;
  inhousevap: string;
  outsourcevap: string;
  partyaudit3rd: number;
  positioning: string;
  pricepoint: string;
  tradeterm: string;
  historyservicedbrand: string;
  mainhistorybrand: string;
  factorycodelong: string;
  createddate: string;
  categorysplit: string;
  factorycodeshort: string;
  capacity: CapacityRow[];
}

export interface ExternalFactory {
  type: 'external';
  id: null;
  factoryname: string;
  coostring: string;
  productimages: string | null;
  description: string;
  historysubcategory: string;
  logo: string | null;
  employeecount: string;
  keyexportmarket: string;
  esg: string;
  subcategory: string;
  emails: string;
  phones: string;
  mainhistorybrand: string;
  yearfounded: string;
  address: string;
  businesstype: string;
  websites: string;
}

export type Factory = InternalFactory | ExternalFactory;

export interface AnchorConfig {
  id: string;
  label: string;
}

/* ================================================================
   Chat state
   ================================================================ */

export interface ChatState {
  sessionId: string | null;
  messages: Message[];
  streamingMsgId: string | null;
  /** query_result data held until stream completes, then inserted after assistant message. */
  pendingQueryResult: {
    rows: QueryResultRow[];
    extraColumns: string[];
    isError: boolean;
    errorMessage?: string;
    externalError?: string | null;
  } | null;
  connectionStatus: ConnectionStatus;
  subGraphLabel: string | null;
  selectedFactory: Factory | null;
  pendingInput: string | null;
}

export type ChatAction =
  | { type: 'SET_SESSION_ID'; sessionId: string }
  | { type: 'SET_CONNECTION_STATUS'; status: ConnectionStatus }
  | { type: 'SET_HISTORY'; messages: HistoryMessage[] }
  | { type: 'ADD_USER_MESSAGE'; content: string; timestamp: string }
  | { type: 'START_STREAM'; msgId: string }
  | { type: 'APPEND_STREAM'; content: string; isFinal: boolean }
  | { type: 'ADD_SYSTEM_MSG'; content: string; timestamp: string }
  | { type: 'SET_STATUS'; label: string }
  | { type: 'CLEAR_STATUS' }
  | { type: 'OPEN_FACTORY'; factory: Factory }
  | { type: 'CLOSE_FACTORY' }
  | { type: 'SET_QUERY_RESULT';rows: QueryResultRow[]; extraColumns: string[]; isError: boolean; errorMessage?: string; externalError?: string | null }
  | { type: 'SET_PENDING_INPUT'; value: string | null };
