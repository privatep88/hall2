
import React from 'react';
import { Booking } from '../types';
import { formatDateDisplay, formatToYYYYMMDD } from '../utils/dateUtils';

interface ScheduleTableProps {
    days: Date[];
    timeSlots: string[];
    bookings: Booking[];
    onCellClick: (date: Date, time: string) => void;
    onBookingClick: (bookingId: string) => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ days, timeSlots, bookings, onCellClick, onBookingClick }) => {
    
    const bookingColors = [
        { bg: 'bg-blue-200', hover: 'hover:bg-blue-300', text: 'text-blue-800' },
        { bg: 'bg-teal-200', hover: 'hover:bg-teal-300', text: 'text-teal-800' },
        { bg: 'bg-green-200', hover: 'hover:bg-green-300', text: 'text-green-800' },
        { bg: 'bg-indigo-200', hover: 'hover:bg-indigo-300', text: 'text-indigo-800' },
        { bg: 'bg-purple-200', hover: 'hover:bg-purple-300', text: 'text-purple-800' },
        { bg: 'bg-pink-200', hover: 'hover:bg-pink-300', text: 'text-pink-800' },
        { bg: 'bg-sky-200', hover: 'hover:bg-sky-300', text: 'text-sky-800' },
        { bg: 'bg-cyan-200', hover: 'hover:bg-cyan-300', text: 'text-cyan-800' },
        { bg: 'bg-emerald-200', hover: 'hover:bg-emerald-300', text: 'text-emerald-800' },
        { bg: 'bg-rose-200', hover: 'hover:bg-rose-300', text: 'text-rose-800' },
    ];

    const bookingColorMap = React.useRef(new Map<string, typeof bookingColors[0]>());
    const lastColorIndex = React.useRef(-1);

    const getBookingColor = (bookingId: string) => {
        if (!bookingColorMap.current.has(bookingId)) {
            lastColorIndex.current = (lastColorIndex.current + 1) % bookingColors.length;
            bookingColorMap.current.set(bookingId, bookingColors[lastColorIndex.current]);
        }
        return bookingColorMap.current.get(bookingId)!;
    };
    
    const arabicDayNames: { [key: string]: string } = {
        'Saturday': 'السبت',
        'Sunday': 'الاحد',
        'Monday': 'الاثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الاربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
    };

    const getArabicDayName = (date: Date) => {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return arabicDayNames[dayName] || dayName;
    };

    const displayTimeSlots = timeSlots.slice(0, -1);

    const bookingsByDate = React.useMemo(() => {
        return bookings.reduce((acc, booking) => {
            (acc[booking.date] = acc[booking.date] || []).push(booking);
            return acc;
        }, {} as Record<string, Booking[]>);
    }, [bookings]);

    return (
        <table className="min-w-full border-collapse text-center">
            <thead className="bg-blue-950 text-sm font-bold text-white sticky top-0">
                <tr>
                    <th colSpan={3} className="py-2 border border-blue-800"></th>
                    <th colSpan={displayTimeSlots.length + 1} className="py-2 border border-blue-800">
                        من / الى
                    </th>
                </tr>
                <tr>
                    <th className="py-3 px-2 border border-blue-800 w-12">م</th>
                    <th className="py-3 px-2 border border-blue-800 w-28">اليوم</th>
                    <th className="py-3 px-2 border border-blue-800 w-32">التاريخ</th>
                    {displayTimeSlots.map(time => (
                        <th key={time} className="py-3 px-2 border border-blue-800 w-24">{time}</th>
                    ))}
                    <th className="py-3 px-2 border border-blue-800 w-48">الملاحظات</th>
                </tr>
            </thead>
            <tbody>
                {days.map((day, index) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6; // Sunday or Saturday
                    const dayHeaderClasses = `border border-gray-200 font-semibold align-middle ${isWeekend ? 'text-amber-900' : 'bg-blue-100 text-blue-900'}`;
                    const dayHeaderMonoClasses = `border border-gray-200 font-mono align-middle ${isWeekend ? 'text-amber-900' : 'bg-blue-100 text-blue-900'}`;

                    const formattedDate = formatToYYYYMMDD(day);
                    const allDayBookings = bookingsByDate[formattedDate] || [];
                    const notes = allDayBookings.map(b => b.notes).filter(Boolean).join(', ');

                    return (
                        <tr key={day.toISOString()} className={`text-sm ${isWeekend ? 'bg-amber-50' : 'bg-white'}`}>
                            <td className={dayHeaderClasses}>{index + 1}</td>
                            <td className={dayHeaderClasses}>{getArabicDayName(day)}</td>
                            <td className={dayHeaderMonoClasses}>{formatDateDisplay(day)}</td>
                            {(() => {
                                const cells = [];
                                for (let i = 0; i < displayTimeSlots.length; ) {
                                    const time = timeSlots[i];
                                    const booking = allDayBookings.find(b => b.time === time);

                                    if (booking) {
                                        const startTimeIndex = i;
                                        const endTimeIndex = timeSlots.indexOf(booking.endTime);
                                        const color = getBookingColor(booking.id);
                                        
                                        if (endTimeIndex > startTimeIndex) {
                                            const span = endTimeIndex - startTimeIndex;
                                            cells.push(
                                                <td
                                                    key={booking.id}
                                                    colSpan={span}
                                                    className={`border border-gray-200 p-1 ${color.bg} ${color.hover} cursor-pointer transition-colors text-center align-middle`}
                                                    onClick={() => onBookingClick(booking.id)}
                                                >
                                                    <div className={`font-semibold ${color.text}`}>{booking.department}</div>
                                                </td>
                                            );
                                            i += span;
                                        } else {
                                            // Invalid booking (e.g. endTime <= startTime), render an empty cell and move to the next
                                            cells.push(
                                                <td
                                                    key={time}
                                                    className="relative group border border-gray-200 h-12 hover:bg-blue-100 cursor-pointer transition-colors"
                                                    onClick={() => onCellClick(day, time)}
                                                >
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 bg-gray-900 text-gray-200 text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                                                        {`${formattedDate} - ${time}`}
                                                    </div>
                                                </td>
                                            );
                                            i++;
                                        }
                                    } else {
                                        // No booking starts here, this cell must be empty.
                                        cells.push(
                                            <td
                                                key={time}
                                                className="relative group border border-gray-200 h-12 hover:bg-blue-100 cursor-pointer transition-colors"
                                                onClick={() => onCellClick(day, time)}
                                            >
                                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 bg-gray-900 text-gray-200 text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                                                    {`${formattedDate} - ${time}`}
                                                </div>
                                            </td>
                                        );
                                        i++;
                                    }
                                }
                                return cells;
                            })()}
                            <td className="border border-gray-200 p-1 text-gray-600 align-middle">{notes}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};