const { useState, useMemo } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } = Recharts;

// Lucide React icons as simple SVG components
const DollarSign = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
);

const TrendingDown = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
        <polyline points="17 18 23 18 23 12"></polyline>
    </svg>
);

const TrendingUp = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

const AlertTriangle = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

const FileText = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const WithdrawalCalculator = () => {
  const [inputs, setInputs] = useState({
    initialBalance: 1000000,
    annualWithdrawal: 40000,
    withdrawalStrategy: 'fixed',
    cashAllocation: 10,
    safeAllocation: 40,
    riskyAllocation: 50,
    safeGrowthRate: 4,
    inflationRate: 2.5,
    years: 30,
    dynamicAdjustment: 20
  });

  const sp500Returns = [
    32.31, -4.38, 21.04, 28.88, 10.88, 4.91, 15.79, 5.49, -37.0, 26.46,
    15.06, 2.11, 16.0, 32.39, 13.69, 1.38, 11.96, 21.83, -4.38, 28.88,
    18.40, -6.24, 31.21, 18.76, 32.50, -4.23, 21.61, 22.34, 28.36, 10.50
  ];

  const calculatePortfolio = (strategy) => {
    const results = [];
    let balance = inputs.initialBalance;
    let withdrawal = inputs.annualWithdrawal;
    const cashPct = inputs.cashAllocation / 100;
    const safePct = inputs.safeAllocation / 100;
    const riskyPct = inputs.riskyAllocation / 100;
    
    for (let year = 0; year <= inputs.years; year++) {
      if (year === 0) {
        results.push({
          year,
          balance,
          withdrawal: 0,
          marketReturn: 0,
          portfolioReturn: 0,
          cumulativeWithdrawal: 0
        });
        continue;
      }

      const sp500Return = sp500Returns[year % sp500Returns.length] / 100;
      const safeReturn = inputs.safeGrowthRate / 100;
      const cashReturn = 0.01;

      const portfolioReturn = (cashPct * cashReturn) + (safePct * safeReturn) + (riskyPct * sp500Return);
      
      balance = balance * (1 + portfolioReturn);

      let yearWithdrawal = withdrawal;
      
      if (strategy === 'dynamic') {
        if (portfolioReturn < 0) {
          yearWithdrawal = withdrawal * (1 - inputs.dynamicAdjustment / 100);
        } else if (portfolioReturn > 0.10) {
          yearWithdrawal = withdrawal * (1 + inputs.dynamicAdjustment / 100);
        }
      } else if (strategy === 'percentage') {
        yearWithdrawal = balance * 0.04;
      }

      balance = Math.max(0, balance - yearWithdrawal);
      
      if (strategy === 'fixed') {
        withdrawal = withdrawal * (1 + inputs.inflationRate / 100);
      }

      results.push({
        year,
        balance: Math.round(balance),
        withdrawal: Math.round(yearWithdrawal),
        marketReturn: sp500Return,
        portfolioReturn: portfolioReturn,
        cumulativeWithdrawal: results[year - 1].cumulativeWithdrawal + yearWithdrawal
      });

      if (balance <= 0) break;
    }

    return results;
  };

  const fixedResults = useMemo(() => calculatePortfolio('fixed'), [inputs]);
  const dynamicResults = useMemo(() => calculatePortfolio('dynamic'), [inputs]);

  const chartData = useMemo(() => {
    return fixedResults.map((fixed, idx) => ({
      year: fixed.year,
      fixed: fixed.balance,
      dynamic: dynamicResults[idx]?.balance || 0
    }));
  }, [fixedResults, dynamicResults]);

  const finalFixed = fixedResults[fixedResults.length - 1];
  const finalDynamic = dynamicResults[dynamicResults.length - 1];

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const printReport = () => {
    try {
      window.print();
    } catch (error) {
      console.error('Print error:', error);
      alert('Unable to open print dialog. Please use your browser\'s print function (Ctrl+P or Cmd+P)');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 print-shadow-none">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{color: '#00303C'}}>Strategic Withdrawal Plan Calculator</h1>
              <p className="text-slate-600">Compare fixed vs. dynamic withdrawal strategies with sequence of return risk analysis</p>
            </div>
            <button
              onClick={printReport}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition print-hidden"
              style={{backgroundColor: '#00768F'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#00303C'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#00768F'}
            >
              <FileText size={20} />
              Print PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print-grid-cols-3">
          <div className="bg-white rounded-lg shadow-lg p-6 print-shadow-none print-border print-border-gray-300">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#00303C'}}>Portfolio Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={inputs.initialBalance}
                  onChange={(e) => handleInputChange('initialBalance', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{focusRing: '#00768F'}}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Annual Withdrawal</label>
                <input
                  type="number"
                  value={inputs.annualWithdrawal}
                  onChange={(e) => handleInputChange('annualWithdrawal', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{focusRing: '#00768F'}}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time Period (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={inputs.years}
                  onChange={(e) => handleInputChange('years', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{focusRing: '#00768F'}}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Inflation Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.inflationRate}
                  onChange={(e) => handleInputChange('inflationRate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{focusRing: '#00768F'}}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 print-shadow-none print-border print-border-gray-300">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#00303C'}}>Asset Allocation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cash ({inputs.cashAllocation}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={inputs.cashAllocation}
                  onChange={(e) => handleInputChange('cashAllocation', e.target.value)}
                  className="w-full"
                />
                <div className="text-xs text-slate-500 mt-1">~1% return</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Safe Growth ({inputs.safeAllocation}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={inputs.safeAllocation}
                  onChange={(e) => handleInputChange('safeAllocation', e.target.value)}
                  className="w-full"
                />
                <input
                  type="number"
                  step="0.1"
                  value={inputs.safeGrowthRate}
                  onChange={(e) => handleInputChange('safeGrowthRate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:border-transparent mt-2"
                  style={{focusRing: '#00768F'}}
                  placeholder="Expected return %"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Risky Growth ({inputs.riskyAllocation}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={inputs.riskyAllocation}
                  onChange={(e) => handleInputChange('riskyAllocation', e.target.value)}
                  className="w-full"
                />
                <div className="text-xs text-slate-500 mt-1">S&P 500 historical returns</div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="text-sm font-medium text-slate-700">
                  Total: {inputs.cashAllocation + inputs.safeAllocation + inputs.riskyAllocation}%
                </div>
                {inputs.cashAllocation + inputs.safeAllocation + inputs.riskyAllocation !== 100 && (
                  <div className="text-xs text-red-600 mt-1">⚠ Should equal 100%</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 print-shadow-none print-border print-border-gray-300">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#00303C'}}>Dynamic Strategy Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Adjustment Rate ({inputs.dynamicAdjustment}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={inputs.dynamicAdjustment}
                  onChange={(e) => handleInputChange('dynamicAdjustment', e.target.value)}
                  className="w-full"
                />
                <div className="text-xs text-slate-500 mt-1">
                  How much to reduce withdrawals in bad years or increase in good years
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{backgroundColor: '#BC955C20'}}>
                <h3 className="font-semibold mb-2 flex items-center gap-2" style={{color: '#00303C'}}>
                  <AlertTriangle size={18} style={{color: '#896B25'}} />
                  Strategy Comparison
                </h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <p><strong>Fixed Strategy:</strong> Withdraws a fixed amount adjusted for inflation each year, regardless of market performance.</p>
                  <p><strong>Dynamic Strategy:</strong> Reduces withdrawals by {inputs.dynamicAdjustment}% in negative years and increases by {inputs.dynamicAdjustment}% when returns exceed 10%.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6 print-shadow-none print-border print-border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Fixed Strategy End Balance</h3>
              <TrendingDown style={{color: '#896B25'}} size={20} />
            </div>
            <div className="text-2xl font-bold" style={{color: '#00303C'}}>{formatCurrency(finalFixed.balance)}</div>
            <div className="text-xs text-slate-500 mt-1">After {finalFixed.year} years</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 print-shadow-none print-border print-border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Dynamic Strategy End Balance</h3>
              <TrendingUp style={{color: '#00768F'}} size={20} />
            </div>
            <div className="text-2xl font-bold" style={{color: '#00303C'}}>{formatCurrency(finalDynamic.balance)}</div>
            <div className="text-xs text-slate-500 mt-1">After {finalDynamic.year} years</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 print-shadow-none print-border print-border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Difference</h3>
              <DollarSign style={{color: '#BC955C'}} size={20} />
            </div>
            <div className="text-2xl font-bold" style={{color: '#00303C'}}>
              {formatCurrency(finalDynamic.balance - finalFixed.balance)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {((finalDynamic.balance - finalFixed.balance) / inputs.initialBalance * 100).toFixed(1)}% of initial
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 print-shadow-none print-border print-border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Portfolio Allocation</h3>
              <DollarSign style={{color: '#00303C'}} size={20} />
            </div>
            <div className="text-sm text-slate-700 space-y-1">
              <div>Cash: {formatCurrency(inputs.initialBalance * inputs.cashAllocation / 100)}</div>
              <div>Safe: {formatCurrency(inputs.initialBalance * inputs.safeAllocation / 100)}</div>
              <div>Risky: {formatCurrency(inputs.initialBalance * inputs.riskyAllocation / 100)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 print-shadow-none print-border print-border-gray-300 print-break-inside-avoid">
          <h2 className="text-xl font-semibold mb-4" style={{color: '#00303C'}}>Portfolio Balance Over Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Balance', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="fixed" 
                stroke="#896B25" 
                fill="#BC955C30" 
                name="Fixed Withdrawal"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="dynamic" 
                stroke="#00768F" 
                fill="#00768F20" 
                name="Dynamic Withdrawal"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 print-shadow-none print-border print-border-gray-300">
          <h2 className="text-xl font-semibold mb-4" style={{color: '#00303C'}}>Sequence of Return Risk Analysis</h2>
          <div className="prose max-w-none text-slate-700">
            <p className="mb-4">
              <strong>Key Finding:</strong> The dynamic withdrawal strategy results in a 
              <span className="font-semibold" style={{color: finalDynamic.balance > finalFixed.balance ? '#00768F' : '#896B25'}}>
                {" "}{formatCurrency(Math.abs(finalDynamic.balance - finalFixed.balance))}
              </span> difference compared to the fixed withdrawal strategy after {inputs.years} years.
            </p>
            
            <p className="mb-4">
              <strong>Sequence of Return Risk:</strong> This calculator demonstrates how the timing of investment returns significantly impacts portfolio longevity. 
              Poor returns early in retirement can devastate a portfolio more than the same poor returns later, because you're withdrawing from a 
              declining balance, leaving less capital to recover when markets improve.
            </p>

            <p className="mb-4">
              <strong>Dynamic Strategy Benefits:</strong> By reducing withdrawals by {inputs.dynamicAdjustment}% during market downturns, 
              you preserve more capital for future growth. Conversely, increasing withdrawals by {inputs.dynamicAdjustment}% during strong market 
              years (>10% returns) allows you to enjoy prosperity while maintaining portfolio sustainability.
            </p>

            <p>
              <strong>Your Portfolio Mix:</strong> Your allocation of {inputs.cashAllocation}% cash, {inputs.safeAllocation}% safe growth 
              (at {inputs.safeGrowthRate}% expected return), and {inputs.riskyAllocation}% S&P 500 exposure creates a 
              {inputs.riskyAllocation > 60 ? " aggressive" : inputs.riskyAllocation > 40 ? " balanced" : " conservative"} portfolio 
              designed to weather market volatility while providing growth potential.
            </p>
          </div>
        </div>

        <div className="hidden print-block mt-6 pt-4 border-t border-gray-300 text-center text-sm text-slate-600">
          <p>Strategic Withdrawal Plan Calculator - Generated {new Date().toLocaleDateString()}</p>
          <p className="text-xs mt-1">This report is for informational purposes only and does not constitute financial advice.</p>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<WithdrawalCalculator />, document.getElementById('root'));