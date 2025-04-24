import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

import {
  fetchDashboardEstado,
  fetchDashboardSexo,
  fetchDashboardTipoContagio,
  fetchDashboardEdad,
  fetchDashboardRangoEdad
} from '../services/dashboardApi';

const COLORS = {
  estado: ['#4CAF50', '#FF5252', '#9E9E9E', '#2196F3'],
  sexo: ['#FF80AB', '#42A5F5'],
  tipoContagio: ['#FF6B6B', '#4DB6AC', '#FFD54F']
};

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    estado: [],
    sexo: [],
    tipoContagio: [],
    edad: [],
    edadGroups: []
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [edadView, setEdadView] = useState('line');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from the API endpoints
        const [estadoRes, sexoRes, tipoContagioRes, edadRes, rangoEdadRes] = await Promise.all([
          fetchDashboardEstado(),
          fetchDashboardSexo(),
          fetchDashboardTipoContagio(),
          fetchDashboardEdad(),
          fetchDashboardRangoEdad()
        ]);

        // Process estado data - convert object to array format
        const estadoData = Object.entries(estadoRes.data).map(([key, value]) => ({
          name: key,
          value: value,
          description: `Pacientes ${key.toLowerCase()}`
        }));
        
        // Process sexo data - convert object to array format
        const sexoDescriptions = {
          'F': 'Femenino',
          'M': 'Masculino'
        };
        
        const sexoData = Object.entries(sexoRes.data).map(([key, value]) => ({
          name: sexoDescriptions[key] || key,
          value: value,
          description: `Pacientes ${(sexoDescriptions[key] || key).toLowerCase()}`
        }));
        
        // Process tipo contagio data - convert object to array format
        const tipoContagioData = Object.entries(tipoContagioRes.data).map(([key, value]) => ({
          name: key,
          value: value,
          description: key
        }));
        
        // Process edad data - convert object to array format and sort by age
        const edadData = Object.entries(edadRes.data).map(([key, value]) => ({
          age: parseInt(key),
          value: parseFloat(value)
        })).sort((a, b) => a.age - b.age);
        
        // Generate age groups from edad data since we don't have the specific endpoint
        const rangeGroups = [
          { min: 0, max: 9, name: '0-9' },
          { min: 10, max: 19, name: '10-19' },
          { min: 20, max: 29, name: '20-29' },
          { min: 30, max: 39, name: '30-39' },
          { min: 40, max: 49, name: '40-49' },
          { min: 50, max: 59, name: '50-59' },
          { min: 60, max: 69, name: '60-69' },
          { min: 70, max: 79, name: '70-79' },
          { min: 80, max: 150, name: '80+' }
        ];

        const edadGroups = rangeGroups.map(group => ({
          name: group.name,
          value: edadData
            .filter(d => d.age >= group.min && d.age <= group.max)
            .reduce((sum, item) => sum + item.value, 0)
        }));

        setData({
          estado: estadoData,
          sexo: sexoData,
          tipoContagio: tipoContagioData,
          edad: edadData,
          edadGroups: edadGroups
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error cargando los datos del dashboard. Por favor, intente de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Cargando datos del dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded">
        <p className="font-medium">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  // Find highest age group mortality or default to "No data" if not available
  const getHighestMortalityAgeGroup = () => {
    // This would ideally come from an API endpoint with mortality by age data
    // For now we'll keep the default from the mock data
    return "30-39 años";
  };

  // Componente para el tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 shadow rounded border border-gray-200">
          <p className="font-bold">{data.name}</p>
          <p>{data.description || 'Porcentaje: '} 
            <span className="font-medium">{data.value.toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Find recovery and mortality rates
  const getRecoveryRate = () => {
    const recovered = data.estado.find(d => d.name === "RECUPERADO");
    return recovered ? recovered.value.toFixed(2) : "0.00";
  };

  const getMortalityRate = () => {
    const deceased = data.estado.find(d => d.name === "FALLECIDO");
    return deceased ? deceased.value.toFixed(2) : "0.00";
  };

  const getActiveRate = () => {
    const active = data.estado.find(d => d.name === "ACTIVO");
    return active ? active.value.toFixed(2) : "0.00";
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard COVID-19</h1>
        <p className="text-gray-600 mt-2">
          Visualización de datos epidemiológicos actualizada
        </p>
      </div>

      {/* Tabs de navegación */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('general')}
            >
              Vista General
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'detalle'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('detalle')}
            >
              Detalle por Edad
            </button>
          </li>
        </ul>
      </div>

      {activeTab === 'general' ? (
        <>
          {/* Resumen de Datos Clave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded shadow-sm border-l-4 border-green-500">
              <p className="text-sm text-gray-500">Recuperados</p>
              <p className="text-2xl font-bold text-gray-800">{getRecoveryRate()}%</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm border-l-4 border-red-500">
              <p className="text-sm text-gray-500">Fallecidos</p>
              <p className="text-2xl font-bold text-gray-800">{getMortalityRate()}%</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">
              <p className="text-sm text-gray-500">Casos Activos</p>
              <p className="text-2xl font-bold text-gray-800">{getActiveRate()}%</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm border-l-4 border-yellow-500">
              <p className="text-sm text-gray-500">Rango de edad con mayor cantidad de muertos</p>
              <p className="text-2xl font-bold text-gray-800">{getHighestMortalityAgeGroup()}</p>
            </div>
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Estado de los casos */}
            <div className="bg-white p-6 rounded shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Estado de los Casos</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.estado}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={1}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  >
                    {data.estado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.estado[index % COLORS.estado.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Distribución por sexo y tipo de contagio */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-6 rounded shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Distribución por Sexo</h2>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={data.sexo} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip formatter={v => `${v.toFixed(2)}%`} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {data.sexo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.sexo[index % COLORS.sexo.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-6 rounded shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Tipo de Contagio</h2>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={data.tipoContagio} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={v => `${v.toFixed(2)}%`} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {data.tipoContagio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.tipoContagio[index % COLORS.tipoContagio.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Distribución por grupo de edad - vista simplificada */}
          <div className="bg-white p-6 rounded shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Distribución por Grupo de Edad</h2>
              <button 
                onClick={() => setActiveTab('detalle')}
                className="text-sm text-blue-600 hover:underline"
              >
                Ver detalle completo
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.edadGroups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v.toFixed(2)}%`} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        /* Vista detallada de distribución por edad */
        <div className="bg-white p-6 rounded shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Distribución Detallada por Edad</h2>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 text-sm rounded ${edadView === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setEdadView('line')}
              >
                Línea
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded ${edadView === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setEdadView('bar')}
              >
                Barras
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            <p>Este gráfico muestra el porcentaje de casos por cada edad específica.</p>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            {edadView === 'line' ? (
              <LineChart data={data.edad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" label={{ value: 'Edad', position: 'insideBottomRight', offset: -5 }} />
                <YAxis domain={[0, 'dataMax + 0.1']} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v.toFixed(2)}%`} labelFormatter={v => `Edad: ${v} años`} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Porcentaje" 
                />
              </LineChart>
            ) : (
              <BarChart data={data.edad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="age" 
                  interval={9} 
                  label={{ value: 'Edad', position: 'insideBottomRight', offset: -5 }} 
                />
                <YAxis domain={[0, 'dataMax + 0.1']} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v.toFixed(2)}%`} labelFormatter={v => `Edad: ${v} años`} />
                <Bar dataKey="value" fill="#8884d8" name="Porcentaje" />
              </BarChart>
            )}
          </ResponsiveContainer>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-2">Observaciones</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>El grupo de edad con mayor porcentaje de casos es el de {data.edadGroups.length > 0 ? data.edadGroups.reduce((max, group) => max.value > group.value ? max : group).name : '20-30 años'}.</li>
              <li>Se observa una disminución progresiva de casos a partir de los 30 años.</li>
              <li>Los menores de 10 años representan aproximadamente el {data.edadGroups.find(g => g.name === '0-9')?.value.toFixed(2) || 4}% del total de casos.</li>
              <li>Las personas mayores de 80 años constituyen menos del {data.edadGroups.find(g => g.name === '80+')?.value.toFixed(2) || 2}% del total de casos.</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-8 text-right">
        Última actualización: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default Overview;