import * as moment from 'moment';


export class DateUtils {

    static addHours(
        { hours, currentDate }: { hours: number; currentDate?: Date } = { hours: 1 }
    ): Date {
        return moment(currentDate ?? new Date()).add(hours,"h").toDate();    
    }
}