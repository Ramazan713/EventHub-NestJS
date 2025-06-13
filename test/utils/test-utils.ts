
export class TestUtils {

    static omitDates(doc: any) {
        return Object.entries(doc).reduce((acc, [key, value]) => {
            if (value instanceof Date) {
                return acc;
            }

            if (typeof value === 'string') {
                const d = new Date(value);
            if (!isNaN(d.getTime()) && d.toISOString() === value) {
                return acc; 
            }
            }
            acc[key] = value;
            return acc;
        }, {} as Record<string, any>);
    }
}