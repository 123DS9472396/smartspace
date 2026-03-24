import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Award, ArrowRight, CheckCircle, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

export default function About() {
  const stats = [
    { label: "Active Warehouses", value: "500+", icon: Building2 },
    { label: "Happy Clients", value: "1,200+", icon: Users },
    { label: "Cities Covered", value: "15+", icon: Target },
    { label: "Space Matched", value: "2M+ sq ft", icon: Award }
  ];

  const values = [
    {
      title: "Transparency",
      description: "We believe in complete transparency in all our dealings, providing accurate information and fair pricing.",
      icon: CheckCircle
    },
    {
      title: "Innovation",
      description: "Leveraging cutting-edge technology to make warehouse discovery and leasing seamless and efficient.",
      icon: Target
    },
    {
      title: "Customer First",
      description: "Our customers' success is our success. We go above and beyond to meet their warehouse space needs.",
      icon: Users
    },
    {
      title: "Quality Assurance",
      description: "Every warehouse on our platform is verified and meets our strict quality and safety standards.",
      icon: Award
    }
  ];

  const team = [
    {
      name: "Dipesh Sharma",
      role: "Lead Developer",
      bio: "Architecture, backend services, and deployment"
    },
    {
      name: "Manthan Shinde",
      role: "Frontend Developer",
      bio: "UI systems, design consistency, and UX flows"
    },
    {
      name: "Sahil Shinde",
      role: "Full Stack Developer",
      bio: "API integrations, auth, and data pipelines"
    },
    {
      name: "Pranjal Zambre",
      role: "QA & Automation",
      bio: "Quality assurance, test automation, and validation"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Revolutionizing
              <span className="block text-blue-400">Warehouse Discovery</span>
            </h1>
            <p className="text-xl text-slate-200 leading-relaxed mb-8">
              SmartSpace is India's leading marketplace connecting businesses with the perfect warehouse spaces. 
              We're making warehouse discovery simple, transparent, and efficient for everyone.
            </p>
            <div className="grid md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-slate-200 mb-6 leading-relaxed">
                We believe that finding the right warehouse space shouldn't be complicated, time-consuming, or opaque. 
                Our mission is to create a transparent, efficient marketplace where businesses can easily discover and 
                secure warehouse spaces that perfectly match their needs.
              </p>
              <p className="text-lg text-slate-200 mb-8 leading-relaxed">
                By leveraging technology and building trust between warehouse owners and businesses, we're helping 
                optimize warehouse utilization across India while enabling businesses to scale efficiently.
              </p>
              <Button size="lg" asChild>
                <Link to="/warehouses">
                  Explore Warehouses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                <img
                  src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80"
                  alt="Modern warehouse operations"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-slate-900 p-6 rounded-xl shadow-xl border border-slate-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">98%</div>
                  <div className="text-sm text-slate-300">Customer Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Our Values
            </h2>
            <p className="text-xl text-slate-200 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center p-6 border border-slate-800 bg-slate-900/70 shadow-lg">
                <value.icon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <CardTitle className="text-lg mb-3 text-white">{value.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed text-slate-300">
                  {value.description}
                </CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-slate-200 max-w-2xl mx-auto">
              The developers building SmartSpace
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center overflow-hidden border border-slate-800 bg-slate-900/70">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{member.name}</CardTitle>
                  <CardDescription className="text-blue-400 font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8">
              Our Story
            </h2>
            <div className="space-y-6 text-lg leading-relaxed">
              <p>
                SmartSpace was born out of a simple observation: finding warehouse space in India was 
                unnecessarily complex and time-consuming. Business owners would spend weeks calling brokers, 
                visiting properties, and negotiating terms without having a clear picture of what was available.
              </p>
              <p>
                Meanwhile, warehouse owners struggled to efficiently market their available spaces and connect 
                with the right tenants. This inefficiency was costing both sides time, money, and opportunities.
              </p>
              <p>
                Founded in 2023, we set out to create a technology-driven solution that would bring transparency, 
                efficiency, and trust to the warehouse rental market. Today, we're proud to be India's fastest-growing 
                warehouse marketplace, serving hundreds of businesses across the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to Join Our Mission?
            </h2>
            <p className="text-xl text-slate-200">
              Whether you're looking for warehouse space or have space to offer, we'd love to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/warehouses">
                  Find Warehouses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-slate-600 text-slate-200 hover:bg-slate-800">
                <Link to="/list-property">List Your Property</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
