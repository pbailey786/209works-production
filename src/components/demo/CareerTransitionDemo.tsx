'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from 'lucide-react';

export default function CareerTransitionDemo() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const scenarios = [
    {
      id: 'retail-to-tech',
      title: 'Retail Worker → Software Developer',
      currentJob: 'Target Cashier',
      targetJob: 'Software Developer',
      user: 'Sarah, 26, Stockton',
      query: "I work at Target but I'm interested in becoming a software developer. Is that realistic?",
      response: {
        message: "Absolutely! 45 people in the 209 area have made this exact transition with a 78% success rate 🚀 You'd typically see a 35% salary increase ($35k → $70k) and it takes about 6-12 months with the right training.",
        insights: {
          transitionCount: 45,
          successRate: 78,
          salaryIncrease: 35,
          timeframe: '6-12 months',
          reasons: ['Better salary', 'Career growth', 'Remote work opportunities']
        },
        training: [
          {
            name: 'Full Stack Web Development',
            provider: 'San Joaquin Delta College',
            duration: '6 months',
            cost: '$3,500'
          },
          {
            name: 'Google IT Support Certificate',
            provider: 'Coursera',
            duration: '3-6 months',
            cost: '$49/month'
          }
        ],
        nextSteps: [
          'Start with free coding tutorials (FreeCodeCamp)',
          'Apply for coding bootcamp scholarships',
          'Network with local tech professionals',
          'Build a portfolio of projects'
        ]
      }
    },
    {
      id: 'service-to-sales',
      title: 'Customer Service → Sales Representative',
      currentJob: 'Call Center Rep',
      targetJob: 'Sales Representative',
      user: 'Mike, 32, Modesto',
      query: "I do customer service but want to get into sales for better money. What should I expect?",
      response: {
        message: "Great move! 32 people made this transition with an 85% success rate 💪 You're looking at a 23% salary bump ($42k → $52k) and your customer service skills are perfect for sales!",
        insights: {
          transitionCount: 32,
          successRate: 85,
          salaryIncrease: 23,
          timeframe: '3-6 months',
          reasons: ['Commission potential', 'Career advancement', 'Skill development']
        },
        training: [
          {
            name: 'Sales Fundamentals Certificate',
            provider: 'Modesto Junior College',
            duration: '8 weeks',
            cost: '$800'
          },
          {
            name: 'HubSpot Sales Certification',
            provider: 'HubSpot Academy',
            duration: '2 weeks',
            cost: 'Free'
          }
        ],
        nextSteps: [
          'Highlight customer service achievements on resume',
          'Practice sales scenarios and objection handling',
          'Research local companies with sales openings',
          'Consider starting with inside sales roles'
        ]
      }
    },
    {
      id: 'teacher-to-corporate',
      title: 'Teacher → Corporate Trainer',
      currentJob: 'Elementary Teacher',
      targetJob: 'Corporate Trainer',
      user: 'Lisa, 29, Tracy',
      query: "I'm a teacher but want to move to corporate training. How do I make that jump?",
      response: {
        message: "Perfect transition! 24 teachers have made this move with an 82% success rate 🎯 You'd see an 18% salary increase and your teaching skills translate beautifully to corporate training!",
        insights: {
          transitionCount: 24,
          successRate: 82,
          salaryIncrease: 18,
          timeframe: '4-8 months',
          reasons: ['Better compensation', 'Professional development', 'Industry change']
        },
        training: [
          {
            name: 'Corporate Training & Development',
            provider: 'University of the Pacific',
            duration: '12 weeks',
            cost: '$2,400'
          },
          {
            name: 'ATD Certification',
            provider: 'Association for Talent Development',
            duration: '6 months',
            cost: '$1,200'
          }
        ],
        nextSteps: [
          'Reframe teaching experience as training experience',
          'Learn corporate learning management systems',
          'Volunteer to train colleagues or community groups',
          'Network with HR professionals in the area'
        ]
      }
    }
  ];

  const tradeSchoolOpportunities = [
    {
      school: 'San Joaquin Valley College',
      programs: ['Medical Assistant', 'HVAC Technician', 'Dental Assistant'],
      targetAudience: 'Retail workers wanting healthcare careers',
      avgSalaryIncrease: '45%',
      timeToComplete: '8-18 months'
    },
    {
      school: 'Carrington College',
      programs: ['Pharmacy Technician', 'Veterinary Assistant', 'Medical Office Administration'],
      targetAudience: 'Customer service reps wanting healthcare careers',
      avgSalaryIncrease: '35%',
      timeToComplete: '6-12 months'
    },
    {
      school: 'WyoTech',
      programs: ['Automotive Technology', 'Diesel Technology', 'Collision Refinishing'],
      targetAudience: 'Manufacturing workers wanting skilled trades',
      avgSalaryIncrease: '25%',
      timeToComplete: '9-21 months'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🤖 Career Transition Intelligence Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          See how JobsGPT uses real transition data to help people make smart career moves in the 209 area
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((scenario) => (
          <Card 
            key={scenario.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedScenario === scenario.id ? 'ring-2 ring-orange-500' : ''
            }`}
            onClick={() => setSelectedScenario(scenario.id)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{scenario.title}</CardTitle>
              <CardDescription>{scenario.user}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Current:</span> {scenario.currentJob}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Target:</span> {scenario.targetJob}
                </div>
                <div className="text-sm text-gray-600 italic">
                  "{scenario.query.slice(0, 60)}..."
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Scenario Details */}
      {selectedScenario && (
        <div className="space-y-6">
          {(() => {
            const scenario = scenarios.find(s => s.id === selectedScenario)!;
            return (
              <>
                {/* User Query */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      User Query
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-900 italic">"{scenario.query}"</p>
                      <p className="text-blue-700 text-sm mt-2">- {scenario.user}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Response */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      JobsGPT Response
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-900">{scenario.response.message}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Transition Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Transition Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-600">
                          {scenario.response.insights.transitionCount}
                        </div>
                        <div className="text-sm text-orange-700">People made this transition</div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {scenario.response.insights.successRate}%
                        </div>
                        <div className="text-sm text-green-700">Success rate</div>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          +{scenario.response.insights.salaryIncrease}%
                        </div>
                        <div className="text-sm text-blue-700">Salary increase</div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-purple-600">
                          {scenario.response.insights.timeframe}
                        </div>
                        <div className="text-sm text-purple-700">Timeline</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Top Reasons for Transition:</h4>
                      <div className="flex flex-wrap gap-2">
                        {scenario.response.insights.reasons.map((reason, idx) => (
                          <Badge key={idx} variant="outline">{reason}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Training Programs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Recommended Training Programs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scenario.response.training.map((program, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{program.name}</h4>
                          <p className="text-sm text-gray-600">{program.provider}</p>
                          <div className="mt-2 flex justify-between text-sm">
                            <span>Duration: {program.duration}</span>
                            <span className="font-medium">{program.cost}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {scenario.response.nextSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      )}

      {/* Trade School Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Trade School Targeting Opportunities
          </CardTitle>
          <CardDescription>
            How trade schools can target specific career transition groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tradeSchoolOpportunities.map((school, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">{school.school}</h4>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700">Programs:</h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {school.programs.map((program, pidx) => (
                        <Badge key={pidx} variant="secondary" className="text-xs">
                          {program}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700">Target Audience:</h5>
                    <p className="text-sm text-gray-600">{school.targetAudience}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-green-600">+{school.avgSalaryIncrease}</span>
                      <div className="text-gray-600">Avg salary increase</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">{school.timeToComplete}</span>
                      <div className="text-gray-600">Time to complete</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-orange-50 to-green-50">
        <CardContent className="text-center py-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Build This Into Your Platform? 🚀
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            This career transition intelligence can be integrated directly into JobsGPT, 
            helping users make informed career decisions while providing valuable targeting 
            data for employers and training providers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
              Integrate with JobsGPT
            </Button>
            <Button size="lg" variant="outline">
              View Technical Implementation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
