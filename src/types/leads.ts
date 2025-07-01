
export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  notes?: string;
  value?: number;
  created_at: string;
  updated_at: string;
  created_by: string; // Changed from user_id
  assigned_team_member_id?: string;
  assigned_by?: string; // New field
}

export interface CreateLeadData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  assigned_team_member_id?: string;
  notes?: string;
  value?: number;
}

export interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'sales_manager' | 'sales_associate';
  manager_id?: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
