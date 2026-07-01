import React, { useState } from 'react';
import { Card, Button, Badge, Progress } from '../components/ui';
import { useRiskCalculator } from '../hooks/useRiskCalculator';
import { INDUSTRIES, DATA_TYPES, ENCRYPTION_TYPES, DATA_LIFETIME_OPTIONS } from '../constants/industries';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Shield, Database, Clock, Calculator, AlertTriangle, 
  Download, ArrowRight, Activity, Zap, CheckCircle, ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const RiskCalculator: React.FC = () => {
  const [industry, setIndustry] = useState('tech');
  const [dataType, setDataType] = useState('personal');
  const [encryption, setEncryption] = useState('rsa-2048');
  const [dataLifetime, setDataLifetime] = useState(10);
  const [isHovering, setIsHovering] = useState(false);

  const { calculate, isLoading } = useRiskCalculator();
  const [result, setResult] = useState<any>(null);

  const handleCalculate = () => {
    const res = calculate({
      industry,
      dataType,
      encryption,
      dataLifetime,
    });
    if (res) {
      setResult(res);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium text-sm mb-6">
            <Activity className="w-4 h-4" />
            Vulnerability Scanner
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Quantum <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Risk Calculator</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Evaluate your cryptographic infrastructure against future quantum threats. Generate an actionable migration report in seconds.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Input Form Column */}
          <motion.div variants={itemVariants} className={`transition-all duration-500 ${result ? 'lg:col-span-5' : 'lg:col-start-3 lg:col-span-8'}`}>
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
              
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <Zap className="w-6 h-6 text-cyan-400" />
                Assessment Parameters
              </h2>

              <div className="space-y-6">
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Building2 className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  Industry Sector
                </label>
                <div className="relative">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-950/50 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none transition-all hover:border-slate-600"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.value} value={ind.value} className="bg-slate-900">
                        {ind.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Database className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  Primary Data Type
                </label>
                <div className="relative">
                  <select
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-950/50 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none transition-all hover:border-slate-600"
                  >
                    {DATA_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value} className="bg-slate-900">
                        {dt.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Shield className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  Current Encryption Standard
                </label>
                <div className="relative">
                  <select
                    value={encryption}
                    onChange={(e) => setEncryption(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-950/50 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none transition-all hover:border-slate-600"
                  >
                    {ENCRYPTION_TYPES.map((enc) => (
                      <option key={enc.value} value={enc.value} className="bg-slate-900">
                        {enc.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Clock className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  Required Data Lifetime
                </label>
                <div className="relative">
                  <select
                    value={dataLifetime}
                    onChange={(e) => setDataLifetime(Number(e.target.value))}
                    className="w-full pl-4 pr-10 py-3 bg-slate-950/50 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none transition-all hover:border-slate-600"
                  >
                    {DATA_LIFETIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                  </div>
                </div>
              </div>

              <div 
                className="pt-6"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <Button 
                  onClick={handleCalculate} 
                  isLoading={isLoading} 
                  className="w-full py-4 text-lg font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)]"
                >
                  <Calculator className={`w-5 h-5 transition-transform duration-300 ${isHovering ? 'rotate-12 scale-110' : ''}`} />
                  Analyze Threat Vector
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

          {/* Results Column */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                className="lg:col-span-7 space-y-6"
              >
                {/* Main Score Card */}
                <div className={`p-1 rounded-3xl bg-gradient-to-br ${
                  result.level === 'Critical' ? 'from-red-500/50 to-red-900/50' :
                  result.level === 'High' ? 'from-orange-500/50 to-orange-900/50' :
                  result.level === 'Medium' ? 'from-amber-500/50 to-amber-900/50' :
                  'from-emerald-500/50 to-emerald-900/50'
                }`}>
                  <div className="bg-slate-950 rounded-[22px] p-8 h-full">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <AlertTriangle className={`w-6 h-6 ${
                          result.level === 'Critical' ? 'text-red-500' :
                          result.level === 'High' ? 'text-orange-500' :
                          result.level === 'Medium' ? 'text-amber-500' :
                          'text-emerald-500'
                        }`} />
                        Threat Analysis Result
                      </h2>
                      <Badge variant={result.level.toLowerCase() as any} className="text-sm px-4 py-1.5 shadow-lg">
                        {result.level.toUpperCase()} RISK
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <p className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Vulnerability Score</p>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-5xl font-black text-white">{result.score}</span>
                          <span className="text-xl text-slate-500 font-medium">/ 100</span>
                        </div>
                        <Progress 
                          value={result.score} 
                          max={100} 
                          className="h-2"
                        />
                      </div>

                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <p className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Estimated Time To Break</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-white">{result.yearsUntilRisk}</span>
                          <span className="text-xl text-slate-500 font-medium">Years</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 font-medium">Based on current quantum scaling projections</p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                        Actionable Mitigation Steps
                      </h3>
                      <ul className="space-y-3">
                        {result.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                            <ArrowRight className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      <Button 
                        onClick={() => {
                          const doc = new jsPDF();
                          const pageWidth = doc.internal.pageSize.width;
                          
                          // 1. Header (Dark Navy background)
                          doc.setFillColor(15, 23, 42); // slate-900
                          doc.rect(0, 0, pageWidth, 40, 'F');
                          
                          doc.setTextColor(255, 255, 255);
                          doc.setFontSize(24);
                          doc.setFont('helvetica', 'bold');
                          doc.text('Novocrypt', 20, 22);
                          
                          doc.setTextColor(34, 211, 238); // cyan-400
                          doc.setFontSize(14);
                          doc.setFont('helvetica', 'normal');
                          doc.text('QUANTUM RISK ASSESSMENT REPORT', 20, 32);

                          // Date & time in header (real-time)
                          doc.setTextColor(200, 200, 200);
                          doc.setFontSize(10);
                          const generatedAt = new Date().toLocaleString();
                          doc.text(`Generated: ${generatedAt}`, pageWidth - 20, 32, { align: 'right' });

                          // Lookup Helpers for Labels
                          const indLabel = INDUSTRIES.find(i => i.value === industry)?.label || industry;
                          const dataLabel = DATA_TYPES.find(i => i.value === dataType)?.label || dataType;
                          const encLabel = ENCRYPTION_TYPES.find(i => i.value === encryption)?.label || encryption;
                          
                          // 2. Input Summary Table
                          doc.setTextColor(51, 65, 85); // reset text color
                          autoTable(doc, {
                            startY: 50,
                            head: [['Assessment Parameter', 'Selected Value']],
                            body: [
                              ['Industry', indLabel],
                              ['Data Type', dataLabel],
                              ['Current Encryption', encLabel],
                              ['Data Lifetime', `${dataLifetime} Years`]
                            ],
                            theme: 'grid',
                            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }, // slate-800
                            styles: { fontSize: 11, cellPadding: 6 },
                            columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold' } }
                          });

                          // 3. Risk Results section
                          const finalY = (doc as any).lastAutoTable.finalY + 15;
                          
                          doc.setFontSize(16);
                          doc.setTextColor(15, 23, 42);
                          doc.setFont('helvetica', 'bold');
                          doc.text('Risk Analysis Breakdown', 20, finalY);
                          
                          const resultY = finalY + 10;
                          
                          // Score Box
                          doc.setFillColor(241, 245, 249); // slate-100
                          doc.rect(20, resultY, 50, 25, 'F');
                          doc.setFontSize(12);
                          doc.setTextColor(100, 116, 139);
                          doc.text('Risk Score', 45, resultY + 8, { align: 'center' });
                          doc.setTextColor(15, 23, 42);
                          doc.setFontSize(22);
                          doc.text(`${result.score}/100`, 45, resultY + 18, { align: 'center' });

                          // Level Box
                          let levelColor = [15, 23, 42]; // default dark
                          if(result.level === 'Critical') levelColor = [239, 68, 68]; // red-500
                          if(result.level === 'High') levelColor = [249, 115, 22]; // orange-500
                          if(result.level === 'Medium') levelColor = [234, 179, 8]; // yellow-500
                          if(result.level === 'Low') levelColor = [16, 185, 129]; // emerald-500

                          doc.setFillColor(levelColor[0], levelColor[1], levelColor[2]);
                          doc.rect(80, resultY, 50, 25, 'F');
                          doc.setFontSize(12);
                          doc.setTextColor(255, 255, 255);
                          doc.text('Risk Level', 105, resultY + 8, { align: 'center' });
                          doc.setFontSize(20);
                          doc.text(result.level.toUpperCase(), 105, resultY + 18, { align: 'center' });
                          
                          // Years Box
                          doc.setFillColor(34, 211, 238); // cyan-400
                          doc.rect(140, resultY, 50, 25, 'F');
                          doc.setFontSize(12);
                          doc.setTextColor(15, 23, 42);
                          doc.text('Years Until Risk', 165, resultY + 8, { align: 'center' });
                          doc.setFontSize(22);
                          doc.text(`${result.yearsUntilRisk}`, 165, resultY + 18, { align: 'center' });

                          // 4. Recommendations
                          const recY = resultY + 45;
                          doc.setFontSize(16);
                          doc.setTextColor(15, 23, 42);
                          doc.setFont('helvetica', 'bold');
                          doc.text('Actionable Recommendations', 20, recY);

                          const recsData = result.recommendations.map((rec: string) => [rec]);
                          
                          autoTable(doc, {
                            startY: recY + 6,
                            body: recsData,
                            theme: 'plain',
                            styles: { fontSize: 11, textColor: [51, 65, 85], cellPadding: 4 },
                            columnStyles: { 0: { cellWidth: 170 } },
                            didParseCell: function(data) {
                              if (data.section === 'body') {
                                data.cell.text = data.cell.text.map(t => '• ' + t);
                              }
                            }
                          });

                          // Footer
                          const pageHeight = doc.internal.pageSize.height;
                          doc.setFontSize(10);
                          doc.setTextColor(150, 150, 150);
                          doc.text('Generated by Novocrypt Algorithm Lab', pageWidth / 2, pageHeight - 10, { align: 'center' });
                          
                          doc.save('Quantum-Risk-Report.pdf');
                        }}
                        variant="primary"
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 transition-all"
                      >
                        <Download className="w-5 h-5" /> Export PDF Report
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
