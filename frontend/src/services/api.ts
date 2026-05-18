import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { AuthResponse, ApiResponse } from '../types';
import { store } from '../store';
import { clearAuth } from '../store/authSlice';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratamento de respostas
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        const requestUrl: string = error.config?.url ?? '';
        const isAuthRequest = requestUrl.startsWith('/auth');
        if (error.response?.status === 401 && !isAuthRequest) {
          store.dispatch(clearAuth());
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticação
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth', {
      email,
      password,
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Métodos para alunos
  async getStudents(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get<ApiResponse<any[]>>('/students');
    return response.data;
  }

  async getStudent(id: number): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>(`/students/${id}`);
    return response.data;
  }

  async createStudent(studentData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/students', studentData);
    return response.data;
  }

  async updateStudent(id: number, studentData: any): Promise<ApiResponse<any>> {
    const response = await this.api.put<ApiResponse<any>>(`/students/${id}`, studentData);
    return response.data;
  }

  async deleteStudent(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/students/${id}`);
    return response.data;
  }

  // Métodos para empresas
  async getCompanies(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get<ApiResponse<any[]>>('/companies');
    return response.data;
  }

  async createCompany(companyData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/companies', companyData);
    return response.data;
  }

  async updateCompany(id: number, companyData: any): Promise<ApiResponse<any>> {
    const response = await this.api.put<ApiResponse<any>>(`/companies/${id}`, companyData);
    return response.data;
  }

  async deleteCompany(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/companies/${id}`);
    return response.data;
  }

  // Métodos para funções (somente leitura; lista fixa no backend)
  async getFunctions(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get<ApiResponse<any[]>>('/functions');
    return response.data;
  }

  // Métodos para funcionários
  async getEmployees(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get<ApiResponse<any[]>>('/employees');
    return response.data;
  }

  async createEmployee(employeeData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/employees', employeeData);
    return response.data;
  }

  async updateEmployee(id: number, employeeData: any): Promise<ApiResponse<any>> {
    const response = await this.api.put<ApiResponse<any>>(`/employees/${id}`, employeeData);
    return response.data;
  }

  async deleteEmployee(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/employees/${id}`);
    return response.data;
  }

  // Métodos para questionários
  async getQuestionnaires(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get<ApiResponse<any[]>>('/questionnaires');
    return response.data;
  }

  async createQuestionnaire(questionnaireData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/questionnaires', questionnaireData);
    return response.data;
  }

  async updateQuestionnaire(id: number, questionnaireData: any): Promise<ApiResponse<any>> {
    const response = await this.api.put<ApiResponse<any>>(`/questionnaires/${id}`, questionnaireData);
    return response.data;
  }

  async deleteQuestionnaire(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/questionnaires/${id}`);
    return response.data;
  }

  // Métodos para perguntas
  async getQuestions(questionnaireId?: number): Promise<ApiResponse<any[]>> {
    const url = questionnaireId ? `/questions?questionnaire_id=${questionnaireId}` : '/questions';
    const response = await this.api.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async createQuestion(questionData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/questions', questionData);
    return response.data;
  }

  // Métodos para respostas
  async getAnswers(filters?: any): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams(filters);
    const response = await this.api.get<ApiResponse<any[]>>(`/answers?${params}`);
    return response.data;
  }

  async createAnswer(answerData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/answers', answerData);
    return response.data;
  }

  // Métodos para respostas de questionários
  async getQuestionnaireResponses(questionnaireId?: number): Promise<ApiResponse<any[]>> {
    const url = questionnaireId ? `/questionnaire-responses?questionnaire_id=${questionnaireId}` : '/questionnaire-responses';
    const response = await this.api.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async getQuestionnaireResponse(id: number): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>(`/questionnaire-responses/${id}`);
    return response.data;
  }

  async createQuestionnaireResponse(responseData: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/questionnaire-responses', responseData);
    return response.data;
  }

  // Métodos de recuperação de senha
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    const response = await this.api.post<ApiResponse<void>>('/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    const response = await this.api.post<ApiResponse<void>>('/reset-password', { token, password });
    return response.data;
  }

  // Métodos para encaminhamentos
  async getReferrals(alunoId?: number): Promise<ApiResponse<any[]>> {
    const url = alunoId ? `/referrals?aluno_id=${alunoId}` : '/referrals';
    const response = await this.api.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async getReferral(id: number): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>(`/referrals/${id}`);
    return response.data;
  }

  async createReferral(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/referrals', data);
    return response.data;
  }

  async updateReferral(id: number, data: any): Promise<ApiResponse<any>> {
    const response = await this.api.put<ApiResponse<any>>(`/referrals/${id}`, data);
    return response.data;
  }

  async deleteReferral(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/referrals/${id}`);
    return response.data;
  }

  // Métodos para eventos / agendamentos
  async getEvents(start?: string, end?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const qs = params.toString();
    const url = qs ? `/events?${qs}` : '/events';
    const response = await this.api.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async getEvent(id: number): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>(`/events/${id}`);
    return response.data;
  }

  async createEvent(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/events', data);
    return response.data;
  }

  async updateEvent(id: number, data: any): Promise<ApiResponse<any>> {
    const response = await this.api.put<ApiResponse<any>>(`/events/${id}`, data);
    return response.data;
  }

  async deleteEvent(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/events/${id}`);
    return response.data;
  }

  // Métodos de configuração SMTP
  async getSmtpConfig(): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>('/smtp-config');
    return response.data;
  }

  async saveSmtpConfig(config: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/smtp-config', config);
    return response.data;
  }

  async testSmtpConnection(config: any): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/smtp-config-test', config);
    return response.data;
  }

  async downloadReport(
    entity: 'companies' | 'employees' | 'students' | 'questionnaires',
    type: string,
  ): Promise<Blob> {
    const response = await this.api.get(`/reports/${entity}`, {
      params: { type },
      responseType: 'blob',
    });
    return response.data as Blob;
  }
}

export const apiService = new ApiService();
export default apiService;
