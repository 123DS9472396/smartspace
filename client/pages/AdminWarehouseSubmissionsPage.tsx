import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Clock, XCircle, RefreshCw, Search, Warehouse, FileText } from "lucide-react";

interface WarehouseSubmission {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_area: number;
  price_per_sqft: number;
  amenities: string[];
  features: string[];
  image_urls: string[];
  document_urls: any;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  warehouse_type?: string;
  allowed_goods_types?: string[];
}

export default function AdminWarehouseSubmissionsPage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<WarehouseSubmission[]>([]);
  const [selected, setSelected] = useState<WarehouseSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      console.log('📦 Admin: Fetching warehouse submissions...');
      const response = await fetch("/api/admin/warehouse-submissions");
      
      if (!response.ok) {
        console.error('❌ Admin submissions API error:', response.status, response.statusText);
        toast({
          title: 'Failed to load submissions',
          description: `Server returned ${response.status}. Check server logs.`,
          variant: 'destructive'
        });
        return;
      }

      const data = await response.json();
      console.log('📦 Admin submissions response:', data);
      
      if (data.success) {
        setSubmissions(data.submissions || []);
        console.log(`✅ Loaded ${data.submissions?.length || 0} submissions`);
      } else {
        console.error('❌ API returned error:', data.error);
        toast({
          title: 'Error loading submissions',
          description: data.error || 'Unknown error',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('❌ Error loading submissions:', error);
      toast({
        title: 'Connection error',
        description: 'Could not reach the server. Make sure the dev server is running.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return submissions;
    const term = searchTerm.toLowerCase();
    return submissions.filter(s =>
      s.name?.toLowerCase().includes(term) ||
      s.city?.toLowerCase().includes(term) ||
      s.owner_id?.toLowerCase().includes(term)
    );
  }, [submissions, searchTerm]);

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-green-900/40 text-green-400 border-green-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-900/40 text-red-400 border-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    return <Badge className="bg-yellow-900/40 text-yellow-400 border-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selected) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/warehouse-submissions/review", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selected.id,
          decision,
          adminNotes,
          rejectionReason: decision === 'rejected' ? rejectionReason : null,
          reviewedBy: user?.id || null
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update submission');
      }
      toast({
        title: decision === 'approved' ? 'Warehouse Approved' : 'Warehouse Rejected',
        description: decision === 'approved' ? 'Submission approved and published.' : 'Submission rejected successfully.'
      });
      setAdminNotes('');
      setRejectionReason('');
      setSelected(null);
      await fetchSubmissions();
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Unable to update submission',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (profile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center text-gray-400">Admin access only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Warehouse className="h-8 w-8 text-blue-400" />
              Warehouse Submissions
            </h1>
            <p className="text-gray-400 mt-1">Review and approve owner-listed warehouses</p>
          </div>
          <Button variant="outline" onClick={fetchSubmissions} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800/50 border-gray-700 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-400" /> Submissions
              </CardTitle>
              <Input
                placeholder="Search by name or city"
                className="bg-gray-900 border-gray-700 text-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardHeader>
            <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
              {loading && <p className="text-gray-400">Loading...</p>}
              {!loading && filtered.length === 0 && <p className="text-gray-400">No submissions found.</p>}
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full text-left rounded-lg border p-3 transition ${selected?.id === item.id ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-900/30 hover:border-gray-500'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.city}, {item.state}</p>
                    </div>
                    {statusBadge(item.status)}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" /> Submission Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selected && (
                <div className="text-gray-400">Select a submission to review.</div>
              )}
              {selected && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selected.name}</h2>
                    <p className="text-gray-400">{selected.address}, {selected.city}, {selected.state} - {selected.pincode}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {statusBadge(selected.status)}
                      {selected.warehouse_type && <Badge variant="outline" className="border-blue-600 text-blue-300">{selected.warehouse_type}</Badge>}
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Total Area</p>
                      <p className="text-white font-semibold">{Number(selected.total_area).toLocaleString()} sq ft</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Price per sq ft</p>
                      <p className="text-white font-semibold">₹{Number(selected.price_per_sqft).toLocaleString()}</p>
                    </div>
                  </div>

                  {selected.allowed_goods_types?.length ? (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Allowed Goods Types</p>
                      <div className="flex flex-wrap gap-2">
                        {selected.allowed_goods_types.map(g => (
                          <Badge key={g} variant="outline" className="border-gray-600 text-gray-300">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Description</p>
                    <p className="text-gray-200">{selected.description || 'No description provided.'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {(selected.amenities || []).map(a => (
                          <Badge key={a} variant="outline" className="border-gray-700 text-gray-300">{a}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Features</p>
                      <div className="flex flex-wrap gap-2">
                        {(selected.features || []).map(f => (
                          <Badge key={f} variant="outline" className="border-gray-700 text-gray-300">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Admin Notes</label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-gray-100"
                        placeholder="Add notes for this submission"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Rejection Reason (if rejecting)</label>
                      <Input
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-gray-100"
                        placeholder="Provide reason for rejection"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        disabled={processing || selected.status === 'approved'}
                        onClick={() => handleDecision('approved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={processing || selected.status === 'rejected'}
                        onClick={() => handleDecision('rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
