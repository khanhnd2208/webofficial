'use client';
import { createContext, useContext } from 'react';
import type { TestRoomEnvelope } from './types';
export const TestRoomContext = createContext<TestRoomEnvelope | null>(null);
export const useTestRoom = () => useContext(TestRoomContext);
