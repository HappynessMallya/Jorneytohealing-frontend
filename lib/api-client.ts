import api from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
  questionnaire?: any | null;
  bookings?: any[];
  payments?: any[];
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const authApi = {
  register: async (data: { email: string; password: string; name: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", {
      email: data.email,
      password: data.password,
      name: data.name,
    });
    return response.data;
  },
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", {
      email: data.email,
      password: data.password,
    });
    return response.data;
  },
  me: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>("/users/me");
    return response.data;
  },
  updateProfile: async (data: Partial<{ name: string; email?: string }>): Promise<AuthUser> => {
    const response = await api.put<AuthUser>("/users/me", data);
    return response.data;
  },
};

export const postsApi = {
  getAll: async (published?: boolean) => {
    // GET /posts - gets all posts (both published and unpublished)
    // If published parameter is provided, filter on client side or use query param if API supports it
    const params = published !== undefined ? { published: published.toString() } : {};
    const response = await api.get("/posts", { params });
    return response.data;
  },
  getById: async (id: string) => {
    // GET /posts/:id - get post details by ID
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },
  create: async (data: { title: string; body: string; imageUrl?: string; published?: boolean; scheduledAt?: string }) => {
    const response = await api.post("/posts", data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ title: string; body: string; imageUrl?: string; published?: boolean; scheduledAt?: string }>) => {
    const response = await api.patch(`/posts/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },
  publish: async (id: string) => {
    const response = await api.patch(`/posts/${id}`, { published: true });
    return response.data;
  },
  unpublish: async (id: string) => {
    const response = await api.patch(`/posts/${id}`, { published: false });
    return response.data;
  },
};

export interface QuestionnairePayload {
  fullName: string;
  ageRange: string;
  genderIdentity: string;
  relationshipStatus: string;
  workOrStudy: string;
  therapyReasons: string[];
  issueDuration: string;
  attendedTherapyBefore: boolean;
  therapyGoals: string;
  sessionPreference: string;
  preferredDaysTimes: string;
  comfortLevelSharing: number;
  preferredMethods?: string | null;
  additionalInfo?: string | null;
}

export interface QuestionnaireResponse {
  id: string;
  userId: string;
  fullName: string;
  ageRange: string;
  genderIdentity: string;
  relationshipStatus: string;
  workOrStudy: string;
  therapyReasons: string[];
  issueDuration: string;
  attendedTherapyBefore: boolean;
  therapyGoals: string;
  sessionPreference: string;
  preferredDaysTimes: string;
  preferredMethods: string | null;
  comfortLevelSharing: number;
  additionalInfo: string | null;
  createdAt: string;
  updatedAt: string;
}

export const questionnaireApi = {
  create: async (data: Partial<QuestionnairePayload>): Promise<QuestionnaireResponse> => {
    // Ensure required fields are present and format correctly
    const payload: QuestionnairePayload = {
      fullName: data.fullName || "",
      ageRange: data.ageRange || "",
      genderIdentity: data.genderIdentity || "",
      relationshipStatus: data.relationshipStatus || "",
      workOrStudy: data.workOrStudy || "",
      therapyReasons: data.therapyReasons || [],
      issueDuration: data.issueDuration || "",
      attendedTherapyBefore: data.attendedTherapyBefore ?? false,
      therapyGoals: data.therapyGoals || "",
      sessionPreference: data.sessionPreference || "",
      preferredDaysTimes: data.preferredDaysTimes || "",
      comfortLevelSharing: data.comfortLevelSharing ?? 0,
      preferredMethods: data.preferredMethods || null,
      additionalInfo: data.additionalInfo || null,
    };
    
    const response = await api.post<QuestionnaireResponse>("/questionnaire", payload);
    return response.data;
  },
  getMyQuestionnaire: async (): Promise<QuestionnaireResponse> => {
    const response = await api.get<QuestionnaireResponse>("/questionnaire/me");
    return response.data;
  },
  getAll: async (): Promise<QuestionnaireResponse[]> => {
    const response = await api.get<QuestionnaireResponse[]>("/questionnaire/all");
    return response.data;
  },
  getById: async (id: string): Promise<QuestionnaireResponse> => {
    const response = await api.get<QuestionnaireResponse>(`/questionnaire/${id}`);
    return response.data;
  },
};

export const bookingsApi = {
  create: async (data: { sessionType: string; sessionDate: string; sessionTime: string }) => {
    const response = await api.post("/bookings", data);
    return response.data;
  },
  getMyBookings: async () => {
    const response = await api.get("/bookings/me");
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  getUpcoming: async () => {
    const response = await api.get("/bookings/upcoming");
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },
};

export const paymentsApi = {
  create: async (data: { 
    bookingId: string; 
    amount: number; 
    currency?: string; 
    paymentMethod?: string;
    status?: string;
  }) => {
    const response = await api.post("/payments", {
      bookingId: data.bookingId,
      amount: data.amount,
      currency: data.currency || "USD",
      paymentMethod: data.paymentMethod || "credit_card",
      status: data.status || "pending",
    });
    return response.data;
  },
  getMyPayments: async () => {
    const response = await api.get("/payments/me");
    return response.data;
  },
  updateStatus: async (paymentId: string, status: string) => {
    const response = await api.patch(`/payments/${paymentId}/status`, { status });
    return response.data;
  },
  updatePaymentWithAggregator: async (paymentId: string, data: {
    status: string;
    amount: number;
    transactionId: string;
    paymentMethod: string;
    paymentAggregatorResponse: any;
  }) => {
    const response = await api.patch(`/payments/${paymentId}`, {
      status: data.status,
      amount: data.amount,
      transactionId: data.transactionId,
      paymentMethod: data.paymentMethod,
      paymentAggregatorResponse: data.paymentAggregatorResponse,
    });
    return response.data;
  },
};

// BongoPay Aggregator API
export interface BongoPayCreateResponse {
  reference?: string;
  transid?: string;
  resultcode?: string;
  result: "SUCCESS" | "FAILED";
  message?: string;
  data?: any[];
  order_id?: string; // Legacy field, may not be present
  status?: string; // Legacy field, may not be present
}

export interface BongoPayStatusResponse {
  order_id: string;
  payment_status: "PENDING" | "COMPLETE" | "COMPLETED" | "FAILED";
  amount: number;
  phone: string;
  transaction_id?: string;
  selcom_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export const bongoPayApi = {
  createPayment: async (data: {
    phone: string;
    amount: number;
    order_id: string;
    callback_url?: string;
  }): Promise<BongoPayCreateResponse> => {
    const response = await fetch("/api/payment/bongopay/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create payment");
    }
    
    return response.json();
  },
  getPaymentStatus: async (order_id: string): Promise<BongoPayStatusResponse> => {
    const response = await fetch(`/api/payment/bongopay/status?order_id=${order_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get payment status");
    }
    
    return response.json();
  },
};

export const chatApi = {
  checkAccess: async () => {
    const response = await api.get("/chat/access");
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get("/chat/history");
    return response.data;
  },
};

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  password: string; // Hashed password from backend
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
  questionnaire?: any | null;
  bookings?: any[];
  payments?: any[];
}

export interface AdminDashboardStats {
  totalClients?: number;
  totalBookings?: number;
  upcomingSessions?: number;
  totalRevenue?: number;
}

export const adminApi = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await api.get<AdminDashboardStats>("/admin/dashboard");
    return response.data;
  },
  getClients: async (): Promise<AdminClient[]> => {
    const response = await api.get<AdminClient[]>("/admin/clients");
    return response.data;
  },
  getAllBookings: async () => {
    const response = await api.get("/bookings/all");
    return response.data;
  },
  getUpcomingBookings: async () => {
    const response = await api.get("/bookings/upcoming");
    return response.data;
  },
  updateBookingStatus: async (id: string, status: string) => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },
  getAllPayments: async () => {
    const response = await api.get("/payments/all");
    return response.data;
  },
  getAllQuestionnaires: async (): Promise<QuestionnaireResponse[]> => {
    const response = await api.get<QuestionnaireResponse[]>("/questionnaire/all");
    return response.data;
  },
};

