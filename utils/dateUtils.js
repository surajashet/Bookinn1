// Check if current date is within booking dates
export const isWithinStayDates = (checkInDate, checkOutDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkIn = new Date(checkInDate);
    checkIn.setHours(0, 0, 0, 0);
    
    const checkOut = new Date(checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    
    return today >= checkIn && today <= checkOut;
  };
  
  // Check if guest is currently checked in (actively staying)
  export const isActiveStay = (bookingStatus, checkInDate, checkOutDate) => {
    const withinDates = isWithinStayDates(checkInDate, checkOutDate);
    return bookingStatus === 'checked_in' || (bookingStatus === 'confirmed' && withinDates);
  };
  
  // Get days remaining in stay
  export const getDaysRemaining = (checkOutDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOut = new Date(checkOutDate);
    checkOut.setHours(0, 0, 0, 0);
    
    const diffTime = checkOut - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Get current active booking from user's bookings
  export const getCurrentActiveBooking = (bookings) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return bookings.find(booking => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      
      // Check if today is between check-in and check-out (inclusive)
      return today >= checkIn && today <= checkOut;
    });
  };