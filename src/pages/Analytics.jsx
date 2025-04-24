import React,{ useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import api from '../services/api';

// API service functions
const fetchDashboardDepartamento = () => api.get('/dashboard/departamento');
const fetchDashboardCasosPais = () => api.get('/dashboard/casos-pais');
const fetchDashboardCasosCiudadMunicipio = () => api.get('/dashboard/casos-ciudad-municipio');
const fetchDashboardPorSemestreDepartamentoMunicipio = () => api.get('/dashboard/por-semestre-departamento-municipio');

console.log('API URL:', api.defaults.baseURL);

console.log('API URL:', fetchDashboardCasosCiudadMunicipio);
console.log('API URL:', fetchDashboardDepartamento);
console.log('API URL:', fetchDashboardCasosPais);
// URL to Colombia GeoJSON - Changed to use an absolute URL
const colombiaGeoUrl = '/colombia.json';

// Colors for heat maps
const COLOR_RANGE = [
  '#FFEDEA',
  '#FFCEC5',
  '#FFAD9F',
  '#FF8A75',
  '#FF5533',
  '#E2492D',
  '#BE3D26',
  '#9A311F',
  '#782618'
];

const DEFAULT_COLOR = '#EEE';

// Custom Card components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-200">{children}</div>
);

const CardTitle = ({ children }) => (
  <h3 className="text-lg font-medium text-gray-900">{children}</h3>
);

const CardContent = ({ children }) => (
  <div className="p-6">{children}</div>
);

