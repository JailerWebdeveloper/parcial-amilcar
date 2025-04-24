import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  fetchDashboardTiempoAnio,
  fetchDashboardTiempoMes,
  fetchDashboardTiempoDia,
  fetchDashboardTiempoSemestre,
} from "../services/dashboardApi";

const COLORS = {
  year: "#3498db",
  semester: "#2ecc71",
  month: "#e74c3c",
  day: "#9b59b6",
};

const TimelineDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    years: [],
    months: [],
    days: [],
    semesters: [],
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("years");
  const [timeView, setTimeView] = useState("line");
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch data from the API endpoints
        const [yearRes, monthRes, dayRes, semesterRes] = await Promise.all([
          fetchDashboardTiempoAnio(),
          fetchDashboardTiempoMes(),
          fetchDashboardTiempoDia(),
          fetchDashboardTiempoSemestre(),
        ]);

        // Process year data - convert object to array format
        const yearData = Object.entries(yearRes.data)
          .map(([key, value]) => ({
            name: key,
            cases: value,
            formattedName: key,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        // Process semester data - convert object to array format
        const semesterData = Object.entries(semesterRes.data)
          .map(([key, value]) => {
            const [year, semester] = key.split("-S");
            return {
              name: key,
              cases: value,
              year: year,
              semester: `S${semester}`,
              formattedName: `${year} - Semestre ${semester}`,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        // Process month data - convert object to array format
        const monthData = Object.entries(monthRes.data)
          .map(([key, value]) => {
            const [year, month] = key.split("-");
            // Convert month number to month name
            const monthNames = [
              "Enero",
              "Febrero",
              "Marzo",
              "Abril",
              "Mayo",
              "Junio",
              "Julio",
              "Agosto",
              "Septiembre",
              "Octubre",
              "Noviembre",
              "Diciembre",
            ];
            const monthIndex = parseInt(month) - 1;
            return {
              name: key,
              cases: value,
              year: year,
              month: monthNames[monthIndex],
              formattedName: `${monthNames[monthIndex]} ${year}`,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        // Process day data - convert object to array format
        const dayData = Object.entries(dayRes.data)
          .map(([key, value]) => {
            const date = new Date(key);
            return {
              name: key,
              cases: value,
              formattedName: new Date(key).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            };
          })
          .sort((a, b) => new Date(a.name) - new Date(b.name));

        // Find the earliest and latest dates in the day data
        if (dayData.length > 0) {
          const startDate = new Date(dayData[0].name);
          const endDate = new Date(dayData[dayData.length - 1].name);
          setDateRange({ start: startDate, end: endDate });
        }

        setData({
          years: yearData,
          months: monthData,
          days: dayData,
          semesters: semesterData,
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching timeline data:", err);
        setError(
          "Error cargando los datos de timeline. Por favor, intente de nuevo más tarde."
        );
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
        <p className="ml-4 text-gray-600">Cargando datos temporales...</p>
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

  // Calculate statistics
  const getTotalCases = () => {
    return data.years
      .reduce((total, year) => total + year.cases, 0)
      .toLocaleString();
  };

  const getPeakYear = () => {
    if (data.years.length === 0) return "No data";
    const peakYear = data.years.reduce((max, year) =>
      max.cases > year.cases ? max : year
    );
    return `${peakYear.name} (${peakYear.cases.toLocaleString()} casos)`;
  };

  const getPeakMonth = () => {
    if (data.months.length === 0) return "No data";
    const peakMonth = data.months.reduce((max, month) =>
      max.cases > month.cases ? max : month
    );
    return `${
      peakMonth.formattedName
    } (${peakMonth.cases.toLocaleString()} casos)`;
  };

  const getCurrentTrend = () => {
    if (data.months.length < 2) return "Datos insuficientes";

    // Get the last two months to determine trend
    const sortedMonths = [...data.months].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const lastMonth = sortedMonths[sortedMonths.length - 1];
    const previousMonth = sortedMonths[sortedMonths.length - 2];

    if (!lastMonth || !previousMonth) return "Datos insuficientes";

    const percentChange =
      ((previousMonth.cases - lastMonth.cases) / previousMonth.cases) * 100;

    if (percentChange > 0) {
      return `En aumento (+${percentChange.toFixed(1)}%)`;
    } else if (percentChange < 0) {
      return `En descenso (${percentChange.toFixed(1)}%)`;
    } else {
      return "Estable";
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Determinar información adicional según el tipo de datos
      let additionalInfo = null;

      if (activeTab === "months" && data.year && data.month) {
        additionalInfo = (
          <div className="mt-1 pt-1 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Año: <span className="font-medium">{data.year}</span>
            </p>
          </div>
        );
      } else if (activeTab === "semesters" && data.year && data.semester) {
        additionalInfo = (
          <div className="mt-1 pt-1 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Año: <span className="font-medium">{data.year}</span>
            </p>
            <p className="text-xs text-gray-500">
              Semestre: <span className="font-medium">{data.semester}</span>
            </p>
          </div>
        );
      } else if (activeTab === "days") {
        const date = new Date(data.name);
        additionalInfo = (
          <div className="mt-1 pt-1 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Fecha completa:{" "}
              <span className="font-medium">
                {date.toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          </div>
        );
      }

      // Calcular porcentaje respecto al total
      const totalCases =
        activeTab === "years"
          ? data.years?.reduce((sum, year) => sum + year.cases, 0)
          : data.years?.reduce((sum, year) => sum + year.cases, 0);

      const percentage = totalCases
        ? ((data.cases / totalCases) * 100).toFixed(2)
        : "N/A";

      // Determinar el color según el tipo de vista
      const borderColor = COLORS[activeTab.slice(0, -1)];

      return (
        <div
          className="bg-white p-4 shadow-lg rounded-md border-l-4"
          style={{ borderLeftColor: borderColor }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">{data.formattedName}</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
              {activeTab.slice(0, -1)}
            </span>
          </div>

          <div className="mt-2">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Casos:</p>
              <p className="font-bold text-gray-800">
                {data.cases.toLocaleString()}
              </p>
            </div>

            {percentage !== "N/A" && (
              <div className="flex justify-between items-center mt-1">
                <p className="text-gray-600">% del total:</p>
                <p className="font-medium">{percentage}%</p>
              </div>
            )}
          </div>

          {additionalInfo}
        </div>
      );
    }
    return null;
  };

  // Helper function to get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case "years":
        return data.years;
      case "semesters":
        return data.semesters;
      case "months":
        return data.months;
      case "days":
        return data.days;
      default:
        return data.years;
    }
  };

  // Calculate the chart title based on active tab
  const getChartTitle = () => {
    switch (activeTab) {
      case "years":
        return "Casos por Año";
      case "semesters":
        return "Casos por Semestre";
      case "months":
        return "Casos por Mes";
      case "days":
        return "Casos por Día";
      default:
        return "Casos a lo largo del tiempo";
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Evolución Temporal COVID-19
        </h1>
        <p className="text-gray-600 mt-2">
          Análisis de la distribución de casos a lo largo del tiempo
        </p>
      </div>

      {/* Resumen de Datos Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total de Casos</p>
          <p className="text-2xl font-bold text-gray-800">{getTotalCases()}</p>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Año con más casos</p>
          <p className="text-2xl font-bold text-gray-800">{getPeakYear()}</p>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Mes con más casos</p>
          <p className="text-2xl font-bold text-gray-800">{getPeakMonth()}</p>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Tendencia Actual</p>
          <p className="text-2xl font-bold text-gray-800">
            {getCurrentTrend()}
          </p>
        </div>
      </div>

      {/* Tabs de navegación temporal */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center overflow-x-auto">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "years"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("years")}
            >
              Por Año
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "semesters"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("semesters")}
            >
              Por Semestre
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "months"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("months")}
            >
              Por Mes
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "days"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("days")}
            >
              Por Día
            </button>
          </li>
        </ul>
      </div>

      {/* Visualización principal */}
      <div className="bg-white p-6 rounded shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {getChartTitle()}
          </h2>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded ${
                timeView === "line"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setTimeView("line")}
            >
              Línea
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${
                timeView === "bar"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setTimeView("bar")}
            >
              Barras
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${
                timeView === "area"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setTimeView("area")}
            >
              Área
            </button>
          </div>
        </div>

        {/* Cuerpo principal del gráfico */}
        <ResponsiveContainer width="100%" height={400}>
          {timeView === "line" ? (
            <LineChart data={getCurrentData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="formattedName"
                interval={
                  activeTab === "days" ? 30 : activeTab === "months" ? 2 : 0
                }
                angle={activeTab === "days" ? -45 : 0}
                textAnchor={activeTab === "days" ? "end" : "middle"}
                height={60}
              />
              <YAxis tickFormatter={(tick) => tick.toLocaleString()} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cases"
                stroke={COLORS[activeTab.slice(0, -1)]}
                activeDot={{ r: 8 }}
                name="Casos"
                strokeWidth={2}
              />
            </LineChart>
          ) : timeView === "bar" ? (
            <BarChart data={getCurrentData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="formattedName"
                interval={
                  activeTab === "days" ? 30 : activeTab === "months" ? 2 : 0
                }
                angle={activeTab === "days" ? -45 : 0}
                textAnchor={activeTab === "days" ? "end" : "middle"}
                height={60}
              />
              <YAxis tickFormatter={(tick) => tick.toLocaleString()} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="cases"
                fill={COLORS[activeTab.slice(0, -1)]}
                name="Casos"
              />
            </BarChart>
          ) : (
            <AreaChart data={getCurrentData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="formattedName"
                interval={
                  activeTab === "days" ? 30 : activeTab === "months" ? 2 : 0
                }
                angle={activeTab === "days" ? -45 : 0}
                textAnchor={activeTab === "days" ? "end" : "middle"}
                height={60}
              />
              <YAxis tickFormatter={(tick) => tick.toLocaleString()} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="cases"
                stroke={COLORS[activeTab.slice(0, -1)]}
                fill={`${COLORS[activeTab.slice(0, -1)]}80`}
                name="Casos"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>

        {/* Análisis y observaciones */}
        <div className="mt-8">
          <h3 className="font-medium text-gray-700 mb-2">Análisis temporal</h3>

          {activeTab === "years" && (
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                La distribución anual de casos muestra que{" "}
                <strong>{getPeakYear().split(" ")[0]}</strong> fue el año con
                mayor incidencia, con un total de casos significativamente
                superior al resto de años.
              </p>
              <p>
                Se observa una tendencia descendente desde el pico de la
                pandemia, con una reducción sustancial de casos en los años
                posteriores.
              </p>
            </div>
          )}

          {activeTab === "semesters" && (
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                El análisis semestral revela que el primer semestre de{" "}
                {
                  data.semesters.reduce((max, sem) =>
                    max.cases > sem.cases ? max : sem
                  ).year
                }{" "}
                registró el mayor número de casos.
              </p>
              <p>
                Se puede observar una fluctuación estacional en los datos
                semestrales, con tendencia a mayores números en el primer
                semestre de cada año.
              </p>
            </div>
          )}

          {activeTab === "months" && (
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                El mes con mayor número de casos registrados fue{" "}
                {getPeakMonth().split(" (")[0]}.
              </p>
              <p>
                Los datos mensuales muestran claramente los diferentes picos y
                olas de la pandemia, con periodos de intensificación seguidos
                por descensos en el número de casos.
              </p>
            </div>
          )}

          {activeTab === "days" && (
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                La visualización diaria muestra la volatilidad en el registro de
                casos, con fluctuaciones significativas entre días consecutivos.
              </p>
              <p>
                Se puede observar patrones semanales, con tendencia a reportes
                más bajos durante los fines de semana y aumentos los días
                laborables.
              </p>
            </div>
          )}

          {/* Período analizado */}
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">
              Período analizado:{" "}
              {dateRange.start
                ? dateRange.start.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "No disponible"}{" "}
              -{" "}
              {dateRange.end
                ? dateRange.end.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "No disponible"}
            </p>
          </div>
        </div>
      </div>

      {/* Comparativa con datos generales */}
      {activeTab !== "days" && (
        <div className="mt-6 bg-white p-6 rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Comparativa de Períodos
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Período</th>
                  <th className="py-3 px-6 text-right">Casos</th>
                  <th className="py-3 px-6 text-right">% del Total</th>
                  <th className="py-3 px-6 text-right">
                    Variación respecto período anterior
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {getCurrentData().map((item, index) => {
                  const totalCases = data.years.reduce(
                    (sum, year) => sum + year.cases,
                    0
                  );
                  const percentage = ((item.cases / totalCases) * 100).toFixed(
                    2
                  );

                  // Calculate variation from previous period
                  let variation = "-";
                  if (index > 0) {
                    const previousCases = getCurrentData()[index - 1].cases;
                    if (previousCases > 0) {
                      const changePercent = (
                        ((item.cases - previousCases) / previousCases) *
                        100
                      ).toFixed(2);
                      variation = `${changePercent}%`;

                      // Add color and arrow based on direction
                      if (parseFloat(changePercent) > 0) {
                        variation = (
                          <span className="text-red-500">↑ {variation}</span>
                        );
                      } else if (parseFloat(changePercent) < 0) {
                        variation = (
                          <span className="text-green-500">↓ {variation}</span>
                        );
                      } else {
                        variation = <span className="text-gray-500">→ 0%</span>;
                      }
                    }
                  }

                  return (
                    <tr
                      key={item.name}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-6 text-left">
                        {item.formattedName}
                      </td>
                      <td className="py-3 px-6 text-right font-medium">
                        {item.cases.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-right">{percentage}%</td>
                      <td className="py-3 px-6 text-right">{variation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-8 text-right">
        Última actualización: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default TimelineDashboard;
