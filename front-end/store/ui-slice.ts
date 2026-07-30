import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type UiState = {
  globalSearch: string
}

const initialState: UiState = {
  globalSearch: "",
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGlobalSearch(state, action: PayloadAction<string>) {
      state.globalSearch = action.payload
    },
    clearGlobalSearch(state) {
      state.globalSearch = ""
    },
  },
})

export const { clearGlobalSearch, setGlobalSearch } = uiSlice.actions
export const uiReducer = uiSlice.reducer
