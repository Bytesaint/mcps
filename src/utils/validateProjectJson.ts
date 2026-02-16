import type { Project } from '../types/models';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    project?: Project;
}

export function validateProjectJson(data: any): ValidationResult {
    if (!data || typeof data !== 'object') {
        return { isValid: false, error: "Invalid JSON: Root must be an object" };
    }

    // Required top-level fields
    const requiredFields = ['id', 'name', 'templateId', 'phoneAId', 'phoneBId', 'createdAt'];
    for (const field of requiredFields) {
        if (!(field in data)) {
            return { isValid: false, error: `Missing required field: ${field}` };
        }
    }

    // Validate scenes array if present
    if (data.scenes && !Array.isArray(data.scenes)) {
        return { isValid: false, error: "Invalid scenes: Must be an array" };
    }

    // Check for huge payloads (basic check)
    if (JSON.stringify(data).length > 5 * 1024 * 1024) { // 5MB limit
        return { isValid: false, error: "Project file too large (max 5MB)" };
    }

    // Normalize or migrate data if needed (e.g. ensure defaults)
    // For now, we assume it matches the Project interface roughly

    return { isValid: true, project: data as Project };
}
