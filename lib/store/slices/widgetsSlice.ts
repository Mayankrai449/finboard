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

export interface Widget {
  id: string;
  symbol: string;
  refreshRate: number;
  data: StockData | null;
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
    updateWidgetData: (state, action: PayloadAction<{ id: string; data: StockData }>) => {
      const widget = state.widgets.find(w => w.id === action.payload.id);
      if (widget) {
        widget.data = action.payload.data;
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
  setShowForm,
  setLoading,
  setError,
} = widgetsSlice.actions;

export default widgetsSlice.reducer;
