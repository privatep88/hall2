

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ScheduleTable } from './components/ScheduleTable';
import { BookingModal } from './components/BookingModal';
import { Booking, Hall } from './types';
import { getDaysInMonth, formatToYYYYMMDD, formatDateDisplay } from './utils/dateUtils';
import { LocationIcon, PhoneIcon, EmailIcon, HomeIcon } from './components/icons';

// Mock initial data
const initialBookings: Booking[] = [
    {
        id: '1',
        hallId: Hall.AlWaha,
        date: '2026-01-05',
        time: '09:00',
        endTime: '11:00',
        department: 'إدارة شؤون الطلاب',
        notes: 'اجتماع دوري'
    },
    {
        id: '2',
        hallId: Hall.AlWaha,
        date: '2026-01-05',
        time: '11:00',
        endTime: '12:00',
        department: 'إدارة شؤون الطلاب',
        notes: 'اجتماع دوري'
    },
    {
        id: '3',
        hallId: Hall.AlDana,
        date: '2026-01-08',
        time: '11:00',
        endTime: '13:00',
        department: 'قسم التسويق',
        notes: 'ورشة عمل'
    }
];

const App: React.FC = () => {
    const [selectedHall, setSelectedHall] = useState<Hall>(Hall.AlWaha);
    const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);

    const [modalInfo, setModalInfo] = useState<{
        isOpen: boolean;
        bookingToEdit?: Booking;
        date?: Date;
        time?: string;
    }>({ isOpen: false });

    const daysInMonth = useMemo(() => getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);

    const handleCellClick = (date: Date, time: string) => {
        setModalInfo({ isOpen: true, date, time });
    };

    const handleBookingClick = (bookingId: string) => {
        const bookingToEdit = bookings.find(b => b.id === bookingId);
        if (bookingToEdit) {
            setModalInfo({ isOpen: true, bookingToEdit });
        }
    };
    
    const handleCloseModal = () => {
        setModalInfo({ isOpen: false });
    };

    const handleSaveBooking = (bookingData: Omit<Booking, 'id' | 'hallId'>) => {
        const currentHall = modalInfo.bookingToEdit ? modalInfo.bookingToEdit.hallId : selectedHall;

        const hasConflict = bookings.some(b => {
            if (modalInfo.bookingToEdit && b.id === modalInfo.bookingToEdit.id) {
                return false; // Don't check against self when editing
            }
            if (b.hallId === currentHall && b.date === bookingData.date) {
                // Check for time overlap: (StartA < EndB) and (EndA > StartB)
                return bookingData.time < b.endTime && bookingData.endTime > b.time;
            }
            return false;
        });

        if (hasConflict) {
            throw new Error('يوجد تعارض في الحجز. الرجاء اختيار وقت آخر.');
        }

        if (modalInfo.bookingToEdit) {
            // Update existing booking
            setBookings(bookings.map(b => b.id === modalInfo.bookingToEdit!.id ? { ...modalInfo.bookingToEdit!, ...bookingData } : b));
        } else {
            // Create new booking
            const newBooking: Booking = {
                ...bookingData,
                id: new Date().toISOString(),
                hallId: selectedHall,
            };
            setBookings([...bookings, newBooking]);
        }
        handleCloseModal();
    };

    const handleDeleteBooking = () => {
        if (modalInfo.bookingToEdit) {
            setBookings(bookings.filter(b => b.id !== modalInfo.bookingToEdit!.id));
            handleCloseModal();
        }
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = parseInt(e.target.value, 10);
        setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = parseInt(e.target.value, 10);
        setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
    };

    const halls = [
        { id: Hall.AlWaha, name: 'قاعة الواحة' },
        { id: Hall.AlDana, name: 'قاعة الدانة' },
    ];

    const monthlyBookingCounts = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // getMonth() is 0-indexed
        const monthString = String(month).padStart(2, '0');
        const yearMonthPrefix = `${year}-${monthString}`;

        const counts: { [key in Hall]: number } = {
            [Hall.AlWaha]: 0,
            [Hall.AlDana]: 0,
        };

        for (const booking of bookings) {
            if (booking.date.startsWith(yearMonthPrefix)) {
                counts[booking.hallId]++;
            }
        }
        return counts;
    }, [bookings, currentDate]);
    
    // Time slots in chronological order
    const timeSlots = ['07:30', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    const getModalInitialData = () => {
        if (modalInfo.bookingToEdit) {
            return {
                date: modalInfo.bookingToEdit.date,
                time: modalInfo.bookingToEdit.time,
                endTime: modalInfo.bookingToEdit.endTime,
                department: modalInfo.bookingToEdit.department,
                notes: modalInfo.bookingToEdit.notes,
            }
        }
        if (modalInfo.date && modalInfo.time) {
            const startTime = modalInfo.time;

            // Set default end time to the next available slot
            const startTimeIndex = timeSlots.indexOf(startTime);
            const defaultEndTime = startTimeIndex !== -1 && startTimeIndex + 1 < timeSlots.length
                ? timeSlots[startTimeIndex + 1]
                : '';

            return {
                date: formatToYYYYMMDD(modalInfo.date),
                time: modalInfo.time,
                endTime: defaultEndTime,
                department: '',
                notes: '',
            }
        }
        return null;
    }
    
    const modalInitialData = getModalInitialData();

    const yearsForSelect = Array.from({ length: 2050 - 2024 + 1 }, (_, i) => 2024 + i);
    const months = [
        { value: 0, name: 'يناير' },
        { value: 1, name: 'فبراير' },
        { value: 2, name: 'مارس' },
        { value: 3, name: 'أبريل' },
        { value: 4, name: 'مايو' },
        { value: 5, name: 'يونيو' },
        { value: 6, name: 'يوليو' },
        { value: 7, name: 'أغسطس' },
        { value: 8, name: 'سبتمبر' },
        { value: 9, name: 'أكتوبر' },
        { value: 10, name: 'نوفمبر' },
        { value: 11, name: 'ديسمبر' },
    ];

    const handleExportToExcel = () => {
        const hallName = halls.find(h => h.id === selectedHall)?.name || '';
        const monthName = months.find(m => m.value === currentDate.getMonth())?.name || '';
        const year = currentDate.getFullYear();
        const title = `جدول حجوزات ${hallName} - ${monthName} ${year}`;
    
        const displayTimeSlots = timeSlots.slice(0, -1);
        
        const headerRow1 = [null, null, null, 'من / الى'];
        const headerRow2 = ['م', 'اليوم', 'التاريخ', ...displayTimeSlots, 'الملاحظات'];
        
        const sheetData: (string | number | null)[][] = [
            [title],
            [], // Spacer row
            headerRow1,
            headerRow2,
        ];
    
        const merges: XLSX.Range[] = [
            // Title merge
            { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow2.length - 1 } },
            // Sub-header 'من / الى' merge
            { s: { r: 2, c: 3 }, e: { r: 2, c: 3 + displayTimeSlots.length - 1 } },
        ];
    
        const arabicDayNames: { [key: string]: string } = {
            'Saturday': 'السبت', 'Sunday': 'الاحد', 'Monday': 'الاثنين',
            'Tuesday': 'الثلاثاء', 'Wednesday': 'الاربعاء', 'Thursday': 'الخميس',
            'Friday': 'الجمعة',
        };
        const getArabicDayName = (date: Date) => {
            const dayName = date.toLocaleString('en-US', { weekday: 'long' });
            return arabicDayNames[dayName] || dayName;
        };
    
        const filteredBookings = bookings.filter(b => b.hallId === selectedHall);
        
        daysInMonth.forEach((day, index) => {
            const rowIndex = sheetData.length;
            const formattedDate = formatToYYYYMMDD(day);
            const dayBookings = filteredBookings.filter(b => b.date === formattedDate);
            const notes = dayBookings.map(b => b.notes).filter(Boolean).join(', ');
    
            const row: (string | number | null)[] = [
                index + 1,
                getArabicDayName(day),
                formatDateDisplay(day)
            ];
    
            for (let i = 0; i < displayTimeSlots.length; ) {
                const time = timeSlots[i];
                const booking = dayBookings.find(b => b.time === time);
    
                if (booking) {
                    const startTimeIndex = timeSlots.indexOf(booking.time);
                    const endTimeIndex = timeSlots.indexOf(booking.endTime);
                    const span = endTimeIndex > startTimeIndex ? endTimeIndex - startTimeIndex : 1;
                    
                    row.push(booking.department);
                    
                    if (span > 1) {
                        merges.push({
                            s: { r: rowIndex, c: 3 + i },
                            e: { r: rowIndex, c: 3 + i + span - 1 }
                        });
                    }
    
                    for (let j = 1; j < span; j++) {
                        row.push(null); 
                    }
                    i += span;
                } else {
                    row.push('');
                    i++;
                }
            }
            
            row.push(notes);
            sheetData.push(row);
        });
    
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!merges'] = merges;
        ws['!cols'] = [ {wch:5}, {wch:15}, {wch:15}, ...displayTimeSlots.map(() => ({wch: 12})), {wch: 35} ];
        ws['!rtl'] = true;
    
        // Add basic styling to headers
        const headerStyle = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "FFD3D3D3" } } // Light Gray
        };
        for (let C = 0; C < headerRow2.length; ++C) {
            const cellAddress = XLSX.utils.encode_cell({r: 3, c: C});
            if (ws[cellAddress]) {
                ws[cellAddress].s = headerStyle;
            }
        }
    
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `حجوزات ${hallName}`);
        XLSX.writeFile(wb, `حجوزات_${hallName}_${year}_${monthName}.xlsx`);
    };


    return (
        <div className="p-4 md:p-8 min-h-screen">
            <header className="mb-6">
                <div className="bg-blue-950 py-4 px-6 rounded-lg shadow-lg relative">
                    <div className="absolute top-1/2 -translate-y-1/2 right-6">
                        <a href="https://dashboard-rouge-rho-68.vercel.app/" className="flex items-center gap-2 px-4 py-2 text-white text-lg font-semibold rounded-lg bg-blue-800 shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-950 focus:ring-blue-500 transition-all duration-200">
                            <HomeIcon className="w-6 h-6" />
                            <span>الصفحة الرئيسية</span>
                        </a>
                    </div>
                     <div className="absolute top-1/2 -translate-y-1/2 left-6">
                        <a href="mailto:Logistic@saher.ae" className="flex items-center gap-2 px-4 py-2 text-white text-lg font-semibold rounded-lg bg-blue-800 shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-950 focus:ring-blue-500 transition-all duration-200">
                            <EmailIcon className="w-6 h-6" />
                            <span>تواصل معنا</span>
                        </a>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl md:text-4xl font-bold text-white">
                            نظام حجز القاعات
                        </h1>
                        <p className="mt-2 text-xl text-blue-200">شركة ساهر للخدمات الذكية</p>
                        <p className="mt-1 text-xs text-blue-300">© {new Date().getFullYear()} SAHER FOR SMART SERVICES</p>
                    </div>
                </div>
            </header>
            
            <main>
                <div className="flex flex-wrap justify-start items-center mb-4 gap-4">
                    {halls.map(hall => (
                        <button
                            key={hall.id}
                            onClick={() => setSelectedHall(hall.id)}
                            className={`px-6 py-2 text-lg font-bold rounded-md border-2 transition-all duration-300 ${
                                selectedHall === hall.id
                                    ? 'bg-blue-950 text-white border-blue-950 shadow-md'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {hall.name}
                        </button>
                    ))}

                    <div className="flex-grow"></div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label htmlFor="year-select" className="font-bold text-gray-700">السنة:</label>
                            <select
                                id="year-select"
                                value={currentDate.getFullYear()}
                                onChange={handleYearChange}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                aria-label="Select year"
                            >
                                {yearsForSelect.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                         <div className="flex items-center gap-2">
                            <label htmlFor="month-select" className="font-bold text-gray-700">الشهر:</label>
                            <select
                                id="month-select"
                                value={currentDate.getMonth()}
                                onChange={handleMonthChange}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                aria-label="Select month"
                            >
                                {months.map(month => (
                                    <option key={month.value} value={month.value}>{month.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleExportToExcel}
                            className="px-4 py-2 bg-blue-950 text-white font-bold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            تصدير إلى Excel
                        </button>
                    </div>
                </div>

                <div className="mb-4 p-4 bg-blue-100 rounded-lg shadow text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">إجمالي الحجوزات للشهر المحدد</h3>
                    <div className="flex justify-center items-center gap-x-8 gap-y-2 flex-wrap">
                        {halls.map(hall => (
                            <div key={hall.id} className="font-semibold text-gray-700">
                                <span>{hall.name}: </span>
                                <span className="text-blue-700 font-bold text-xl">{monthlyBookingCounts[hall.id]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                    <ScheduleTable
                        days={daysInMonth}
                        timeSlots={timeSlots}
                        bookings={bookings.filter(b => b.hallId === selectedHall)}
                        onCellClick={handleCellClick}
                        onBookingClick={handleBookingClick}
                    />
                </div>
            </main>

            <footer className="bg-blue-950 text-gray-200 mt-8 rounded-t-lg shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">

                        {/* Column 1: About SAHER */}
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold text-white mb-4 inline-block pb-1 border-b-2 border-yellow-400">عن SAHER</h3>
                            <p className="text-sm leading-relaxed">
                                شركة رائدة في تقديم الحلول والأنظمة الذكية، ملتزمون بالابتكار والجودة لتحقيق أعلى مستويات الكفاءة والخدمات الذكية.
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold text-white mb-4 inline-block pb-1 border-b-2 border-yellow-400">روابط سريعة</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">الرئيسية</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">خدماتنا</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">تواصل معنا</a></li>
                            </ul>
                        </div>

                        {/* Column 3: Contact Info */}
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold text-white mb-4 inline-block pb-1 border-b-2 border-yellow-400">تواصل معنا</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start">
                                    <LocationIcon className="w-5 h-5 mt-1 flex-shrink-0" />
                                    <span className="mr-3">Level 3, Baynona Building, Khalif City A</span>
                                </li>
                                <li className="flex items-center">
                                    <PhoneIcon className="w-5 h-5" />
                                    <span className="mr-3" dir="ltr">+971 4 123 4567</span>
                                </li>
                                <li className="flex items-center">
                                    <EmailIcon className="w-5 h-5" />
                                    <span className="mr-3">Logistic@saher.ae</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
                        <p className="mb-4 sm:mb-0 text-gray-400">اعداد وتصميم / خالد الجفري</p>
                        <p className="text-gray-400">© {new Date().getFullYear()} SAHER FOR SMART SERVICES</p>
                    </div>
                </div>
            </footer>
            
            {modalInfo.isOpen && modalInitialData && (
                 <BookingModal
                    isOpen={modalInfo.isOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveBooking}
                    onDelete={modalInfo.bookingToEdit ? handleDeleteBooking : undefined}
                    hallName={halls.find(h => h.id === selectedHall)?.name || ''}
                    initialData={modalInitialData}
                    timeSlots={timeSlots}
                />
            )}
        </div>
    );
};

export default App;