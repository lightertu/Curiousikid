import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface User {
  _id: string;
  name: string;
  email: string;
  img: string;
  verified: boolean;
  subscribedUsers: string[];
}

export interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: boolean;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User, token: string }>) => {
      state.loading = false;
      state.currentUser = action.payload.user;
      localStorage.setItem('podstreamtoken', action.payload.token);
    },
    loginFailure: (state) => {
      state.loading = false;
      state.error = true;
    },
    logout: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.error = false;
      localStorage.removeItem('token');
    },
    verified: (state, action) => {
      if (state.currentUser) {
        state.currentUser.verified = action.payload;
      }
    },
    displayPodcastFailure: (state) => {
      state.loading = false;
      state.error = true;
    },
    subscription: (state, action) => {
      if (state.currentUser.subscribedUsers.includes(action.payload)) {
        state.currentUser.subscribedUsers.splice(
          state.currentUser.subscribedUsers.findIndex(
            (channelId) => channelId === action.payload
          ),
          1
        );
      } else {
        state.currentUser.subscribedUsers.push(action.payload);
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, displayPodcastFailure, subscription, verified } =
  userSlice.actions;

export default userSlice.reducer;