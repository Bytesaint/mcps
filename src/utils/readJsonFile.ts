/**
 * Reads a File object as text and parses it as JSON.
 */
export function readJsonFile<T = any>(file: File): Promise<T> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') {
                    throw new Error('Failed to read file content');
                }
                const parsed = JSON.parse(result);
                resolve(parsed);
            } catch (error) {
                reject(new Error('Invalid JSON file format'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        reader.readAsText(file);
    });
}
