import api from './api';

export const fetchDashboardEstado = () => api.get('/dashboard/estado');
export const fetchDashboardSexo = () => api.get('/dashboard/sexo');
export const fetchDashboardTipoContagio = () => api.get('/dashboard/tipo-contagio');
export const fetchDashboardDepartamento = () => api.get('/dashboard/departamento');
export const fetchDashboardCasosPais = () => api.get('/dashboard/casos-pais');
export const fetchDashboardCasosCiudadMunicipio = () => api.get('/dashboard/casos-ciudad-municipio');
export const fetchDashboardEdad = () => api.get('/dashboard/edad');
export const fetchDashboardRangoEdad = () => api.get('/dashboard/rango-edad');
export const fetchDashboardTiempoAnio = () => api.get('/dashboard/tiempo/anio');
export const fetchDashboardTiempoMes = () => api.get('/dashboard/tiempo/mes');
export const fetchDashboardTiempoDia = () => api.get('/dashboard/tiempo/dia');
export const fetchDashboardTiempoSemestre = () => api.get('/dashboard/tiempo/semestre');
export const fetchDashboardPorSemestreDepartamentoMunicipio = () => api.get('/dashboard/por-semestre-departamento-municipio');
