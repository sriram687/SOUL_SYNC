import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Heart, Phone, BookOpen, Users, ExternalLink, ArrowRight, Mail, Calendar, Award, BookMarked, Brain, Headphones, Coffee, Sparkles, MessageCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

function App() {
  const [activeSection, setActiveSection] = useState(null);
  const [activeChart, setActiveChart] = useState('depression');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState(0);

  // Handle chart transitions
  const changeChart = (chartType) => {
    if (chartType !== activeChart) {
      setIsTransitioning(true);
      setActiveChart(chartType);
      setActivePieIndex(0);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Depression rates by country data
  const depressionData = [
    { name: 'Ukraine', value: 6.3, color: '#5e92b0' },
    { name: 'United States', value: 5.9, color: '#7aabc9' },
    { name: 'Australia', value: 5.9, color: '#4d9db1' },
    { name: 'Estonia', value: 5.9, color: '#488fa1' },
    { name: 'Brazil', value: 5.8, color: '#6ba6c3' }
  ];

  // Suicide risk by mental illness data
  const suicideRiskData = [
    { name: 'Bipolar Disorder', value: 7.77, color: '#e78a69' },
    { name: 'Depression', value: 60, color: '#f29e78' },
    { name: 'Schizophrenia', value: 10, color: '#fab795' },
    { name: 'Eating Disorders', value: 20, color: '#f7a57e' }
  ];

  // Mental health disorder prevalence by age group
  const ageGroupData = [
    { name: 'Adolescents (10-19)', value: 15, color: '#7fb58e' },
    { name: 'Young Adults (20-29)', value: 20, color: '#6b9d83' },
    { name: 'Adults & Elderly', value: 25, color: '#589177' }
  ];

  // Mental health challenges in women
  const womenMentalHealthData = [
    { name: 'Postmenstrual', value: 20, color: '#ba9eb7' },
    { name: 'Pregnancy', value: 33, color: '#d1a7c9' },
    { name: 'Mood Swings', value: 25, color: '#c396af' },
    { name: 'Depression', value: 11.1, color: '#a889a0' },
    { name: 'Anxiety Disorders', value: 23.4, color: '#c9a6c3' },
    { name: 'Postpartum Depression', value: 14.3, color: '#ad9abc' }
  ];

  // Chart configuration data
  const chartConfigs = {
    depression: {
      title: "Depression Rates by Country",
      xLabel: "Countries",
      yLabel: "Depression Rates (%)",
      yDomain: [5.5, 6.5],
      data: depressionData,
      tooltipLabel: "Depression Rate",
      color: "#5e92b0",
      bgGradient: "from-blue-50 to-teal-50"
    },
    suicide: {
      title: "Suicide Risk Associated with Mental Illnesses",
      xLabel: "Mental Illness",
      yLabel: "Suicide Risk (%)",
      yDomain: [0, 70],
      data: suicideRiskData,
      tooltipLabel: "Suicide Risk",
      color: "#e78a69",
      bgGradient: "from-orange-50 to-red-50"
    },
    age: {
      title: "Mental Health Disorder Prevalence by Age Group",
      xLabel: "Age Groups",
      yLabel: "Prevalence (%)",
      yDomain: [0, 30],
      data: ageGroupData,
      tooltipLabel: "Prevalence",
      color: "#7fb58e",
      bgGradient: "from-teal-50 to-green-50"
    },
    women: {
      title: "Mental Health Challenges in Women",
      xLabel: "Mental Health Conditions",
      yLabel: "Prevalence (%)",
      yDomain: [0, 40],
      data: womenMentalHealthData,
      tooltipLabel: "Prevalence",
      color: "#ba9eb7",
      bgGradient: "from-purple-50 to-pink-50"
    }
  };

  // Custom tooltip component for better hovering experience
  const CustomTooltip = ({ active, payload, label, chartType }) => {
    if (active && payload && payload.length) {
      const config = chartConfigs[chartType];
      
      return (
        <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-700 text-sm">{label}</p>
          <p className="text-gray-600 font-medium text-sm">
            {`${config.tooltipLabel}: `}
            <span style={{ color: payload[0].payload.color }} className="font-bold">{`${payload[0].value}%`}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom active shape for pie chart
  const renderActiveShape = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>{payload.name}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {`${value.toFixed(1)}%`}
        </text>
      </g>
    );
  };

  // Render bar chart based on active selection
  const renderBarChart = (chartKey) => {
    const config = chartConfigs[chartKey];
    
    return (
      <div className={`h-full w-full transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={config.data}
            margin={{ top: 10, right: 10, left: 10, bottom: chartKey === 'women' ? 40 : 20 }}
          >
            <defs>
              {config.data.map((entry, index) => (
                <linearGradient key={`${chartKey}-gradient-${index}`} id={`${chartKey}Gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={entry.color} stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              angle={chartKey === 'women' ? -35 : 0}
              textAnchor={chartKey === 'women' ? "end" : "middle"}
              height={chartKey === 'women' ? 50 : 30}
              tick={{ fill: '#64748b', fontSize: 12 }}
              stroke="#cbd5e1"
            />
            <YAxis 
              domain={config.yDomain}
              tick={{ fill: '#64748b', fontSize: 12 }}
              stroke="#cbd5e1"
              width={35}
            />
            <Tooltip content={<CustomTooltip chartType={chartKey} />} />
            <Bar 
              dataKey="value" 
              name={config.tooltipLabel} 
              radius={[4, 4, 0, 0]}
              barSize={chartKey === 'women' ? 25 : 35}
              animationDuration={500}
            >
              {config.data.map((entry, index) => (
                <Cell 
                  key={`${chartKey}-bar-${index}`} 
                  fill={`url(#${chartKey}Gradient-${index})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render pie chart based on active selection
  const renderPieChart = (chartKey) => {
    const config = chartConfigs[chartKey];
    
    return (
      <div className={`h-full w-full transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activePieIndex}
              activeShape={renderActiveShape}
              data={config.data}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="60%"
              dataKey="value"
              onMouseEnter={(_, index) => setActivePieIndex(index)}
              animationDuration={500}
            >
              {config.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center p-5 bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <Brain className="w-10 h-10 text-white" />
            <h1 className="text-2xl font-bold">Soul Sync</h1>
          </Link>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 mt-16 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16 transform transition-all duration-500 hover:scale-105">
          <h1 className="text-5xl font-bold text-white mb-6 animate-fade-in">
            Mental Health Resources
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Your journey to better mental health starts here. Find support, guidance, and resources tailored to your needs.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {[
            { icon: Users, value: '-', label: 'People Helped' },
            { icon: MessageCircle, value: '24/7', label: 'Support Available' },
            { icon: Award, value: '98%', label: 'Success Rate' },
            { icon: Clock, value: '1M+', label: 'Support Hours' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/30 backdrop-blur-sm rounded-xl p-6 text-center text-white transform transition-all duration-300 hover:scale-105">
              <stat.icon className="w-8 h-8 mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mental Health Statistics Dashboard */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Mental Health Statistics</h2>
          <div className={`bg-gradient-to-br ${chartConfigs[activeChart].bgGradient} rounded-xl shadow-lg p-4 transition-all duration-500 w-full flex flex-col`}>
            <div className="mb-2">
              <h1 className="text-xl font-bold text-gray-700 text-center mb-2">Mental Health Statistics Dashboard</h1>
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                {Object.keys(chartConfigs).map((chartKey) => (
                  <button 
                    key={chartKey}
                    onClick={() => changeChart(chartKey)}
                    className={`px-3 py-1 rounded-full transition-all duration-300 text-sm font-medium shadow-sm
                      ${activeChart === chartKey 
                        ? `text-white shadow-md` 
                        : 'bg-white bg-opacity-80 text-gray-600 hover:bg-white hover:bg-opacity-90'
                      }
                      focus:outline-none m-1`}
                    style={{
                      backgroundColor: activeChart === chartKey ? chartConfigs[chartKey].color : '',
                      borderColor: chartConfigs[chartKey].color,
                      borderWidth: activeChart !== chartKey ? '1px' : '0',
                      transform: activeChart === chartKey ? 'scale(1.05)' : 'scale(1)',
                      minWidth: '120px',
                    }}
                  >
                    {chartConfigs[chartKey].title}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-inner flex-grow">
              <h2 className={`text-lg font-bold text-center mb-2 text-gray-700`}>
                {chartConfigs[activeChart].title} <span style={{ color: chartConfigs[activeChart].color }}>(%)</span>
              </h2>
              
              <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                {/* Bar Chart */}
                <div className="w-full md:w-1/2 h-72 md:h-96">
                  <div className="bg-white bg-opacity-50 p-3 rounded-lg shadow-sm h-full">
                    <h3 className="text-sm font-semibold text-center mb-2 text-gray-600">Bar Chart View</h3>
                    {renderBarChart(activeChart)}
                  </div>
                </div>
                
                {/* Pie Chart */}
                <div className="w-full md:w-1/2 h-72 md:h-96">
                  <div className="bg-white bg-opacity-50 p-3 rounded-lg shadow-sm h-full">
                    <h3 className="text-sm font-semibold text-center mb-2 text-gray-600">Pie Chart View</h3>
                    {renderPieChart(activeChart)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-center text-xs text-gray-500">
              <p>Data source: World Health Organization - Mental Health Statistics 2024</p>
            </div>
          </div>
        </div>

        {/* Main Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Emergency Support Card */}
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            onMouseEnter={() => setActiveSection('emergency')}
            onMouseLeave={() => setActiveSection(null)}
          >
            <div className="flex items-center mb-6">
              <Phone className="w-8 h-8 text-pink-500" />
              <h2 className="text-2xl font-bold ml-3 text-gray-800">24/7 Crisis Support</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                <p className="font-semibold text-pink-800">National Crisis Line</p>
                <p className="text-pink-700">1-800-273-8255</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p className="font-semibold text-purple-800">Crisis Text Line</p>
                <p className="text-purple-700">Text HOME to 741741</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                <p className="font-semibold text-pink-800">Veterans Crisis Line</p>
                <p className="text-pink-700">1-800-273-8255 (Press 1)</p>
              </div>
            </div>
          </div>

          {/* Educational Resources Card */}
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            onMouseEnter={() => setActiveSection('education')}
            onMouseLeave={() => setActiveSection(null)}
          >
            <div className="flex items-center mb-6">
              <BookOpen className="w-8 h-8 text-purple-500" />
              <h2 className="text-2xl font-bold ml-3 text-gray-800">Learn & Grow</h2>
            </div>
            <ul className="space-y-4">
              {[
                'Understanding Anxiety and Depression',
                'Mindfulness Techniques',
                'Stress Management Strategies',
                'Building Healthy Relationships',
                'Sleep Hygiene Tips',
                'Emotional Intelligence Development'
              ].map((topic, index) => (
                <li key={index} className="flex items-center group">
                  <ArrowRight className="w-4 h-4 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <a href="#" className="ml-2 text-gray-700 hover:text-pink-500 transition-colors">
                    {topic}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Groups Card */}
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            onMouseEnter={() => setActiveSection('groups')}
            onMouseLeave={() => setActiveSection(null)}
          >
            <div className="flex items-center mb-6">
              <Users className="w-8 h-8 text-purple-500" />
              <h2 className="text-2xl font-bold ml-3 text-gray-800">Support Groups</h2>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Anxiety Support', time: 'Mondays 7PM EST', spots: '5 spots left' },
                { title: 'Depression Support', time: 'Wednesdays 6PM EST', spots: '3 spots left' },
                { title: 'PTSD Support', time: 'Thursdays 7PM EST', spots: '8 spots left' },
                { title: 'Grief Support', time: 'Fridays 5PM EST', spots: '4 spots left' }
              ].map((group, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <p className="font-semibold text-gray-800">{group.title}</p>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {group.time}
                    </div>
                    <span className="text-purple-600">{group.spots}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wellness Programs Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Wellness Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Brain,
                title: 'Mindfulness Course',
                description: '8-week program for mental clarity',
                duration: '45 mins/week'
              },
              {
                icon: Headphones,
                title: 'Guided Meditation',
                description: 'Daily audio sessions',
                duration: '15 mins/day'
              },
              {
                icon: Coffee,
                title: 'Wellness Workshop',
                description: 'Interactive group sessions',
                duration: '90 mins/month'
              },
              {
                icon: Sparkles,
                title: 'Stress Relief',
                description: 'Practical coping techniques',
                duration: '30 mins/week'
              }
            ].map((program, index) => (
              <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 transform transition-all duration-300 hover:scale-105">
                <program.icon className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{program.title}</h3>
                <p className="text-gray-600 mb-4">{program.description}</p>
                <div className="text-sm text-purple-600 font-medium">{program.duration}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Self-Care Guide',
                description: 'Download our comprehensive guide to daily mental wellness practices.',
                icon: Heart,
                action: 'Download Now'
              },
              {
                title: 'Weekly Newsletter',
                description: 'Subscribe to receive weekly mental health tips and resources.',
                icon: Mail,
                action: 'Subscribe'
              },
              {
                title: 'Professional Directory',
                description: 'Find licensed therapists and counselors in your area.',
                icon: BookMarked,
                action: 'Search Directory'
              }
            ].map((resource, index) => (
              <div key={index} className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl transform transition-all duration-300 hover:scale-105">
                <resource.icon className="w-8 h-8 text-pink-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{resource.title}</h3>
                <p className="text-gray-600">{resource.description}</p>
                <button className="mt-4 text-pink-500 font-semibold flex items-center hover:text-pink-600 transition-colors">
                  {resource.action}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;