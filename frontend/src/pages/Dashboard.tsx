import React from 'react';
import { Card, Button } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { ScrollReveal } from '../components/ui/ScrollReveal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h1 className="text-4xl font-bold text-white mb-8">Your Dashboard</h1>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          <ScrollReveal delay={0.1}>
            <Card>
              <h2 className="text-2xl font-bold text-white mb-4">Risk Assessments</h2>
              <p className="text-slate-600 mb-4">
                View your previous risk assessments and download reports
              </p>
              <Button
                onClick={() => navigate('/risk')}
                variant="primary"
                className="w-full"
              >
                View Assessments
              </Button>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Card>
              <h2 className="text-2xl font-bold text-white mb-4">Lab Sessions</h2>
              <p className="text-slate-600 mb-4">
                Access your RSA algorithm lab experiments and results
              </p>
              <Button
                onClick={() => navigate('/lab')}
                variant="primary"
                className="w-full"
              >
                View Labs
              </Button>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <Card>
              <h2 className="text-2xl font-bold text-white mb-4">Reports</h2>
              <p className="text-slate-600 mb-4">
                Download and manage your quantum risk reports
              </p>
              <Button
                variant="secondary"
                className="w-full"
                disabled
              >
                Coming Soon
              </Button>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};
