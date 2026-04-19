import apiClient from '../utils/api.service';

export interface BookingData {
  serviceId: string;
  petId: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  paymentMethod?: string;
}

export const bookingService = {
  confirmBooking: async (data: BookingData) => {
    const response = await apiClient.post('/bookings/confirm', data);
    return response.data;
  },

  confirmBookingPayOS: async (data: BookingData) => {
    const response = await apiClient.post('/bookings/confirm/payos', data);
    return response.data;
  },
  
  getMyBookings: async () => {
    const response = await apiClient.get('/bookings/my');
    return response.data.bookings;
  },

  getServiceAvailability: async (serviceId: string, month: number, year: number) => {
    const response = await apiClient.get(`/bookings/service-availability/${serviceId}?month=${month}&year=${year}`);
    return response.data.bookings;
  },

  getProviderBookings: async () => {
    const response = await apiClient.get('/bookings/provider');
    return response.data.bookings;
  }
};