// Custom Tabs components
const Tabs = ({ children, value, onValueChange }) => {
  return (
    <div className="tabs-container">
      {React.Children.map(children, child => {
        if (child.type === TabsList || child.type === TabsContent) {
          return React.cloneElement(child, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, value, onValueChange }) => {
  return (
    <div className="tabs-list">
      {React.Children.map(children, child => {
        if (child.type === TabsTrigger) {
          return React.cloneElement(child, { 
            isActive: value === child.props.value,
            onClick: () => onValueChange(child.props.value)
          });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({ children, value, isActive, onClick }) => {
  return (
    <button 
      className={`px-4 py-2 font-medium text-sm ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, tabValue }) => {
  if (value !== tabValue) return null;
  return <div className="tabs-content">{children}</div>;
};

const LocationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('departamentos');
  const [viewType, setViewType] = useState('map');
  const [selectedSemester, setSelectedSemester] = useState('2020-S1');
  const [selectedDepartamento, setSelectedDepartamento] = useState(null);
  const [semesters, setSemesters] = useState([]);
  
  const [data, setData] = useState({
    departamentos: {},
    paises: {},
    municipios: {},
    porSemestre: {}
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all necessary data from API
        const [
          departamentosRes,
          paisesRes,
          municipiosRes,
          porSemestreRes
        ] = await Promise.all([
          fetchDashboardDepartamento(),
          fetchDashboardCasosPais(),
          fetchDashboardCasosCiudadMunicipio(),
          fetchDashboardPorSemestreDepartamentoMunicipio()
        ]);

        setData({
          departamentos: departamentosRes.data || {},
          paises: paisesRes.data || {},
          municipios: municipiosRes.data || {},
          porSemestre: porSemestreRes.data || {}
        });

        // Extract available semester names
        const semestersAvailable = Object.keys(porSemestreRes.data || {}).sort();
        setSemesters(semestersAvailable);
        if (semestersAvailable.length > 0) {
          setSelectedSemester(semestersAvailable[0]);
        }

        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error loading geographic data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Prepare data for visualization
  const getColorScale = (data) => {
    if (!data || Object.keys(data).length === 0) return () => DEFAULT_COLOR;
    
    const values = Object.values(data);
    const maxValue = Math.max(...values);
    
    // If all values are equal or close to 0, return a simple function
    if (maxValue <= 1) return () => COLOR_RANGE[0];

    return scaleQuantile()
      .domain(values)
      .range(COLOR_RANGE);
  };

  // Convert data for bar charts or pie charts
  const convertToChartData = (dataObj) => {
    if (!dataObj) return [];
    
    return Object.entries(dataObj)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // For the breakdown by municipalities of a specific department
  const getMunicipiosByDepartamento = (departamento) => {
    if (!data.porSemestre || !data.porSemestre[selectedSemester] || !data.porSemestre[selectedSemester][departamento]) {
      return [];
    }
    
    return convertToChartData(data.porSemestre[selectedSemester][departamento]);
  };

  // Prepare the selected semester data for the map
  const getSemesterData = () => {
    if (!data.porSemestre || !data.porSemestre[selectedSemester]) return {};
    
    // Sum cases by department in the selected semester
    const departamentoTotals = {};
    Object.entries(data.porSemestre[selectedSemester]).forEach(([departamento, municipios]) => {
      departamentoTotals[departamento] = Object.values(municipios).reduce((sum, value) => sum + value, 0);
    });
    
    return departamentoTotals;
  };

  // Function to format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 shadow rounded border border-gray-200">
          <p className="font-bold">{data.name}</p>
          <p>Cases: <span className="font-medium">{formatNumber(data.value)}</span></p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading geographic data...</p>
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

  // Data for the current view
  const currentData = activeTab === 'departamentos' 
    ? (selectedSemester ? getSemesterData() : data.departamentos)
    : activeTab === 'paises' 
      ? data.paises 
      : data.municipios;

  const colorScale = getColorScale(currentData);
  const chartData = selectedDepartamento 
    ? getMunicipiosByDepartamento(selectedDepartamento)
    : convertToChartData(currentData);

  // Data for the top 10
  const top10Data = [...chartData].slice(0, 10);

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">COVID-19 Dashboard by Location</h1>
        <p className="text-gray-600 mt-2">
          Geographic visualization of epidemiological data
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex space-x-2 mb-6">
            <TabsTrigger value="departamentos">Departments</TabsTrigger>
            <TabsTrigger value="municipios">Municipalities</TabsTrigger>
            <TabsTrigger value="paises">Countries</TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-lg p-4 mb-6 flex flex-wrap justify-between items-center">
            {/* View selector */}
            <div className="flex space-x-2 mb-4 sm:mb-0">
              <button
                className={`px-3 py-1 text-sm rounded ${viewType === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setViewType('map')}
              >
                Map
              </button>
              <button
                className={`px-3 py-1 text-sm rounded ${viewType === 'chart' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setViewType('chart')}
              >
                Chart
              </button>
            </div>
            
            {/* Semester selector for department view */}
            {activeTab === 'departamentos' && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Semester:</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setSelectedDepartamento(null); // Reset department selection
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <TabsContent tabValue="departamentos" value={activeTab}>
            {viewType === 'map' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Cases by Department {selectedSemester && `- ${selectedSemester}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ComposableMap
                      projectionConfig={{ scale: 4000 }}
                      projection="geoMercator"
                      data-tip=""
                      style={{ width: "100%", height: "100%" }}
                    >
                      <ZoomableGroup center={[-74, 4]} zoom={1.5}>
                        <Geographies geography={colombiaGeoUrl}>
                          {({ geographies }) =>
                            geographies.map((geo) => {
                              // Normalize names to match data keys (uppercase)
                              const deptName = geo.properties.name?.toUpperCase() || 
                                              geo.properties.NOMBRE_DPT?.toUpperCase() || 
                                              geo.properties.DPTO_CNMBR?.toUpperCase();
                              const current = currentData[deptName] || 0;
                              
                              return (
                                <Geography
                                  key={geo.rsmKey}
                                  geography={geo}
                                  fill={colorScale(current)}
                                  stroke="#FFFFFF"
                                  strokeWidth={0.5}
                                  style={{
                                    default: { outline: "none" },
                                    hover: { outline: "none", fill: "#F53" },
                                    pressed: { outline: "none" },
                                  }}
                                  onClick={() => {
                                    setSelectedDepartamento(deptName);
                                  }}
                                  data-tip={`${deptName}: ${formatNumber(current)} cases`}
                                />
                              );
                            })
                          }
                        </Geographies>
                      </ZoomableGroup>
                    </ComposableMap>
                  </div>
                  
                  {/* Color scale */}
                  <div className="flex justify-center items-center mt-4">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 mr-2">Less</span>
                      <div className="flex">
                        {COLOR_RANGE.map((color, i) => (
                          <div
                            key={i}
                            style={{
                              backgroundColor: color,
                              width: "12px",
                              height: "12px",
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 ml-2">More</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDepartamento 
                      ? `Municipalities of ${selectedDepartamento} - ${selectedSemester}`
                      : `Top 10 Departments with Most Cases - ${selectedSemester}`
                    }
                  </CardTitle>
                  {selectedDepartamento && (
                    <button 
                      onClick={() => setSelectedDepartamento(null)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Return to all departments
                    </button>
                  )}
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={selectedDepartamento ? chartData : top10Data} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8"
                        name="Cases" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent tabValue="municipios" value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Municipalities with Most Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={top10Data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      fill="#82ca9d"
                      name="Cases" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent tabValue="paises" value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Cases by Country</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={150}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLOR_RANGE[index % COLOR_RANGE.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Details by Country</h3>
                    <div className="overflow-y-auto h-80">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {chartData.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(item.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="text-xs text-gray-500 mt-8 text-right">
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default LocationDashboard;