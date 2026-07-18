import client from './client';
import { RunForm, Run } from '../types/index';


export const getRuns = async (): Promise<Run[]> => {
    const response = await client.get('/runs');
    return response.data;
}

export const getRun = async (id: number): Promise<Run> => {
    const response = await client.get(`/runs/${id}`);
    return response.data;
}

export const storeRun = async (data: RunForm): Promise<Run> => {
    const response = await client.post('/runs', data);
    return response.data;
}

export const updateRun = async (id: number, data: RunForm): Promise<Run> => {
    const response = await client.put(`/runs/${id}`, data);
    return response.data;
}

export const deleteRun = async (id: number): Promise<void> => {
    const response = await client.delete(`/runs/${id}`);
    return response.data;
}   