import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StockData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  industry: string;
  country: string;
}

export interface SelectedField {
  path: string; // JSON path
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'null'; // Data type from API
}

export interface Widget {
  id: string;
  name: string; // User-defined widget name
  description?: string; // Optional description
  symbol: string;
  customApiUrl?: string; // Optional custom API URL
  refreshRate: number;
  selectedFields: SelectedField[]; // Fields selected by user
  data: StockData | null;
  rawData?: any; // Store complete API response for custom fields
  lastUpdated?: string; // Track last data update time
}

interface WidgetsState {
  widgets: Widget[];
  showForm: boolean;
  loading: boolean;
  error: string;
}

const initialState: WidgetsState = {
  widgets: [],
  showForm: false,
  loading: false,
  error: '',
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    addWidget: (state, action: PayloadAction<Widget>) => {
      state.widgets.push(action.payload);
    },
    removeWidget: (state, action: PayloadAction<string>) => {
      state.widgets = state.widgets.filter(w => w.id !== action.payload);
    },
    updateWidgetData: (state, action: PayloadAction<{ id: string; data: StockData; rawData?: any }>) => {
      const widget = state.widgets.find(w => w.id === action.payload.id);
      if (widget) {
        widget.data = action.payload.data;
        if (action.payload.rawData) {
          widget.rawData = action.payload.rawData;
        }
        widget.lastUpdated = new Date().toISOString();
      }
    },
    updateWidget: (state, action: PayloadAction<Widget>) => {
      const index = state.widgets.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.widgets[index] = action.payload;
      }
    },
    setShowForm: (state, action: PayloadAction<boolean>) => {
      state.showForm = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addWidget,
  removeWidget,
  updateWidgetData,
  updateWidget,
  setShowForm,
  setLoading,
  setError,
} = widgetsSlice.actions;

export default widgetsSlice.reducer;
