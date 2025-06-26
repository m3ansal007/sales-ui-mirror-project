
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  location?: string;
  lead_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...appointmentData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setAppointments(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to schedule appointment",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return {
    appointments,
    loading,
    createAppointment,
    refetch: fetchAppointments
  };
};
