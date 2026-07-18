export interface User{
    id: number;
    name: string;
    email:string;
}

export interface Run {
    id: number;
    distance_km: number;
    duration_seconds: number;
    notes: string | null;
    created_at: string;
}

export interface RunForm{
    distance_km: number;
    duration_seconds: number;
    notes?: string;
}